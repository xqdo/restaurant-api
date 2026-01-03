import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ValidateIf,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { CreateReceiptItemDto } from './create-receipt-item.dto';

export class CreateReceiptDto {
  @ApiProperty({ example: false, description: 'Whether this is a delivery order' })
  @IsBoolean()
  is_delivery: boolean;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Customer phone number (required for delivery)',
  })
  @ValidateIf((o) => o.is_delivery === true)
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required for delivery orders' })
  phone_number?: string;

  @ApiPropertyOptional({
    example: '123 Main St, Apt 4B',
    description: 'Delivery address (required for delivery)',
  })
  @ValidateIf((o) => o.is_delivery === true)
  @IsString()
  @IsNotEmpty({ message: 'Location is required for delivery orders' })
  location?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Table ID (required for dine-in)',
  })
  @ValidateIf((o) => o.is_delivery === false)
  @IsNumber()
  @IsNotEmpty({ message: 'Table ID is required for dine-in orders' })
  table_id?: number;

  @ApiPropertyOptional({
    example: 'Customer allergic to peanuts',
    description: 'Special notes for the entire order',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    type: [CreateReceiptItemDto],
    description: 'List of items in this order (minimum 1 item required)',
    example: [
      { item_id: 15, quantity: 2, notes: 'No onions, extra sauce' },
      { item_id: 23, quantity: 1, notes: 'Extra spicy' },
      { item_id: 8, quantity: 3 },
    ],
    examples: {
      dine_in_order: {
        value: [
          { item_id: 15, quantity: 1, notes: 'Medium rare' },
          { item_id: 23, quantity: 2 },
          { item_id: 7, quantity: 2, notes: 'No ice' },
        ],
        description: 'Typical dine-in order with multiple items',
      },
      delivery_order: {
        value: [
          { item_id: 12, quantity: 2, notes: 'Extra napkins' },
          { item_id: 18, quantity: 1, notes: 'Contactless delivery' },
        ],
        description: 'Delivery order example',
      },
      large_party: {
        value: [
          { item_id: 15, quantity: 5 },
          { item_id: 16, quantity: 5 },
          { item_id: 20, quantity: 3, notes: 'Kids portions' },
          { item_id: 7, quantity: 8 },
        ],
        description: 'Large party order',
      },
    },
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptItemDto)
  items: CreateReceiptItemDto[];
}
