import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CompleteReceiptDto {
  @ApiPropertyOptional({
    example: 5.00,
    description: 'Quick discount amount to apply at checkout (subtracted from total)',
  })
  @IsNumber({}, { message: 'Quick discount must be a number' })
  @Min(0, { message: 'Quick discount must be at least 0' })
  @IsOptional()
  quick_discount?: number;
}
