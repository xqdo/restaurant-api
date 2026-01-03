import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateTableDto {
  @ApiProperty({
    description: 'Unique table number (must be unique, positive integer)',
    example: 12,
    examples: {
      small: { value: 1, description: 'Table 1 - Small table' },
      medium: { value: 12, description: 'Table 12 - Medium table' },
      large: { value: 25, description: 'Table 25 - Large table' },
      vip: { value: 101, description: 'Table 101 - VIP section' },
    },
  })
  @IsInt({ message: 'Table number must be an integer' })
  @IsPositive({ message: 'Table number must be a positive integer' })
  number: number;
}
