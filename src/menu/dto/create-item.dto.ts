import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  IsPositive,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateItemDto {
  @ApiProperty({
    description: 'Name of the menu item (max 255 characters)',
    example: 'Grilled Salmon',
    examples: {
      main_course: {
        value: 'Grilled Salmon',
        description: 'Main course example',
      },
      appetizer: {
        value: 'Caesar Salad',
        description: 'Appetizer example',
      },
      dessert: {
        value: 'Chocolate Lava Cake',
        description: 'Dessert example',
      },
      beverage: {
        value: 'Fresh Lemonade',
        description: 'Beverage example',
      },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Item name is required' })
  @MaxLength(255, { message: 'Item name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'ID of the section this item belongs to (must exist)',
    example: 2,
    examples: {
      appetizers: { value: 1, description: 'Appetizers section' },
      main_courses: { value: 2, description: 'Main Courses section' },
      desserts: { value: 3, description: 'Desserts section' },
    },
  })
  @IsInt({ message: 'Section ID must be an integer' })
  @IsPositive({ message: 'Section ID must be a positive integer' })
  section_id: number;

  @ApiProperty({
    description: 'Price of the item in dollars (minimum 0)',
    example: 24.99,
    examples: {
      appetizer: { value: 8.99, description: 'Appetizer price range $8-15' },
      main_course: { value: 24.99, description: 'Main course price range $18-35' },
      dessert: { value: 7.50, description: 'Dessert price range $6-12' },
      beverage: { value: 3.99, description: 'Beverage price range $2-6' },
    },
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be at least 0' })
  price: number;

  @ApiPropertyOptional({
    description: 'Detailed description of the item (ingredients, preparation, etc.)',
    example: 'Fresh Atlantic salmon grilled to perfection, served with roasted vegetables and lemon butter sauce',
    examples: {
      detailed: {
        value: 'Fresh Atlantic salmon grilled to perfection, served with roasted vegetables and lemon butter sauce',
        description: 'Detailed description with sides',
      },
      simple: {
        value: 'Classic Caesar salad with homemade dressing',
        description: 'Simple description',
      },
      allergy_info: {
        value: 'Rich chocolate cake with molten center. Contains dairy, eggs, and gluten.',
        description: 'Description with allergy information',
      },
    },
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID of the associated image (upload image first via POST /menu/items/:id/image)',
    example: 1,
  })
  @IsInt({ message: 'Image ID must be an integer' })
  @IsOptional()
  image_id?: number;
}
