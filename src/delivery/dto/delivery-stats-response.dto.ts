import { ApiProperty } from '@nestjs/swagger';

export class DeliveryStatsResponseDto {
  @ApiProperty({ example: 5 })
  driver_id: number;

  @ApiProperty({ example: 'Michael Rodriguez' })
  driver_name: string;

  @ApiProperty({ example: '+1234567890' })
  phone_number: string;

  @ApiProperty({ example: 145, description: 'Total deliveries completed' })
  total_deliveries: number;

  @ApiProperty({ example: 3, description: 'Currently assigned deliveries' })
  active_deliveries: number;

  @ApiProperty({ example: 12, description: 'Unpaid deliveries' })
  unpaid_deliveries: number;

  @ApiProperty({ example: 1847.50, description: 'Total unpaid amount' })
  unpaid_amount: number;

  @ApiProperty({ example: 8542.30, description: 'Total revenue from all deliveries' })
  total_revenue: number;

  @ApiProperty({ example: 58.91, description: 'Average delivery value' })
  average_delivery_value: number;

  @ApiProperty({ example: '2025-12-28T10:00:00.000Z', description: 'Last delivery date' })
  last_delivery_date: string;
}
