import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { DiscountTypeEnum, ConditionTypeEnum } from '../common/enums';

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Create a new discount
   */
  async create(dto: CreateDiscountDto, userId: number) {
    this.logger.debug(`Creating discount: ${dto.code}`);

    // Validate discount type has required fields
    this.validateDiscountType(dto);

    // Check if code already exists
    const existing = await this.prisma.discount.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Discount code already exists');
    }

    // Validate items exist (for combo type)
    if (dto.type === DiscountTypeEnum.combo && dto.item_ids) {
      const items = await this.prisma.item.findMany({
        where: { id: { in: dto.item_ids } },
      });

      if (items.length !== dto.item_ids.length) {
        throw new BadRequestException('One or more item IDs are invalid');
      }
    }

    // Create discount with transaction
    return this.prisma.$transaction(async (tx) => {
      // Create base entity
      const baseEntity = await tx.baseEntity.create({
        data: {
          created_at: new Date(),
          created_by: userId,
          isdeleted: false,
        },
      });

      // Create discount
      const discount = await tx.discount.create({
        data: {
          name: dto.name,
          code: dto.code,
          type: dto.type,
          max_receipts: dto.max_receipts,
          amount: dto.amount,
          persentage: dto.persentage,
          start_date: new Date(dto.start_date),
          end_date: new Date(dto.end_date),
          is_active: true,
          base_entity_id: baseEntity.id,
        },
      });

      // Create discount items (for combo type)
      if (dto.type === DiscountTypeEnum.combo && dto.item_ids) {
        for (const itemId of dto.item_ids) {
          const itemBaseEntity = await tx.baseEntity.create({
            data: {
              created_at: new Date(),
              created_by: userId,
              isdeleted: false,
            },
          });

          await tx.discountItem.create({
            data: {
              item_id: itemId,
              discount_id: discount.id,
              min_quantity: 1,
              base_entity_id: itemBaseEntity.id,
            },
          });
        }
      }

      // Create conditions
      if (dto.min_amount) {
        const conditionBaseEntity = await tx.baseEntity.create({
          data: {
            created_at: new Date(),
            created_by: userId,
            isdeleted: false,
          },
        });

        await tx.discountCondition.create({
          data: {
            discount_id: discount.id,
            condition_type: ConditionTypeEnum.min_amount,
            value: dto.min_amount.toString(),
            base_entity_id: conditionBaseEntity.id,
          },
        });
      }

      if (dto.valid_days && dto.valid_days.length > 0) {
        const conditionBaseEntity = await tx.baseEntity.create({
          data: {
            created_at: new Date(),
            created_by: userId,
            isdeleted: false,
          },
        });

        await tx.discountCondition.create({
          data: {
            discount_id: discount.id,
            condition_type: ConditionTypeEnum.day_of_week,
            value: dto.valid_days.join(','),
            base_entity_id: conditionBaseEntity.id,
          },
        });
      }

      return discount;
    });
  }

  /**
   * Get all discounts
   */
  async findAll() {
    return this.prisma.discount.findMany({
      where: {
        baseEntity: { isdeleted: false },
      },
      include: {
        discountItems: {
          include: { item: true },
        },
        discountConditions: true,
        baseEntity: {
          include: {
            createdByUser: {
              select: { id: true, fullname: true },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Get discount by ID
   */
  async findOne(id: number) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        discountItems: {
          include: { item: true },
        },
        discountConditions: true,
        baseEntity: true,
      },
    });

    if (!discount || discount.baseEntity.isdeleted) {
      throw new NotFoundException('Discount not found');
    }

    return discount;
  }

  /**
   * Update discount
   */
  async update(id: number, dto: UpdateDiscountDto, userId: number) {
    const discount = await this.findOne(id);

    if (dto.type) {
      this.validateDiscountType(dto as CreateDiscountDto);
    }

    // Update discount
    const updated = await this.prisma.discount.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        max_receipts: dto.max_receipts,
        amount: dto.amount,
        persentage: dto.persentage,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
    });

    // Update audit trail
    await this.baseEntityService.update(discount.base_entity_id, userId);

    this.logger.log(`Discount updated: ${id}`);

    return updated;
  }

  /**
   * Delete discount (soft delete)
   */
  async remove(id: number, userId: number) {
    const discount = await this.findOne(id);

    await this.baseEntityService.softDelete(discount.base_entity_id, userId);

    this.logger.log(`Discount deleted: ${id}`);

    return {
      message: 'Discount deleted successfully',
      id,
    };
  }

  /**
   * Toggle discount active status
   */
  async toggleActive(id: number, userId: number) {
    const discount = await this.findOne(id);

    const updated = await this.prisma.discount.update({
      where: { id },
      data: {
        is_active: !discount.is_active,
      },
    });

    await this.baseEntityService.update(discount.base_entity_id, userId);

    return {
      message: `Discount ${updated.is_active ? 'activated' : 'deactivated'}`,
      is_active: updated.is_active,
    };
  }

  /**
   * Validate discount type has required fields
   */
  private validateDiscountType(dto: CreateDiscountDto) {
    if (dto.type === DiscountTypeEnum.amount && !dto.amount) {
      throw new BadRequestException('Amount is required for amount discount type');
    }

    if (dto.type === DiscountTypeEnum.percentage && !dto.persentage) {
      throw new BadRequestException('Percentage is required for percentage discount type');
    }

    if (dto.type === DiscountTypeEnum.combo && (!dto.item_ids || dto.item_ids.length === 0)) {
      throw new BadRequestException('Item IDs are required for combo discount type');
    }
  }
}
