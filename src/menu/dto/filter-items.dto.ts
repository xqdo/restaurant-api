import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterItemsDto {
  @ApiPropertyOptional({
    description: 'Filter by section ID',
    example: 1,
  })
  @IsInt({ message: 'Section ID must be an integer' })
  @IsOptional()
  @Type(() => Number)
  section_id?: number;

  @ApiPropertyOptional({
    description: 'Search items by name (case-insensitive)',
    example: 'salmon',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 10.0,
  })
  @IsNumber({}, { message: 'Minimum price must be a number' })
  @IsOptional()
  @Type(() => Number)
  min_price?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 50.0,
  })
  @IsNumber({}, { message: 'Maximum price must be a number' })
  @IsOptional()
  @Type(() => Number)
  max_price?: number;
}
