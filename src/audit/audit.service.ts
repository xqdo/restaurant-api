import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { FilterLogsDto } from './dto/filter-logs.dto';
import { AuditLogsResponseDto, AuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async createLog(dto: CreateLogDto): Promise<void> {
    this.logger.debug(`Creating audit log: ${dto.event}`);

    await this.prisma.log.create({
      data: {
        user_id: dto.user_id,
        event: dto.event,
        occurred_at: new Date(),
      },
    });
  }

  /**
   * Get audit logs with pagination and filters
   */
  async getLogs(filter: FilterLogsDto): Promise<AuditLogsResponseDto> {
    this.logger.debug(`Getting audit logs with filter: ${JSON.stringify(filter)}`);

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filter.user_id) {
      where.user_id = filter.user_id;
    }

    if (filter.event) {
      where.event = filter.event;
    }

    if (filter.start_date || filter.end_date) {
      where.occurred_at = {};
      if (filter.start_date) {
        const startDate = new Date(filter.start_date);
        startDate.setHours(0, 0, 0, 0);
        where.occurred_at.gte = startDate;
      }
      if (filter.end_date) {
        const endDate = new Date(filter.end_date);
        endDate.setHours(23, 59, 59, 999);
        where.occurred_at.lte = endDate;
      }
    }

    // Get total count
    const total = await this.prisma.log.count({ where });

    // Get logs
    const logs = await this.prisma.log.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        occurred_at: 'desc',
      },
      skip,
      take: limit,
    });

    const auditLogs: AuditLogDto[] = logs.map((log) => ({
      id: log.id,
      user_id: log.user_id || undefined,
      username: log.user?.username,
      event: log.event,
      occurred_at: log.occurred_at,
    }));

    return {
      logs: auditLogs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserActivity(userId: number): Promise<AuditLogsResponseDto> {
    this.logger.debug(`Getting activity for user ${userId}`);

    return this.getLogs({ user_id: userId, page: 1, limit: 100 });
  }

  /**
   * Get audit logs for a specific event type
   */
  async getEventLogs(eventType: string): Promise<AuditLogsResponseDto> {
    this.logger.debug(`Getting logs for event ${eventType}`);

    return this.getLogs({ event: eventType, page: 1, limit: 100 });
  }

  /**
   * Get audit trail for a receipt (all changes)
   */
  async getReceiptAudit(receiptId: number): Promise<AuditLogDto[]> {
    this.logger.debug(`Getting audit trail for receipt ${receiptId}`);

    // Get the receipt with base entity
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        baseEntity: {
          include: {
            createdByUser: true,
            updatedByUser: true,
            deletedByUser: true,
          },
        },
      },
    });

    if (!receipt) {
      return [];
    }

    const auditTrail: AuditLogDto[] = [];
    let logId = 1;

    // Created event
    if (receipt.baseEntity.created_by) {
      auditTrail.push({
        id: logId++,
        user_id: receipt.baseEntity.created_by,
        username: receipt.baseEntity.createdByUser?.username,
        event: 'RECEIPT_CREATED',
        occurred_at: receipt.baseEntity.created_at,
      });
    }

    // Updated event
    if (receipt.baseEntity.updated_by && receipt.baseEntity.updated_at) {
      auditTrail.push({
        id: logId++,
        user_id: receipt.baseEntity.updated_by,
        username: receipt.baseEntity.updatedByUser?.username,
        event: 'RECEIPT_UPDATED',
        occurred_at: receipt.baseEntity.updated_at,
      });
    }

    // Deleted event
    if (receipt.baseEntity.deleted_by && receipt.baseEntity.deleted_at) {
      auditTrail.push({
        id: logId++,
        user_id: receipt.baseEntity.deleted_by,
        username: receipt.baseEntity.deletedByUser?.username,
        event: 'RECEIPT_DELETED',
        occurred_at: receipt.baseEntity.deleted_at,
      });
    }

    // Get logs related to this receipt
    const logs = await this.prisma.log.findMany({
      where: {
        event: {
          contains: `RECEIPT_${receiptId}`,
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        occurred_at: 'desc',
      },
    });

    logs.forEach((log) => {
      auditTrail.push({
        id: log.id,
        user_id: log.user_id || undefined,
        username: log.user?.username,
        event: log.event,
        occurred_at: log.occurred_at,
      });
    });

    return auditTrail.sort(
      (a, b) => b.occurred_at.getTime() - a.occurred_at.getTime(),
    );
  }
}
