import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusEnum } from '@prisma/client';

export class UpdateReceiptItemStatusDto {
  @ApiProperty({
    enum: StatusEnum,
    example: 'preparing',
    description: 'New status for the receipt item (pending → preparing → ready → done)',
  })
  @IsEnum(StatusEnum)
  status: StatusEnum;
}
