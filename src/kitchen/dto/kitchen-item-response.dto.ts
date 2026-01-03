import { ApiProperty } from '@nestjs/swagger';

export class KitchenItemResponseDto {
  @ApiProperty({ example: 45 })
  receipt_item_id: number;

  @ApiProperty({ example: 125 })
  receipt_id: number;

  @ApiProperty({ example: 1001 })
  receipt_number: number;

  @ApiProperty({ example: 15 })
  item_id: number;

  @ApiProperty({ example: 'Grilled Salmon' })
  item_name: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 'pending', enum: ['pending', 'preparing', 'ready', 'done'] })
  status: string;

  @ApiProperty({ example: 'No onions, extra sauce', required: false })
  notes?: string;

  @ApiProperty({ example: 12, description: 'Table number for dine-in orders', required: false })
  table_number?: number;

  @ApiProperty({ example: false, description: 'Whether this is a delivery order' })
  is_delivery: boolean;

  @ApiProperty({ example: '2025-12-28T14:30:00.000Z', description: 'When the order was placed' })
  created_at: string;

  @ApiProperty({ example: '15 minutes', description: 'Time since order was placed' })
  wait_time: string;
}

export class KitchenQueueByTableDto {
  @ApiProperty({ example: 125 })
  receipt_id: number;

  @ApiProperty({ example: 1001 })
  receipt_number: number;

  @ApiProperty({ example: 12, required: false })
  table_number?: number;

  @ApiProperty({ example: false })
  is_delivery: boolean;

  @ApiProperty({
    type: [KitchenItemResponseDto],
    description: 'Pending items for this receipt',
  })
  items: KitchenItemResponseDto[];

  @ApiProperty({ example: '2025-12-28T14:30:00.000Z' })
  order_time: string;
}
