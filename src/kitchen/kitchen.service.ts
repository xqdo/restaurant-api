import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusEnum } from '../common/enums';

@Injectable()
export class KitchenService {
  private readonly logger = new Logger(KitchenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all pending items for kitchen
   * Items with status: pending OR preparing
   */
  async getPendingItems() {
    this.logger.debug('Fetching all pending items for kitchen');

    const items = await this.prisma.receiptItem.findMany({
      where: {
        status: {
          in: [StatusEnum.pending, StatusEnum.preparing],
        },
        baseEntity: {
          isdeleted: false,
        },
      },
      include: {
        item: {
          include: {
            section: true,
          },
        },
        receipt: {
          include: {
            table: true,
          },
        },
        baseEntity: true,
      },
      orderBy: {
        baseEntity: {
          created_at: 'asc', // Oldest first - FIFO
        },
      },
    });

    this.logger.debug(`Found ${items.length} pending items`);

    return items;
  }

  /**
   * Get items grouped by table/receipt
   * Useful for kitchen display to see orders by table
   */
  async getItemsByTable() {
    this.logger.debug('Fetching items grouped by table/receipt');

    const items = await this.getPendingItems();

    // Group by receipt
    const grouped = items.reduce((acc: any, item: any) => {
      const receiptId = item.receipt_id;

      if (!acc[receiptId]) {
        acc[receiptId] = {
          receipt_id: receiptId,
          receipt_number: item.receipt.number,
          table_number: item.receipt.table?.number || null,
          is_delivery: item.receipt.is_delivery,
          delivery_location: item.receipt.location || null,
          order_time: item.baseEntity.created_at,
          items: [],
        };
      }

      acc[receiptId].items.push({
        id: item.id,
        item_name: item.item.name,
        section: item.item.section.name,
        quantity: Number(item.quantity),
        status: item.status,
        notes: item.notes,
        item_id: item.item_id,
      });

      return acc;
    }, {});

    const result = Object.values(grouped);

    this.logger.debug(`Grouped into ${result.length} orders`);

    return result;
  }
}
