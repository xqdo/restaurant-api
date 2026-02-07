import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { CreateStorageEntryDto } from '../dto/create-storage-entry.dto';
import { FilterStorageEntriesDto } from '../dto/filter-storage-entries.dto';

@Injectable()
export class StorageEntriesService {
  private readonly logger = new Logger(StorageEntriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Find all storage entries with optional filters
   */
  async findAll(query: FilterStorageEntriesDto) {
    this.logger.debug(`Finding storage entries with filters: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: {
        isdeleted: false,
      },
    };

    // Filter by storage item
    if (query.storage_item_id) {
      where.storage_item_id = query.storage_item_id;
    }

    // Filter by supplier
    if (query.supplier) {
      where.supplier = {
        contains: query.supplier,
      };
    }

    // Filter by date range
    if (query.start_date || query.end_date) {
      where.entry_date = {};
      if (query.start_date) {
        where.entry_date.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        where.entry_date.lte = new Date(query.end_date);
      }
    }

    return this.prisma.storageEntry.findMany({
      where,
      include: {
        storageItem: true,
        vendor: true,
        baseEntity: true,
      },
      orderBy: {
        entry_date: 'desc',
      },
    });
  }

  /**
   * Find one storage entry by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding storage entry with ID: ${id}`);

    const entry = await this.prisma.storageEntry.findUnique({
      where: { id },
      include: {
        storageItem: true,
        vendor: true,
        baseEntity: true,
      },
    });

    if (!entry || entry.baseEntity.isdeleted) {
      throw new NotFoundException(`Storage entry with ID ${id} not found`);
    }

    return entry;
  }

  /**
   * Create new storage entry (increases quantity)
   */
  async create(createDto: CreateStorageEntryDto, userId: number) {
    this.logger.debug(`Creating storage entry for item ID: ${createDto.storage_item_id}`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate storage item exists
      const storageItem = await tx.storageItem.findUnique({
        where: { id: createDto.storage_item_id },
        include: { baseEntity: true },
      });

      if (!storageItem || storageItem.baseEntity.isdeleted) {
        throw new NotFoundException(
          `Storage item with ID ${createDto.storage_item_id} not found`
        );
      }

      // 2. Create base entity
      const baseEntity = await tx.baseEntity.create({
        data: {
          created_at: new Date(),
          created_by: userId,
          isdeleted: false,
        },
      });

      // 3. Create entry record
      const entry = await tx.storageEntry.create({
        data: {
          storage_item_id: createDto.storage_item_id,
          quantity: createDto.quantity,
          unit_price: createDto.unit_price,
          supplier: createDto.supplier,
          vendor_id: createDto.vendor_id,
          notes: createDto.notes,
          entry_date: createDto.entry_date ? new Date(createDto.entry_date) : new Date(),
          base_entity_id: baseEntity.id,
        },
        include: {
          storageItem: true,
          baseEntity: true,
        },
      });

      // 4. Update storage item quantity (+)
      await tx.storageItem.update({
        where: { id: createDto.storage_item_id },
        data: {
          current_quantity: {
            increment: createDto.quantity,
          },
        },
      });

      return entry;
    });
  }

  /**
   * Soft delete storage entry (reverses quantity)
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting storage entry with ID: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate entry exists
      const entry = await tx.storageEntry.findUnique({
        where: { id },
        include: { baseEntity: true },
      });

      if (!entry || entry.baseEntity.isdeleted) {
        throw new NotFoundException(`Storage entry with ID ${id} not found`);
      }

      // 2. Check if reversing would make quantity negative
      const storageItem = await tx.storageItem.findUnique({
        where: { id: entry.storage_item_id },
      });

      if (!storageItem) {
        throw new NotFoundException(`Storage item with ID ${entry.storage_item_id} not found`);
      }

      const newQuantity = Number(storageItem.current_quantity) - Number(entry.quantity);
      if (newQuantity < 0) {
        throw new BadRequestException(
          `Cannot delete entry: would result in negative quantity. ` +
          `Current: ${storageItem.current_quantity}, Entry: ${entry.quantity}`
        );
      }

      // 3. Soft delete the entry
      await tx.baseEntity.update({
        where: { id: entry.base_entity_id },
        data: {
          deleted_at: new Date(),
          deleted_by: userId,
          isdeleted: true,
        },
      });

      // 4. Reverse the quantity
      await tx.storageItem.update({
        where: { id: entry.storage_item_id },
        data: {
          current_quantity: {
            decrement: entry.quantity,
          },
        },
      });

      return { message: 'Storage entry deleted and quantity reversed' };
    });
  }
}
