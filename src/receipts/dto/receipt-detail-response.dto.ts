import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReceiptItemDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 15 })
  item_id: number;

  @ApiProperty({ example: 'Grilled Salmon' })
  item_name: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 24.99 })
  unit_price: number;

  @ApiProperty({ example: 49.98 })
  subtotal: number;

  @ApiProperty({ example: 'pending', enum: ['pending', 'preparing', 'ready', 'done'] })
  status: string;

  @ApiPropertyOptional({ example: 'No onions, extra sauce' })
  notes?: string;
}

export class TableInfoDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 12 })
  number: number;

  @ApiProperty({ example: 'OCCUPIED', enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'] })
  status: string;
}

export class AppliedDiscountDto {
  @ApiProperty({ example: 1 })
  discount_id: number;

  @ApiProperty({ example: 'SUMMER20' })
  code: string;

  @ApiProperty({ example: 'Summer Sale - 20% Off' })
  name: string;

  @ApiProperty({ example: 17.99 })
  discount_amount: number;

  @ApiProperty({ example: 'percentage' })
  type: string;
}

export class ReceiptDetailResponseDto {
  @ApiProperty({ example: 125 })
  id: number;

  @ApiProperty({ example: 1001 })
  number: number;

  @ApiProperty({ example: false })
  is_delivery: boolean;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone_number?: string;

  @ApiPropertyOptional({ example: '123 Main St, Apt 4B' })
  location?: string;

  @ApiPropertyOptional({ type: TableInfoDto })
  table?: TableInfoDto;

  @ApiProperty({
    type: [ReceiptItemDetailDto],
    description: 'Order items with details',
  })
  items: ReceiptItemDetailDto[];

  @ApiProperty({ example: 89.50, description: 'Subtotal before discounts' })
  subtotal: number;

  @ApiProperty({ example: 13.43, description: 'Total discount amount' })
  discount_amount: number;

  @ApiProperty({ example: 76.07, description: 'Final total after discounts' })
  total: number;

  @ApiProperty({
    type: [AppliedDiscountDto],
    description: 'Applied discounts',
    required: false,
  })
  applied_discounts?: AppliedDiscountDto[];

  @ApiPropertyOptional({ example: 'Customer allergic to peanuts' })
  notes?: string;

  @ApiProperty({ example: 'John Doe', description: 'Waiter who created the order' })
  created_by_name: string;

  @ApiProperty({ example: '2025-12-28T14:30:00.000Z' })
  created_at: string;

  @ApiPropertyOptional({ example: '2025-12-28T15:45:00.000Z' })
  completed_at?: string;
}
