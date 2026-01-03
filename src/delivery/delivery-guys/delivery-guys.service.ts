import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { CreateDeliveryGuyDto } from '../dto/create-delivery-guy.dto';
import { UpdateDeliveryGuyDto } from '../dto/update-delivery-guy.dto';

@Injectable()
export class DeliveryGuysService {
  private readonly logger = new Logger(DeliveryGuysService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Register a new delivery driver
   */
  async create(dto: CreateDeliveryGuyDto, userId: number) {
    this.logger.debug(`Creating delivery guy: ${dto.name}`);

    // Check if phone number already exists
    const existing = await this.prisma.deliveryGuy.findFirst({
      where: { phone_number: dto.phone_number },
      include: { baseEntity: true },
    });

    if (existing && !existing.baseEntity.isdeleted) {
      throw new ConflictException('Phone number already registered');
    }

    // Create delivery guy with base entity
    const baseEntity = await this.baseEntityService.create(userId);

    const deliveryGuy = await this.prisma.deliveryGuy.create({
      data: {
        name: dto.name,
        phone_number: dto.phone_number,
        base_entity_id: baseEntity.id,
      },
      include: {
        baseEntity: true,
      },
    });

    this.logger.log(`Delivery guy created: ${deliveryGuy.name}`);

    return deliveryGuy;
  }

  /**
   * Get all delivery drivers
   */
  async findAll() {
    return this.prisma.deliveryGuy.findMany({
      where: {
        baseEntity: { isdeleted: false },
      },
      include: {
        baseEntity: {
          include: {
            createdByUser: {
              select: { id: true, fullname: true },
            },
          },
        },
        deliveryReceipts: {
          include: {
            receipt: {
              select: {
                id: true,
                number: true,
                location: true,
                phone_number: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Get delivery driver by ID
   */
  async findOne(id: number) {
    const deliveryGuy = await this.prisma.deliveryGuy.findUnique({
      where: { id },
      include: {
        baseEntity: true,
        deliveryReceipts: {
          include: {
            receipt: {
              select: {
                id: true,
                number: true,
                location: true,
                phone_number: true,
                notes: true,
              },
            },
          },
        },
      },
    });

    if (!deliveryGuy || deliveryGuy.baseEntity.isdeleted) {
      throw new NotFoundException('Delivery guy not found');
    }

    return deliveryGuy;
  }

  /**
   * Update delivery driver
   */
  async update(id: number, dto: UpdateDeliveryGuyDto, userId: number) {
    const deliveryGuy = await this.findOne(id);

    // Check if phone number is already used by another driver
    if (dto.phone_number) {
      const existing = await this.prisma.deliveryGuy.findFirst({
        where: {
          phone_number: dto.phone_number,
          id: { not: id },
        },
        include: { baseEntity: true },
      });

      if (existing && !existing.baseEntity.isdeleted) {
        throw new ConflictException('Phone number already in use');
      }
    }

    // Update delivery guy
    const updated = await this.prisma.deliveryGuy.update({
      where: { id },
      data: {
        name: dto.name,
        phone_number: dto.phone_number,
      },
    });

    // Update audit trail
    await this.baseEntityService.update(deliveryGuy.base_entity_id, userId);

    this.logger.log(`Delivery guy updated: ${id}`);

    return updated;
  }

  /**
   * Delete delivery driver (soft delete)
   */
  async remove(id: number, userId: number) {
    const deliveryGuy = await this.findOne(id);

    await this.baseEntityService.softDelete(deliveryGuy.base_entity_id, userId);

    this.logger.log(`Delivery guy deleted: ${id}`);

    return {
      message: 'Delivery guy deleted successfully',
      id,
    };
  }

  /**
   * Get driver statistics
   */
  async getStats(id: number) {
    const deliveryGuy = await this.findOne(id);

    const totalDeliveries = await this.prisma.deliveryReceipt.count({
      where: { dilvery_guy_id: id },
    });

    const paidDeliveries = await this.prisma.deliveryReceipt.count({
      where: {
        dilvery_guy_id: id,
        is_paid: true,
      },
    });

    const unpaidDeliveries = totalDeliveries - paidDeliveries;

    return {
      driver: {
        id: deliveryGuy.id,
        name: deliveryGuy.name,
        phone_number: deliveryGuy.phone_number,
      },
      statistics: {
        total_deliveries: totalDeliveries,
        paid_deliveries: paidDeliveries,
        unpaid_deliveries: unpaidDeliveries,
      },
    };
  }
}
