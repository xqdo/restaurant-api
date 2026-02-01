import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateStorageEntryDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the storage item',
  })
  @IsInt({ message: 'Storage item ID must be an integer' })
  @IsPositive({ message: 'Storage item ID must be a positive integer' })
  storage_item_id: number;

  @ApiProperty({
    example: 10.5,
    description: 'Quantity received',
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiPropertyOptional({
    example: 12.99,
    description: 'Cost per unit',
  })
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price must be at least 0' })
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({
    example: 'ABC Suppliers',
    description: 'Supplier name',
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({
    example: 'Weekly delivery',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: '2025-01-15T10:00:00Z',
    description: 'Date when stock was received (defaults to now)',
  })
  @IsDateString({}, { message: 'Entry date must be a valid date string' })
  @IsOptional()
  entry_date?: string;
}
