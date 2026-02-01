import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PriceHistoryService {
  private readonly logger = new Logger(PriceHistoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Record a price change for an item
   * Closes the previous price record and creates a new one
   */
  async recordPriceChange(
    itemId: number,
    newPrice: number | Decimal,
    userId: number,
  ) {
    this.logger.debug(`Recording price change for item ${itemId}: ${newPrice}`);

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Close the current price record (set effective_to)
      await tx.itemPriceHistory.updateMany({
        where: {
          item_id: itemId,
          effective_to: null,
        },
        data: {
          effective_to: now,
        },
      });

      // Create base entity for audit
      const baseEntity = await tx.baseEntity.create({
        data: {
          created_at: now,
          created_by: userId,
          isdeleted: false,
        },
      });

      // Create new price history record
      return tx.itemPriceHistory.create({
        data: {
          item_id: itemId,
          price: newPrice,
          effective_from: now,
          effective_to: null, // Current price
          base_entity_id: baseEntity.id,
        },
        include: {
          item: true,
        },
      });
    });
  }

  /**
   * Get price at a specific point in time
   */
  async getPriceAtDate(itemId: number, date: Date): Promise<number | null> {
    const priceRecord = await this.prisma.itemPriceHistory.findFirst({
      where: {
        item_id: itemId,
        effective_from: { lte: date },
        OR: [
          { effective_to: null },
          { effective_to: { gte: date } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });

    return priceRecord ? Number(priceRecord.price) : null;
  }

  /**
   * Get full price history for an item
   */
  async getPriceHistory(itemId: number) {
    this.logger.debug(`Getting price history for item ${itemId}`);

    return this.prisma.itemPriceHistory.findMany({
      where: { item_id: itemId },
      include: {
        baseEntity: {
          include: {
            createdByUser: {
              select: { id: true, fullname: true },
            },
          },
        },
      },
      orderBy: { effective_from: 'desc' },
    });
  }

  /**
   * Initialize price history for a new item
   */
  async initializePriceHistory(
    itemId: number,
    price: number | Decimal,
    userId: number,
    effectiveFrom?: Date,
  ) {
    this.logger.debug(`Initializing price history for item ${itemId}: ${price}`);

    const baseEntity = await this.baseEntityService.create(userId);

    return this.prisma.itemPriceHistory.create({
      data: {
        item_id: itemId,
        price: price,
        effective_from: effectiveFrom || new Date(),
        effective_to: null,
        base_entity_id: baseEntity.id,
      },
    });
  }

  /**
   * Get current price from history (for verification)
   */
  async getCurrentPrice(itemId: number): Promise<number | null> {
    const currentRecord = await this.prisma.itemPriceHistory.findFirst({
      where: {
        item_id: itemId,
        effective_to: null,
      },
    });

    return currentRecord ? Number(currentRecord.price) : null;
  }
}
