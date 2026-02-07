import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    description: 'Vendor name',
    example: 'ABC Suppliers',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vendor name is required' })
  @MaxLength(255, { message: 'Vendor name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '07701234567',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: 'Baghdad, Iraq',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Weekly delivery on Sundays',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
