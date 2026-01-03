import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MarkPaidDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  is_paid: boolean;
}
