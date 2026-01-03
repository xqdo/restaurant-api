import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateLogDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ example: 'USER_LOGIN' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiPropertyOptional({ example: { ip: '192.168.1.1', browser: 'Chrome' } })
  @IsOptional()
  metadata?: any;
}
