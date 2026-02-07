import { ApiProperty } from '@nestjs/swagger';

export class ReceiptTotalBreakdownDto {
  @ApiProperty({ example: 125 })
  receipt_id: number;

  @ApiProperty({ example: 89.50, description: 'Sum of all items before discount' })
  subtotal: number;

  @ApiProperty({ example: 10.00, description: 'Manual discount applied at checkout' })
  discount: number;

  @ApiProperty({ example: 79.50, description: 'Final total after discount' })
  total: number;

  @ApiProperty({ example: 5, description: 'Number of items in the order' })
  items_count: number;
}
