import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiPropertyOptional({
    example: '2025-12-28',
    description: 'Start date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'End date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiPropertyOptional({
    example: '7days',
    description: 'Predefined period: 7days, 30days, 90days',
    enum: ['7days', '30days', '90days'],
  })
  @IsOptional()
  @IsIn(['7days', '30days', '90days'])
  period?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 50,
    description: 'Number of items per page',
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}
