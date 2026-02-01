import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsNumber,
  Min,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { UsageReason } from '../../common/enums';

export class CreateStorageUsageDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the storage item',
  })
  @IsInt({ message: 'Storage item ID must be an integer' })
  @IsPositive({ message: 'Storage item ID must be a positive integer' })
  storage_item_id: number;

  @ApiProperty({
    example: 2.5,
    description: 'Quantity used',
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiPropertyOptional({
    enum: UsageReason,
    example: 'production',
    description: 'Reason for usage',
  })
  @IsEnum(UsageReason, { message: 'Invalid usage reason' })
  @IsOptional()
  reason?: UsageReason;

  @ApiPropertyOptional({
    example: 'Used for daily specials',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: '2025-01-15T14:30:00Z',
    description: 'Date when stock was used (defaults to now)',
  })
  @IsDateString({}, { message: 'Usage date must be a valid date string' })
  @IsOptional()
  usage_date?: string;
}
