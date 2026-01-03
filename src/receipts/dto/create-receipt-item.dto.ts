import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class CreateReceiptItemDto {
  @ApiProperty({
    example: 15,
    description: 'Menu item ID (must exist in menu)',
    examples: {
      main_course: { value: 15, description: 'Grilled Salmon' },
      appetizer: { value: 5, description: 'Caesar Salad' },
      beverage: { value: 7, description: 'Iced Tea' },
    },
  })
  @IsNumber()
  @IsPositive()
  item_id: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity ordered (must be positive integer)',
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    example: 'No onions, extra sauce',
    description: 'Special instructions for this item (allergies, cooking preferences, etc.)',
    examples: {
      allergy: { value: 'No peanuts - severe allergy', description: 'Allergy information' },
      cooking: { value: 'Medium rare, no butter', description: 'Cooking preference' },
      extra: { value: 'Extra cheese, light on sauce', description: 'Customization' },
    },
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
