import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { UnitOfMeasurement } from '../../common/enums';

export class CreateStorageItemDto {
  @ApiProperty({
    description: 'Name of the storage item/ingredient',
    example: 'Olive Oil',
  })
  @IsString()
  @IsNotEmpty({ message: 'Item name is required' })
  @MaxLength(255, { message: 'Item name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the item',
    example: 'Extra virgin olive oil for cooking',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: UnitOfMeasurement,
    example: 'liter',
    description: 'Unit of measurement',
  })
  @IsEnum(UnitOfMeasurement, { message: 'Invalid unit of measurement' })
  unit: UnitOfMeasurement;

  @ApiPropertyOptional({
    example: 5,
    description: 'Minimum quantity threshold for low stock alerts',
  })
  @IsNumber({}, { message: 'Minimum quantity must be a number' })
  @Min(0, { message: 'Minimum quantity must be at least 0' })
  @IsOptional()
  min_quantity?: number;
}
