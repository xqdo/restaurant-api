import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { UnitOfMeasurement } from '../../common/enums';

export class FilterStorageItemsDto {
  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'olive',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: UnitOfMeasurement,
    description: 'Filter by unit of measurement',
  })
  @IsEnum(UnitOfMeasurement)
  @IsOptional()
  unit?: UnitOfMeasurement;

  @ApiPropertyOptional({
    description: 'Filter items below min_quantity threshold',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  low_stock?: boolean;
}
