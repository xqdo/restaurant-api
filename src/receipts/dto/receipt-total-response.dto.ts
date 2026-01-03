import { ApiProperty } from '@nestjs/swagger';

export class ReceiptTotalBreakdownDto {
  @ApiProperty({ example: 125 })
  receipt_id: number;

  @ApiProperty({ example: 89.50, description: 'Sum of all items before discounts' })
  subtotal: number;

  @ApiProperty({ example: 13.43, description: 'Total discount amount applied' })
  discount_amount: number;

  @ApiProperty({ example: 76.07, description: 'Subtotal minus discounts' })
  total_before_tax: number;

  @ApiProperty({ example: 6.09, description: 'Tax amount (8%)', required: false })
  tax?: number;

  @ApiProperty({ example: 82.16, description: 'Final total including tax' })
  total: number;

  @ApiProperty({ example: 5, description: 'Number of items in the order' })
  items_count: number;

  @ApiProperty({
    type: [String],
    example: ['SUMMER20', 'COMBO_SPECIAL'],
    description: 'Discount codes applied',
  })
  applied_discount_codes: string[];

  @ApiProperty({ example: 15.00, description: 'Total savings from discounts' })
  total_savings: number;
}
