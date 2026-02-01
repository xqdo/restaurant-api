import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsDateString, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterStorageEntriesDto {
  @ApiPropertyOptional({
    description: 'Filter by storage item ID',
    example: 1,
  })
  @IsInt({ message: 'Storage item ID must be an integer' })
  @IsOptional()
  @Type(() => Number)
  storage_item_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by supplier name',
    example: 'ABC Suppliers',
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Start date for entry_date range',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date for entry_date range',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
