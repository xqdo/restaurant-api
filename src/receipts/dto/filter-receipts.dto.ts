import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsPositive,
  Min,
} from 'class-validator';

export class FilterReceiptsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Filter by delivery orders',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
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
