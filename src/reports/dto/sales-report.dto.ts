import { ApiProperty } from '@nestjs/swagger';

export class SalesReportDto {
  @ApiProperty({ example: '2025-12-28' })
  date: string;

  @ApiProperty({ example: 45, description: 'Total number of receipts' })
  total_receipts: number;

  @ApiProperty({ example: 2450.75, description: 'Total revenue' })
  total_revenue: number;

  @ApiProperty({ example: 54.46, description: 'Average order value' })
  average_order_value: number;

  @ApiProperty({ example: 30, description: 'Number of dine-in orders' })
  dine_in_orders: number;

  @ApiProperty({ example: 15, description: 'Number of delivery orders' })
  delivery_orders: number;
}

export class PeriodSalesReportDto {
  @ApiProperty({ example: '2025-01-01' })
  start_date: string;

  @ApiProperty({ example: '2025-01-31' })
  end_date: string;

  @ApiProperty({ example: 450, description: 'Total number of receipts' })
  total_receipts: number;

  @ApiProperty({ example: 24507.50, description: 'Total revenue' })
  total_revenue: number;

  @ApiProperty({ example: 54.46, description: 'Average order value' })
  average_order_value: number;

  @ApiProperty({ example: 300, description: 'Number of dine-in orders' })
  dine_in_orders: number;

  @ApiProperty({ example: 150, description: 'Number of delivery orders' })
  delivery_orders: number;

  @ApiProperty({ example: 15.5, description: 'Revenue growth percentage' })
  growth_percentage?: number;
}
