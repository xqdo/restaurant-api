import { ApiProperty } from '@nestjs/swagger';

export class DiscountUsageDto {
  @ApiProperty({ example: 5 })
  discount_id: number;

  @ApiProperty({ example: 'SUMMER20' })
  code: string;

  @ApiProperty({ example: 'Summer Sale 20% Off' })
  name: string;

  @ApiProperty({ example: 35, description: 'Number of times used' })
  times_used: number;

  @ApiProperty({ example: 420.50, description: 'Total discount amount given' })
  total_discount_amount: number;

  @ApiProperty({
    example: 1850.75,
    description: 'Total revenue from orders with this discount',
  })
  total_revenue: number;

  @ApiProperty({
    example: 52.88,
    description: 'Average order value for orders with this discount',
  })
  average_order_value: number;
}

export class DiscountUsageReportDto {
  @ApiProperty({ type: [DiscountUsageDto] })
  discounts: DiscountUsageDto[];

  @ApiProperty({ example: '2025-01-01' })
  start_date?: string;

  @ApiProperty({ example: '2025-01-31' })
  end_date?: string;
}
