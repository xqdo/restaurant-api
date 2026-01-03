import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class ApplyDiscountDto {
  @ApiProperty({
    example: 'SUMMER20',
    description: 'Discount code to apply (case-sensitive, must match exactly)',
    examples: {
      percentage: { value: 'SUMMER20', description: '20% off summer sale' },
      amount: { value: 'SAVE10', description: '$10 off discount' },
      combo: { value: 'COMBO_DEAL', description: 'Combo meal special' },
    },
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 125,
    description: 'Receipt/order ID to apply the discount to',
  })
  @IsNumber()
  @IsPositive()
  receipt_id: number;
}
