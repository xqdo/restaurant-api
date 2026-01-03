import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsIn } from 'class-validator';

export class ExportRequestDto {
  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({
    example: '2025-01-31',
    description: 'End date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiPropertyOptional({
    example: 'csv',
    description: 'Export format: csv or excel',
    enum: ['csv', 'excel'],
  })
  @IsOptional()
  @IsIn(['csv', 'excel'])
  format?: 'csv' | 'excel' = 'csv';
}
