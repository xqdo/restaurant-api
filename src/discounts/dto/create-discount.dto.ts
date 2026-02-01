import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { DiscountTypeEnum } from '../../common/enums';

export class CreateDiscountDto {
  @ApiProperty({
    example: 'Summer Sale',
    description: 'Display name for the discount',
    examples: {
      seasonal: { value: 'Summer Sale 2025', description: 'Seasonal promotion' },
      event: { value: 'Happy Hour Special', description: 'Time-based discount' },
      loyalty: { value: 'VIP Customer Discount', description: 'Loyalty program' },
    },
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'SUMMER20',
    description: 'Unique discount code (case-sensitive)',
    examples: {
      percentage: { value: 'SUMMER20', description: '20% off discount code' },
      amount: { value: 'SAVE10', description: '$10 off discount code' },
      combo: { value: 'COMBO_DEAL', description: 'Combo meal discount' },
    },
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    enum: DiscountTypeEnum,
    example: 'percentage',
    description: 'Type of discount: amount (fixed $), percentage (%), or combo (special combo pricing)',
    examples: {
      percentage: { value: 'percentage', description: 'Percentage off total (e.g., 20% off)' },
      amount: { value: 'amount', description: 'Fixed amount off (e.g., $10 off)' },
      combo: { value: 'combo', description: 'Special combo pricing for specific items' },
    },
  })
  @IsEnum(DiscountTypeEnum)
  type: DiscountTypeEnum;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of receipts that can use this discount (leave empty for unlimited)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  max_receipts?: number;

  @ApiPropertyOptional({
    example: 10.00,
    description: 'Fixed discount amount in dollars (REQUIRED when type=amount)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ValidateIf((o) => o.type === DiscountTypeEnum.amount)
  amount?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Percentage discount 0-100 (REQUIRED when type=percentage)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @ValidateIf((o) => o.type === DiscountTypeEnum.percentage)
  persentage?: number; // Keep typo from schema

  @ApiProperty({
    example: '2025-06-01T00:00:00Z',
    description: 'Start date and time for discount validity (ISO 8601 format)',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    example: '2025-08-31T23:59:59Z',
    description: 'End date and time for discount validity (ISO 8601 format)',
  })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({
    example: [15, 23, 8],
    description: 'Menu item IDs eligible for this discount (REQUIRED for type=combo)',
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  item_ids?: number[];

  @ApiPropertyOptional({
    example: 50.00,
    description: 'Minimum order amount required to use this discount (condition)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  min_amount?: number;

  @ApiPropertyOptional({
    example: ['Monday', 'Friday', 'Saturday'],
    description: 'Days of week when discount is valid (condition)',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  valid_days?: string[];
}
