import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Error message or array of error messages',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: '2025-12-28T10:30:00.000Z',
    description: 'Timestamp when the error occurred',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/receipts',
    description: 'API endpoint where the error occurred',
  })
  path: string;

  @ApiProperty({
    example: 'POST',
    description: 'HTTP method used',
    required: false,
  })
  method?: string;
}

export class BadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  declare statusCode: 400;

  @ApiProperty({
    example: ['username should not be empty', 'password must be at least 6 characters'],
  })
  declare message: string[];
}

export class UnauthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 401 })
  declare statusCode: 401;

  @ApiProperty({ example: 'Unauthorized - Invalid or missing JWT token' })
  declare message: string;
}

export class ForbiddenResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 403 })
  declare statusCode: 403;

  @ApiProperty({ example: 'Forbidden - Insufficient permissions' })
  declare message: string;
}

export class NotFoundResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  declare statusCode: 404;

  @ApiProperty({ example: 'Resource not found' })
  declare message: string;
}

export class ConflictResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 409 })
  declare statusCode: 409;

  @ApiProperty({ example: 'Resource already exists' })
  declare message: string;
}

export class InternalServerErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 500 })
  declare statusCode: 500;

  @ApiProperty({ example: 'Internal server error' })
  declare message: string;
}
