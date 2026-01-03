import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CustomReportDto {
  @ApiProperty({
    example: ['receipt_number', 'date', 'total', 'items'],
    description: 'Columns to include in the report',
  })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date for filtering',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    example: '2025-01-31',
    description: 'End date for filtering',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    example: 'csv',
    description: 'Export format: csv or excel',
    enum: ['csv', 'excel'],
  })
  @IsOptional()
  @IsIn(['csv', 'excel'])
  format?: 'csv' | 'excel' = 'csv';

  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'Filter by section IDs',
  })
  @IsOptional()
  @IsArray()
  section_ids?: number[];

  @ApiPropertyOptional({
    example: [5, 10, 15],
    description: 'Filter by item IDs',
  })
  @IsOptional()
  @IsArray()
  item_ids?: number[];
}
