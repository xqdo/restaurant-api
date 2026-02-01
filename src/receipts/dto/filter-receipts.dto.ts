import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsPositive,
  Min,
  IsIn,
  IsString,
} from 'class-validator';

export class FilterReceiptsDto {
  @ApiPropertyOptional({
    example: 'false',
    description: 'Filter by completion status. "false" = pending orders, "true" = completed orders',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  completed?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by delivery orders',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj }) => {
    const raw = obj.is_delivery;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return raw;
  })
  is_delivery?: boolean;

  @ApiPropertyOptional({
    example: 5,
    description: 'Filter by table ID',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  table_id?: number;

  @ApiPropertyOptional({
    example: '2025-12-01T00:00:00Z',
    description: 'Start date for filtering receipts',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'End date for filtering receipts',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  perPage?: number;
}
