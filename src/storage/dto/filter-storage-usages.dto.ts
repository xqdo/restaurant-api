import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { UsageReason } from '../../common/enums';

export class FilterStorageUsagesDto {
  @ApiPropertyOptional({
    description: 'Filter by storage item ID',
    example: 1,
  })
  @IsInt({ message: 'Storage item ID must be an integer' })
  @IsOptional()
  @Type(() => Number)
  storage_item_id?: number;

  @ApiPropertyOptional({
    enum: UsageReason,
    description: 'Filter by usage reason',
  })
  @IsEnum(UsageReason)
  @IsOptional()
  reason?: UsageReason;

  @ApiPropertyOptional({
    description: 'Start date for usage_date range',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for usage_date range',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
