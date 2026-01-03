import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterLogsDto {
  @ApiPropertyOptional({ example: 5, description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user_id?: number;

  @ApiPropertyOptional({ example: 'USER_LOGIN', description: 'Filter by event type' })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ example: '2025-12-01', description: 'Start date' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}
