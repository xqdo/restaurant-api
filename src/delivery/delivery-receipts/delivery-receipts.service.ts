import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignDeliveryDto } from '../dto/assign-delivery.dto';

@Injectable()
export class DeliveryReceiptsService {
  private readonly logger = new Logger(DeliveryReceiptsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    // Create delivery assignment
    const deliveryReceipt = await this.prisma.deliveryReceipt.create({
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

    this.logger.log(`Delivery assigned: Receipt ${dto.receipt_id} to Driver ${dto.delivery_guy_id}`);

    return deliveryReceipt;
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
   * Get all delivery receipts
   */
  async findAll(filters?: { driver_id?: number; is_paid?: boolean }) {
    const where: any = {};

    if (filters?.driver_id) {
      where.dilvery_guy_id = filters.driver_id;
    }

    if (filters?.is_paid !== undefined) {
      where.is_paid = filters.is_paid;
    }

    return this.prisma.deliveryReceipt.findMany({
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
  }

  /**
   * Get delivery receipt by ID
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

    return deliveryReceipt;
  }

  /**
   * Get unpaid deliveries for a driver
   */
  async getUnpaidDeliveries(driverId: number) {
    return this.prisma.deliveryReceipt.findMany({
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
  }
}
