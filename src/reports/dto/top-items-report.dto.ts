import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TopItemsQueryDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Number of top items to return',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: '7days',
    description: 'Period: 7days, 30days, or 90days',
  })
  @IsOptional()
  period?: string;
}

export class TopItemDto {
  @ApiProperty({ example: 15 })
  item_id: number;

  @ApiProperty({ example: 'Classic Burger' })
  name: string;

  @ApiProperty({ example: 120, description: 'Total quantity sold' })
  quantity_sold: number;

  @ApiProperty({ example: 1558.80, description: 'Total revenue from this item' })
  revenue: number;

  @ApiProperty({ example: 12.99, description: 'Item price' })
  price: number;
}

export class TopItemsReportDto {
  @ApiProperty({ example: 'last_7_days' })
  period: string;

  @ApiProperty({ type: [TopItemDto] })
  items: TopItemDto[];
}
