import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountTypeEnum, ConditionTypeEnum } from '@prisma/client';

@Injectable()
export class DiscountEngineService {
  private readonly logger = new Logger(DiscountEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate and apply discount to a receipt
   */
  async applyDiscount(discountCode: string, receiptId: number, userId: number) {
    // Get discount by code
    const discount = await this.prisma.discount.findUnique({
      where: { code: discountCode },
      include: {
        baseEntity: true,
        discountItems: {
          include: { item: true },
        },
        discountConditions: true,
      },
    });

    if (!discount || discount.baseEntity.isdeleted) {
      throw new NotFoundException('Discount code not found');
    }

    // Validate discount is active
    if (!discount.is_active) {
      throw new BadRequestException('Discount code is not active');
    }

    // Validate date range
    const now = new Date();
    if (now < new Date(discount.start_date) || now > new Date(discount.end_date)) {
      throw new BadRequestException('Discount code is not valid at this time');
    }

    // Check usage limit
    if (discount.max_receipts) {
      const usageCount = await this.prisma.receiptDiscount.count({
        where: { discount_id: discount.id },
      });

      if (usageCount >= discount.max_receipts) {
        throw new BadRequestException('Discount code has reached maximum usage limit');
      }
    }

    // Get receipt with items
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        receiptItems: {
          where: { baseEntity: { isdeleted: false } },
          include: { item: true },
        },
        baseEntity: true,
      },
    });

    if (!receipt || receipt.baseEntity.isdeleted) {
      throw new NotFoundException('Receipt not found');
    }

    // Validate conditions
    await this.validateConditions(discount, receipt);

    // Apply discount based on type
    let appliedAmount = 0;
    switch (discount.type) {
      case DiscountTypeEnum.amount:
        appliedAmount = await this.applyAmountDiscount(discount, receipt, userId);
        break;
      case DiscountTypeEnum.percentage:
        appliedAmount = await this.applyPercentageDiscount(discount, receipt, userId);
        break;
      case DiscountTypeEnum.combo:
        appliedAmount = await this.applyComboDiscount(discount, receipt, userId);
        break;
    }

    this.logger.log(
      `Discount ${discountCode} applied to receipt ${receiptId}. Amount: ${appliedAmount}`,
    );

    return {
      message: 'Discount applied successfully',
      discount_code: discountCode,
      discount_amount: Number(appliedAmount.toFixed(2)),
      receipt_id: receiptId,
    };
  }

  /**
   * Validate discount conditions
   */
  private async validateConditions(discount: any, receipt: any) {
    for (const condition of discount.discountConditions) {
      switch (condition.condition_type) {
        case ConditionTypeEnum.min_amount:
          await this.validateMinAmount(condition, receipt);
          break;
        case ConditionTypeEnum.day_of_week:
          this.validateDayOfWeek(condition);
          break;
      }
    }
  }

  /**
   * Validate minimum amount condition
   */
  private async validateMinAmount(condition: any, receipt: any) {
    const subtotal = receipt.receiptItems.reduce((sum: number, item: any) => {
      return sum + Number(item.item.price) * Number(item.quantity);
    }, 0);

    const minAmount = parseFloat(condition.value);
    if (subtotal < minAmount) {
      throw new BadRequestException(
        `Order subtotal must be at least $${minAmount.toFixed(2)}`,
      );
    }
  }

  /**
   * Validate day of week condition
   */
  private validateDayOfWeek(condition: any) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = daysOfWeek[new Date().getDay()];
    const validDays = condition.value.split(',');

    if (!validDays.includes(today)) {
      throw new BadRequestException(
        `Discount is only valid on: ${validDays.join(', ')}`,
      );
    }
  }

  /**
   * Apply fixed amount discount
   */
  private async applyAmountDiscount(discount: any, receipt: any, userId: number) {
    const discountAmount = Number(discount.amount);

    // Create receipt discount record
    await this.prisma.receiptDiscount.create({
      data: {
        receipt_id: receipt.id,
        discount_id: discount.id,
      },
    });

    // Apply to first item (simple approach)
    const firstItem = receipt.receiptItems[0];
    await this.prisma.receiptItemDiscount.create({
      data: {
        receipt_item_id: firstItem.id,
        discount_id: discount.id,
        applied_amount: discountAmount,
      },
    });

    return discountAmount;
  }

  /**
   * Apply percentage discount
   */
  private async applyPercentageDiscount(discount: any, receipt: any, userId: number) {
    const percentage = Number(discount.persentage) / 100;

    // Calculate subtotal
    const subtotal = receipt.receiptItems.reduce((sum: number, item: any) => {
      return sum + Number(item.item.price) * Number(item.quantity);
    }, 0);

    const discountAmount = subtotal * percentage;

    // Create receipt discount record
    await this.prisma.receiptDiscount.create({
      data: {
        receipt_id: receipt.id,
        discount_id: discount.id,
      },
    });

    // Distribute discount proportionally across items
    let remainingDiscount = discountAmount;
    for (let i = 0; i < receipt.receiptItems.length; i++) {
      const item = receipt.receiptItems[i];
      const itemTotal = Number(item.item.price) * Number(item.quantity);

      // Last item gets the remaining amount to handle rounding
      const itemDiscount = i === receipt.receiptItems.length - 1
        ? remainingDiscount
        : itemTotal * percentage;

      await this.prisma.receiptItemDiscount.create({
        data: {
          receipt_item_id: item.id,
          discount_id: discount.id,
          applied_amount: itemDiscount,
        },
      });

      remainingDiscount -= itemDiscount;
    }

    return discountAmount;
  }

  /**
   * Apply combo discount (buy specific items to get discount)
   */
  private async applyComboDiscount(discount: any, receipt: any, userId: number) {
    // Validate that all required items are in the receipt
    const requiredItemIds = discount.discountItems.map((di: any) => di.item_id);
    const receiptItemIds = receipt.receiptItems.map((ri: any) => ri.item_id);

    const hasAllItems = requiredItemIds.every((id: number) => receiptItemIds.includes(id));

    if (!hasAllItems) {
      const requiredItemNames = discount.discountItems.map((di: any) => di.item.name).join(', ');
      throw new BadRequestException(
        `Combo discount requires all items: ${requiredItemNames}`,
      );
    }

    // Check minimum quantities
    for (const discountItem of discount.discountItems) {
      const receiptItem = receipt.receiptItems.find(
        (ri: any) => ri.item_id === discountItem.item_id,
      );

      if (!receiptItem || Number(receiptItem.quantity) < Number(discountItem.min_quantity)) {
        throw new BadRequestException(
          `Item ${discountItem.item.name} requires minimum quantity of ${discountItem.min_quantity}`,
        );
      }
    }

    // Apply combo discount (use amount or percentage based on what's set)
    const discountAmount = discount.amount
      ? Number(discount.amount)
      : this.calculateComboPercentageDiscount(discount, receipt);

    // Create receipt discount record
    await this.prisma.receiptDiscount.create({
      data: {
        receipt_id: receipt.id,
        discount_id: discount.id,
      },
    });

    // Apply to combo items
    await this.prisma.receiptItemDiscount.create({
      data: {
        receipt_item_id: receipt.receiptItems[0].id,
        discount_id: discount.id,
        applied_amount: discountAmount,
      },
    });

    return discountAmount;
  }

  /**
   * Calculate combo percentage discount
   */
  private calculateComboPercentageDiscount(discount: any, receipt: any): number {
    if (!discount.persentage) return 0;

    const percentage = Number(discount.persentage) / 100;
    const comboItemsTotal = receipt.receiptItems
      .filter((ri: any) =>
        discount.discountItems.some((di: any) => di.item_id === ri.item_id)
      )
      .reduce((sum: number, item: any) => {
        return sum + Number(item.item.price) * Number(item.quantity);
      }, 0);

    return comboItemsTotal * percentage;
  }
}
