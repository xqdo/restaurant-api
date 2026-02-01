import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { StatusEnum } from '../../common/enums';

@Injectable()
export class ReceiptItemsService {
  private readonly logger = new Logger(ReceiptItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Update receipt item status
   * Enforces status workflow: pending → preparing → ready → done
   */
  async updateStatus(
    receiptId: number,
    itemId: number,
    status: StatusEnum,
    userId: number,
  ) {
    this.logger.debug(
      `Updating receipt ${receiptId} item ${itemId} status to ${status}`,
    );

    // Find receipt item
    const receiptItem = await this.prisma.receiptItem.findFirst({
      where: {
        id: itemId,
        receipt_id: receiptId,
        baseEntity: {
          isdeleted: false,
        },
      },
      include: {
        baseEntity: true,
      },
    });

    if (!receiptItem) {
      throw new NotFoundException(
        `Receipt item with ID ${itemId} not found in receipt ${receiptId}`,
      );
    }

    // Validate status transition
    this.validateStatusTransition(receiptItem.status as StatusEnum, status);

    // Update item status
    await this.prisma.receiptItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Update audit trail
    await this.baseEntityService.update(
      receiptItem.base_entity_id,
      userId,
    );

    this.logger.log(
      `Receipt item ${itemId} status updated from ${receiptItem.status} to ${status}`,
    );

    return {
      message: 'Status updated successfully',
      item_id: itemId,
      previous_status: receiptItem.status,
      new_status: status,
    };
  }

  /**
   * Validate status transition according to workflow rules
   * pending → preparing → ready → done
   */
  private validateStatusTransition(
    currentStatus: StatusEnum,
    newStatus: StatusEnum,
  ) {
    const validTransitions: Record<StatusEnum, StatusEnum[]> = {
      [StatusEnum.pending]: [StatusEnum.preparing],
      [StatusEnum.preparing]: [StatusEnum.ready],
      [StatusEnum.ready]: [StatusEnum.done],
      [StatusEnum.done]: [], // Cannot change from done
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedStatuses.length > 0 ? allowedStatuses.join(', ') : 'none'}`,
      );
    }
  }
}
