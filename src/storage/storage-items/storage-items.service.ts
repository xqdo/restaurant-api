import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { CreateStorageItemDto } from '../dto/create-storage-item.dto';
import { UpdateStorageItemDto } from '../dto/update-storage-item.dto';
import { FilterStorageItemsDto } from '../dto/filter-storage-items.dto';

@Injectable()
export class StorageItemsService {
  private readonly logger = new Logger(StorageItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Find all storage items with optional filters
   */
  async findAll(query: FilterStorageItemsDto) {
    this.logger.debug(`Finding storage items with filters: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: {
        isdeleted: false,
      },
    };

    // Search by name (case-insensitive)
    if (query.search) {
      where.name = {
        contains: query.search,
      };
    }

    // Filter by unit
    if (query.unit) {
      where.unit = query.unit;
    }

    const items = await this.prisma.storageItem.findMany({
      where,
      include: {
        baseEntity: true,
        vendor: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter for low stock if requested
    if (query.low_stock) {
      return items.filter(item =>
        item.min_quantity !== null &&
        Number(item.current_quantity) < Number(item.min_quantity)
      );
    }

    return items;
  }

  /**
   * Find one storage item by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding storage item with ID: ${id}`);

    const item = await this.prisma.storageItem.findUnique({
      where: { id },
      include: {
        baseEntity: true,
        vendor: true,
        storageEntries: {
          include: { baseEntity: true },
          where: { baseEntity: { isdeleted: false } },
          orderBy: { entry_date: 'desc' },
          take: 10,
        },
        storageUsages: {
          include: { baseEntity: true },
          where: { baseEntity: { isdeleted: false } },
          orderBy: { usage_date: 'desc' },
          take: 10,
        },
      },
    });

    if (!item || item.baseEntity.isdeleted) {
      throw new NotFoundException(`Storage item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Create new storage item
   */
  async create(createDto: CreateStorageItemDto, userId: number) {
    this.logger.debug(`Creating storage item: ${createDto.name}`);

    // Create base entity
    const baseEntity = await this.baseEntityService.create(userId);

    return this.prisma.storageItem.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        unit: createDto.unit,
        current_quantity: 0,
        min_quantity: createDto.min_quantity,
        vendor_id: createDto.vendor_id,
        base_entity_id: baseEntity.id,
      },
      include: {
        baseEntity: true,
        vendor: true,
      },
    });
  }

  /**
   * Update storage item
   */
  async update(id: number, updateDto: UpdateStorageItemDto, userId: number) {
    this.logger.debug(`Updating storage item with ID: ${id}`);

    // Validate item exists
    const item = await this.findOne(id);

    // Update base entity audit trail
    await this.baseEntityService.update(item.base_entity_id, userId);

    return this.prisma.storageItem.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        unit: updateDto.unit,
        min_quantity: updateDto.min_quantity,
        vendor_id: updateDto.vendor_id,
      },
      include: {
        baseEntity: true,
        vendor: true,
      },
    });
  }

  /**
   * Soft delete storage item
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting storage item with ID: ${id}`);

    // Validate item exists
    const item = await this.findOne(id);

    // Soft delete via BaseEntityService
    await this.baseEntityService.softDelete(item.base_entity_id, userId);

    return { message: 'Storage item deleted successfully' };
  }

  /**
   * Get items below minimum quantity threshold
   */
  async getLowStockItems() {
    this.logger.debug('Finding low stock items');

    const items = await this.prisma.storageItem.findMany({
      where: {
        baseEntity: { isdeleted: false },
        min_quantity: { not: null },
      },
      include: {
        baseEntity: true,
        vendor: true,
      },
    });

    return items.filter(item =>
      Number(item.current_quantity) < Number(item.min_quantity)
    );
  }
}
