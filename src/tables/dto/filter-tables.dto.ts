import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TableStatus } from '../../common/enums';

export class FilterTablesDto {
  @ApiPropertyOptional({
    description: 'Filter by table status',
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  @IsEnum(TableStatus, {
    message: 'Status must be one of: AVAILABLE, OCCUPIED, RESERVED',
  })
  @IsOptional()
  status?: TableStatus;
}
