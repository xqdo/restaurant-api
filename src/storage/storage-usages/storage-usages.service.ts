import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { CreateStorageUsageDto } from '../dto/create-storage-usage.dto';
import { FilterStorageUsagesDto } from '../dto/filter-storage-usages.dto';

@Injectable()
export class StorageUsagesService {
  private readonly logger = new Logger(StorageUsagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Find all storage usages with optional filters
   */
  async findAll(query: FilterStorageUsagesDto) {
    this.logger.debug(`Finding storage usages with filters: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: {
        isdeleted: false,
      },
    };

    // Filter by storage item
    if (query.storage_item_id) {
      where.storage_item_id = query.storage_item_id;
    }

    // Filter by reason
    if (query.reason) {
      where.reason = query.reason;
    }

    // Filter by date range
    if (query.start_date || query.end_date) {
      where.usage_date = {};
      if (query.start_date) {
        where.usage_date.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        where.usage_date.lte = new Date(query.end_date);
      }
    }

    return this.prisma.storageUsage.findMany({
      where,
      include: {
        storageItem: true,
        baseEntity: true,
      },
      orderBy: {
        usage_date: 'desc',
      },
    });
  }

  /**
   * Find one storage usage by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding storage usage with ID: ${id}`);

    const usage = await this.prisma.storageUsage.findUnique({
      where: { id },
      include: {
        storageItem: true,
        baseEntity: true,
      },
    });

    if (!usage || usage.baseEntity.isdeleted) {
      throw new NotFoundException(`Storage usage with ID ${id} not found`);
    }

    return usage;
  }

  /**
   * Create new storage usage (decreases quantity)
   */
  async create(createDto: CreateStorageUsageDto, userId: number) {
    this.logger.debug(`Creating storage usage for item ID: ${createDto.storage_item_id}`);

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

      // 2. CRITICAL: Validate sufficient quantity available
      if (Number(storageItem.current_quantity) < createDto.quantity) {
        throw new BadRequestException(
          `Insufficient quantity. Available: ${storageItem.current_quantity} ${storageItem.unit}, ` +
          `Requested: ${createDto.quantity} ${storageItem.unit}`
        );
      }

      // 3. Create base entity
      const baseEntity = await tx.baseEntity.create({
        data: {
          created_at: new Date(),
          created_by: userId,
          isdeleted: false,
        },
      });

      // 4. Create usage record
      const usage = await tx.storageUsage.create({
        data: {
          storage_item_id: createDto.storage_item_id,
          quantity: createDto.quantity,
          reason: createDto.reason,
          notes: createDto.notes,
          usage_date: createDto.usage_date ? new Date(createDto.usage_date) : new Date(),
          base_entity_id: baseEntity.id,
        },
        include: {
          storageItem: true,
          baseEntity: true,
        },
      });

      // 5. Update storage item quantity (-)
      await tx.storageItem.update({
        where: { id: createDto.storage_item_id },
        data: {
          current_quantity: {
            decrement: createDto.quantity,
          },
        },
      });

      return usage;
    });
  }

  /**
   * Soft delete storage usage (reverses quantity - adds back)
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting storage usage with ID: ${id}`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate usage exists
      const usage = await tx.storageUsage.findUnique({
        where: { id },
        include: { baseEntity: true },
      });

      if (!usage || usage.baseEntity.isdeleted) {
        throw new NotFoundException(`Storage usage with ID ${id} not found`);
      }

      // 2. Soft delete the usage
      await tx.baseEntity.update({
        where: { id: usage.base_entity_id },
        data: {
          deleted_at: new Date(),
          deleted_by: userId,
          isdeleted: true,
        },
      });

      // 3. Reverse the quantity (add back)
      await tx.storageItem.update({
        where: { id: usage.storage_item_id },
        data: {
          current_quantity: {
            increment: usage.quantity,
          },
        },
      });

      return { message: 'Storage usage deleted and quantity restored' };
    });
  }
}
