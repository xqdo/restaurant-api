import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { FilterReceiptsDto } from './dto/filter-receipts.dto';
import { StatusEnum } from '@prisma/client';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Create new receipt with items
   * Uses transaction to ensure data consistency
   */
  async create(dto: CreateReceiptDto, userId: number) {
    this.logger.debug(`Creating receipt: ${JSON.stringify(dto)}`);

    // Validation: Delivery orders need phone and location
    if (dto.is_delivery && (!dto.phone_number || !dto.location)) {
      throw new BadRequestException(
        'Delivery orders require phone_number and location',
      );
    }

    // Validation: Dine-in orders need table
    if (!dto.is_delivery && !dto.table_id) {
      throw new BadRequestException('Dine-in orders require table_id');
    }

    // Validate table exists and is available (if dine-in)
    if (dto.table_id) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.table_id },
        include: { baseEntity: true },
      });

      if (!table || table.baseEntity.isdeleted) {
        throw new NotFoundException(`Table with ID ${dto.table_id} not found`);
      }

      if (table.status !== 'AVAILABLE') {
        throw new BadRequestException(
          `Table ${table.number} is not available (current status: ${table.status})`,
        );
      }
    }

    // Validate all items exist
    const itemIds = dto.items.map((item) => item.item_id);
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        baseEntity: { isdeleted: false },
      },
    });

    if (items.length !== itemIds.length) {
      const foundIds = items.map((i) => i.id);
      const missingIds = itemIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Items not found or deleted: ${missingIds.join(', ')}`,
      );
    }

    // Create receipt with transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create base entity for receipt
      const receiptBaseEntity = await tx.baseEntity.create({
        data: {
          created_at: new Date(),
          created_by: userId,
        },
      });

      // 2. Get next receipt number
      const lastReceipt = await tx.receipt.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextNumber = (lastReceipt?.number || 0) + 1;

      this.logger.debug(`Assigning receipt number: ${nextNumber}`);

      // 3. Create receipt
      const receipt = await tx.receipt.create({
        data: {
          number: nextNumber,
          is_delivery: dto.is_delivery,
          phone_number: dto.phone_number,
          location: dto.location,
          notes: dto.notes,
          table_id: dto.table_id,
          base_entity_id: receiptBaseEntity.id,
        },
      });

      // 4. Create receipt items
      const receiptItems: any[] = [];
      for (const itemDto of dto.items) {
        const itemBaseEntity = await tx.baseEntity.create({
          data: {
            created_at: new Date(),
            created_by: userId,
          },
        });

        const receiptItem = await tx.receiptItem.create({
          data: {
            receipt_id: receipt.id,
            item_id: itemDto.item_id,
            quantity: itemDto.quantity,
            status: StatusEnum.pending,
            notes: itemDto.notes,
            base_entity_id: itemBaseEntity.id,
          },
          include: {
            item: true,
          },
        });

        receiptItems.push(receiptItem);
      }

      // 5. Update table status to OCCUPIED (if dine-in)
      if (dto.table_id) {
        await tx.table.update({
          where: { id: dto.table_id },
          data: { status: 'OCCUPIED' },
        });
        this.logger.debug(`Table ${dto.table_id} status updated to OCCUPIED`);
      }

      // 6. Calculate total
      const totals = await this.calculateTotal(receipt.id, tx);

      this.logger.log(`Receipt ${receipt.number} created successfully with ${receiptItems.length} items`);

      return {
        ...receipt,
        items: receiptItems,
        ...totals,
      };
    });
  }

  /**
   * Get receipt by ID with all details
   */
  async findOne(id: number) {
    this.logger.debug(`Finding receipt with ID: ${id}`);

    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        baseEntity: {
          include: {
            createdByUser: {
              select: { id: true, fullname: true, username: true },
            },
          },
        },
        table: true,
        receiptItems: {
          where: {
            baseEntity: { isdeleted: false },
          },
          include: {
            item: {
              include: {
                section: true,
              },
            },
            baseEntity: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
        receiptDiscounts: {
          include: {
            discount: true,
          },
        },
      },
    });

    if (!receipt || receipt.baseEntity.isdeleted) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }

    const totals = await this.calculateTotal(id);

    return {
      ...receipt,
      ...totals,
    };
  }

  /**
   * List receipts with filters and pagination
   */
  async findAll(query: FilterReceiptsDto) {
    this.logger.debug(`Finding receipts with filters: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: { isdeleted: false },
    };

    // Filter by delivery
    if (query.is_delivery !== undefined) {
      where.is_delivery = query.is_delivery;
    }

    // Filter by table
    if (query.table_id) {
      where.table_id = query.table_id;
    }

    // Filter by date range
    if (query.start_date || query.end_date) {
      where.baseEntity = {
        ...where.baseEntity,
        created_at: {},
      };
      if (query.start_date) {
        where.baseEntity.created_at.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        where.baseEntity.created_at.lte = new Date(query.end_date);
      }
    }

    const page = query.page || 1;
    const perPage = query.perPage || 10;
    const skip = (page - 1) * perPage;

    const [receipts, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        include: {
          table: true,
          receiptItems: {
            where: { baseEntity: { isdeleted: false } },
          },
          baseEntity: {
            include: {
              createdByUser: {
                select: { id: true, fullname: true },
              },
            },
          },
        },
        orderBy: { number: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Calculate receipt total
   * Subtotal = sum(item.price * quantity)
   * Discount = sum of all discounts (Phase 4)
   * Total = subtotal - discount
   */
  async calculateTotal(receiptId: number, tx?: any) {
    const prisma = tx || this.prisma;

    const receiptItems = await prisma.receiptItem.findMany({
      where: {
        receipt_id: receiptId,
        baseEntity: { isdeleted: false },
      },
      include: { item: true },
    });

    // Calculate subtotal
    const subtotal = receiptItems.reduce((sum, ri) => {
      return sum + Number(ri.item.price) * Number(ri.quantity);
    }, 0);

    // Get discounts (Phase 4 will implement this - for now return 0)
    const receiptItemDiscounts = await prisma.receiptItemDiscount.findMany({
      where: {
        receiptItem: {
          receipt_id: receiptId,
        },
      },
    });

    const totalDiscount =
      receiptItemDiscounts.reduce(
        (sum, rid) => sum + Number(rid.applied_amount),
        0,
      ) || 0;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      total_discount: Number(totalDiscount.toFixed(2)),
      total: Number((subtotal - totalDiscount).toFixed(2)),
    };
  }

  /**
   * Complete receipt (mark as paid)
   * Updates table status back to AVAILABLE for dine-in orders
   */
  async complete(id: number, userId: number) {
    this.logger.debug(`Completing receipt ${id}`);

    const receipt = await this.findOne(id);

    // Update base entity audit trail
    await this.baseEntityService.update(receipt.base_entity_id, userId);

    // Update table to AVAILABLE (if dine-in)
    if (receipt.table_id) {
      await this.prisma.table.update({
        where: { id: receipt.table_id },
        data: { status: 'AVAILABLE' },
      });
      this.logger.debug(`Table ${receipt.table_id} status updated to AVAILABLE`);
    }

    this.logger.log(`Receipt ${receipt.number} completed successfully. Total: $${receipt.total}`);

    return {
      message: 'Receipt completed successfully',
      receipt_id: id,
      receipt_number: receipt.number,
      total: receipt.total,
    };
  }
}
