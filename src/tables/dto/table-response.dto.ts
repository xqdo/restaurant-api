import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrentReceiptDto {
  @ApiProperty({ example: 125 })
  id: number;

  @ApiProperty({ example: 1001 })
  number: number;

  @ApiProperty({ example: '2025-12-28T14:30:00.000Z' })
  created_at: string;
}

export class TableResponseDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 12 })
  number: number;

  @ApiProperty({ example: 'OCCUPIED', enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'] })
  status: string;

  @ApiPropertyOptional({ type: CurrentReceiptDto, description: 'Current active receipt if table is occupied' })
  current_receipt?: CurrentReceiptDto;

  @ApiProperty({ example: false })
  isdeleted: boolean;

  @ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2025-12-28T14:30:00.000Z', required: false })
  last_occupied_at?: string;
}
