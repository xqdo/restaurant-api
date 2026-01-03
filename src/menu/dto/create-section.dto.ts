import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({
    description: 'Name of the menu section (max 255 characters)',
    example: 'Appetizers',
    examples: {
      appetizers: { value: 'Appetizers', description: 'Starters and small plates' },
      main_courses: { value: 'Main Courses', description: 'Entrees and main dishes' },
      desserts: { value: 'Desserts', description: 'Sweet endings' },
      beverages: { value: 'Beverages', description: 'Drinks and refreshments' },
      sides: { value: 'Side Dishes', description: 'Accompaniments' },
      specials: { value: 'Chef Specials', description: 'Today\'s special offerings' },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Section name is required' })
  @MaxLength(255, { message: 'Section name must not exceed 255 characters' })
  name: string;
}
