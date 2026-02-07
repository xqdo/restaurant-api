import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  ArrayNotEmpty,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiPropertyOptional({
    description: 'Array of role IDs to assign',
    example: [2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one role must be assigned' })
  @IsInt({ each: true, message: 'Each role ID must be an integer' })
  roleIds?: number[];

  @ApiPropertyOptional({
    description: 'Whether user account is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
