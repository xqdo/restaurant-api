import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;
}

export class CreatedResponseDto<T = any> extends SuccessResponseDto<T> {
  @ApiProperty({ example: 201 })
  declare statusCode: 201;

  @ApiProperty({ example: 'Resource created successfully' })
  declare message: string;
}

export class DeletedResponseDto extends SuccessResponseDto {
  @ApiProperty({ example: 200 })
  declare statusCode: 200;

  @ApiProperty({ example: 'Resource deleted successfully' })
  declare message: string;
}

export class UpdatedResponseDto<T = any> extends SuccessResponseDto<T> {
  @ApiProperty({ example: 200 })
  declare statusCode: 200;

  @ApiProperty({ example: 'Resource updated successfully' })
  declare message: string;
}
