import { Controller, Get, Query, Param, UseGuards, Logger, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FilterLogsDto } from './dto/filter-logs.dto';
import { AuditLogsResponseDto, AuditLogDto } from './dto/audit-log.dto';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin') // Only Admin can access audit logs
@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get all audit logs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: AuditLogsResponseDto,
  })
  async getLogs(@Query() filter: FilterLogsDto): Promise<AuditLogsResponseDto> {
    this.logger.log(`GET /audit/logs - ${JSON.stringify(filter)}`);
    return this.auditService.getLogs(filter);
  }

  @Get('logs/user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiParam({ name: 'userId', example: 5 })
  @ApiResponse({
    status: 200,
    description: 'User activity logs',
    type: AuditLogsResponseDto,
  })
  async getUserActivity(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AuditLogsResponseDto> {
    this.logger.log(`GET /audit/logs/user/${userId}`);
    return this.auditService.getUserActivity(userId);
  }

  @Get('logs/receipt/:receiptId')
  @ApiOperation({ summary: 'Get audit trail for a specific receipt' })
  @ApiParam({ name: 'receiptId', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Receipt audit trail',
    type: [AuditLogDto],
  })
  async getReceiptAudit(
    @Param('receiptId', ParseIntPipe) receiptId: number,
  ): Promise<AuditLogDto[]> {
    this.logger.log(`GET /audit/logs/receipt/${receiptId}`);
    return this.auditService.getReceiptAudit(receiptId);
  }

  @Get('logs/events/:eventType')
  @ApiOperation({ summary: 'Get audit logs for a specific event type' })
  @ApiParam({ name: 'eventType', example: 'USER_LOGIN' })
  @ApiResponse({
    status: 200,
    description: 'Event logs',
    type: AuditLogsResponseDto,
  })
  async getEventLogs(
    @Param('eventType') eventType: string,
  ): Promise<AuditLogsResponseDto> {
    this.logger.log(`GET /audit/logs/events/${eventType}`);
    return this.auditService.getEventLogs(eventType);
  }
}
