import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignDeliveryDto } from '../dto/assign-delivery.dto';
import { ReceiptsService } from '../../receipts/receipts.service';

@Injectable()
export class DeliveryReceiptsService {
  private readonly logger = new Logger(DeliveryReceiptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ReceiptsService))
    private readonly receiptsService: ReceiptsService,
  ) {}

  /**
   * Assign receipt to delivery driver
   */
  async assignDelivery(dto: AssignDeliveryDto, userId: number) {
    this.logger.debug(`Assigning receipt ${dto.receipt_id} to driver ${dto.delivery_guy_id}`);

    // Validate delivery guy exists
    const deliveryGuy = await this.prisma.deliveryGuy.findUnique({
      where: { id: dto.delivery_guy_id },
      include: { baseEntity: true },
    });

    if (!deliveryGuy || deliveryGuy.baseEntity.isdeleted) {
      throw new NotFoundException('Delivery driver not found');
    }

    // Validate receipt exists and is a delivery order
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: dto.receipt_id },
      include: { baseEntity: true },
    });

    if (!receipt || receipt.baseEntity.isdeleted) {
      throw new NotFoundException('Receipt not found');
    }

    if (!receipt.is_delivery) {
      throw new BadRequestException('Receipt is not a delivery order');
    }

    // Check if already assigned
    const existing = await this.prisma.deliveryReceipt.findFirst({
      where: { receipt_id: dto.receipt_id },
    });

    if (existing) {
      throw new BadRequestException('Receipt already assigned to a driver');
    }

    // Check if receipt is already completed
    if (receipt.completed_at) {
      throw new BadRequestException('Receipt is already completed');
    }

    // Calculate receipt total to track as debt
    const totals = await this.receiptsService.calculateTotal(dto.receipt_id);

    // Create delivery assignment and mark receipt as completed in a transaction
    const deliveryReceipt = await this.prisma.$transaction(async (tx) => {
      // Create delivery assignment
      const newDeliveryReceipt = await tx.deliveryReceipt.create({
        data: {
          dilvery_guy_id: dto.delivery_guy_id, // Keep typo from schema
          receipt_id: dto.receipt_id,
          is_paid: false,
        },
        include: {
          deliveryGuy: true,
          receipt: {
            include: {
              receiptItems: {
                include: { item: true },
              },
            },
          },
        },
      });

      // Mark receipt as completed (order is done)
      await tx.receipt.update({
        where: { id: dto.receipt_id },
        data: {
          completed_at: new Date(),
        },
      });

      return newDeliveryReceipt;
    });

    this.logger.log(
      `Delivery assigned: Receipt ${dto.receipt_id} to Driver ${dto.delivery_guy_id}. ` +
      `Receipt total: ${totals.total} (debt on driver account). Order marked as completed.`,
    );

    return {
      ...deliveryReceipt,
      receipt_total: totals.total,
      receipt_subtotal: totals.subtotal,
      receipt_discount: totals.discount,
    };
  }

  /**
   * Mark delivery as paid
   */
  async markPaid(deliveryReceiptId: number, isPaid: boolean) {
    const deliveryReceipt = await this.prisma.deliveryReceipt.findUnique({
      where: { id: deliveryReceiptId },
    });

    if (!deliveryReceipt) {
      throw new NotFoundException('Delivery receipt not found');
    }

    const updated = await this.prisma.deliveryReceipt.update({
      where: { id: deliveryReceiptId },
      data: { is_paid: isPaid },
    });

    this.logger.log(`Delivery receipt ${deliveryReceiptId} marked as ${isPaid ? 'paid' : 'unpaid'}`);

    return {
      message: `Delivery marked as ${isPaid ? 'paid' : 'unpaid'}`,
      delivery_receipt_id: deliveryReceiptId,
      is_paid: isPaid,
    };
  }

  /**
   * Get all delivery receipts with calculated totals (debts)
   */
  async findAll(filters?: { driver_id?: number; is_paid?: boolean }) {
    const where: any = {};

    if (filters?.driver_id) {
      where.dilvery_guy_id = filters.driver_id;
    }

    if (filters?.is_paid !== undefined) {
      where.is_paid = filters.is_paid;
    }

    const deliveryReceipts = await this.prisma.deliveryReceipt.findMany({
      where,
      include: {
        deliveryGuy: true,
        receipt: {
          include: {
            receiptItems: {
              include: { item: true },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    // Calculate totals for each receipt to show debt amounts
    const receiptsWithTotals = await Promise.all(
      deliveryReceipts.map(async (dr) => {
        const totals = await this.receiptsService.calculateTotal(dr.receipt_id);
        return {
          ...dr,
          receipt_total: totals.total,
          receipt_subtotal: totals.subtotal,
          receipt_discount: totals.discount,
        };
      }),
    );

    return receiptsWithTotals;
  }

  /**
   * Get delivery receipt by ID with calculated total (debt)
   */
  async findOne(id: number) {
    const deliveryReceipt = await this.prisma.deliveryReceipt.findUnique({
      where: { id },
      include: {
        deliveryGuy: true,
        receipt: {
          include: {
            receiptItems: {
              include: { item: true },
            },
            baseEntity: {
              include: {
                createdByUser: {
                  select: { id: true, fullname: true },
                },
              },
            },
          },
        },
      },
    });

    if (!deliveryReceipt) {
      throw new NotFoundException('Delivery receipt not found');
    }

    // Calculate receipt total
    const totals = await this.receiptsService.calculateTotal(
      deliveryReceipt.receipt_id,
    );

    return {
      ...deliveryReceipt,
      receipt_total: totals.total,
      receipt_subtotal: totals.subtotal,
      receipt_discount: totals.discount,
    };
  }

  /**
   * Get unpaid deliveries for a driver (their current debt)
   */
  async getUnpaidDeliveries(driverId: number) {
    const unpaidDeliveries = await this.prisma.deliveryReceipt.findMany({
      where: {
        dilvery_guy_id: driverId,
        is_paid: false,
      },
      include: {
        receipt: {
          include: {
            receiptItems: {
              include: { item: true },
            },
          },
        },
      },
    });

    // Calculate total debt
    const deliveriesWithTotals = await Promise.all(
      unpaidDeliveries.map(async (dr) => {
        const totals = await this.receiptsService.calculateTotal(dr.receipt_id);
        return {
          ...dr,
          receipt_total: totals.total,
          receipt_subtotal: totals.subtotal,
          receipt_discount: totals.discount,
        };
      }),
    );

    const totalDebt = deliveriesWithTotals.reduce(
      (sum, dr) => sum + dr.receipt_total,
      0,
    );

    return {
      deliveries: deliveriesWithTotals,
      total_debt: totalDebt,
      count: deliveriesWithTotals.length,
    };
  }
}
