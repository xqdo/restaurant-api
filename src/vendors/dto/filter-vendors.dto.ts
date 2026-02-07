import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class FilterVendorsDto {
  @ApiPropertyOptional({
    description: 'Search by vendor name',
    example: 'ABC',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
