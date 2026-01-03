import { ApiProperty } from '@nestjs/swagger';

export class StaffPerformanceDto {
  @ApiProperty({ example: 5 })
  user_id: number;

  @ApiProperty({ example: 'John Doe' })
  fullname: string;

  @ApiProperty({ example: 45, description: 'Number of orders created' })
  orders_count: number;

  @ApiProperty({ example: 2450.75, description: 'Total revenue generated' })
  total_revenue: number;

  @ApiProperty({ example: 54.46, description: 'Average order value' })
  average_order_value: number;

  @ApiProperty({ example: ['Admin', 'Manager'] })
  roles: string[];
}

export class StaffPerformanceReportDto {
  @ApiProperty({ type: [StaffPerformanceDto] })
  staff: StaffPerformanceDto[];

  @ApiProperty({ example: '2025-01-01' })
  start_date?: string;

  @ApiProperty({ example: '2025-01-31' })
  end_date?: string;
}
