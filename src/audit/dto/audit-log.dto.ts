import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: 5 })
  user_id?: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  username?: string;

  @ApiProperty({ example: 'USER_LOGIN' })
  event: string;

  @ApiProperty({ example: '2025-12-28T10:30:00Z' })
  occurred_at: Date;
}

export class AuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogDto] })
  logs: AuditLogDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 250 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
