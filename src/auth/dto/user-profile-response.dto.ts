import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  fullname: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({
    type: [String],
    example: ['Admin', 'Manager'],
    description: 'User roles',
    required: false,
  })
  roles?: string[];

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Account creation date',
    required: false,
  })
  created_at?: string;
}
