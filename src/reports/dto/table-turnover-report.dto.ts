import { ApiProperty } from '@nestjs/swagger';

export class TableTurnoverDto {
  @ApiProperty({ example: 1 })
  table_id: number;

  @ApiProperty({ example: 5, description: 'Table number' })
  table_number: number;

  @ApiProperty({ example: 12, description: 'Number of orders for this table' })
  orders_count: number;

  @ApiProperty({ example: 1250.50, description: 'Total revenue from this table' })
  total_revenue: number;

  @ApiProperty({ example: 104.21, description: 'Average order value' })
  average_order_value: number;

  @ApiProperty({
    example: 'OCCUPIED',
    description: 'Current table status',
  })
  current_status: string;
}

export class TableTurnoverReportDto {
  @ApiProperty({ type: [TableTurnoverDto] })
  tables: TableTurnoverDto[];

  @ApiProperty({ example: '2025-12-28' })
  date?: string;

  @ApiProperty({ example: '2025-01-01' })
  start_date?: string;

  @ApiProperty({ example: '2025-01-31' })
  end_date?: string;
}
