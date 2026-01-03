import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class AssignDeliveryDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  delivery_guy_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  receipt_id: number;
}
