import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateDeliveryGuyDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '07858004369' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+?964|0)?[0-9]{10}$/, {
    message: 'Phone number must be in valid format (e.g., 07858004369 or +9647858004369)',
  })
  phone_number: string;
}
