import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Admin' })
  name: string;
}

export class UserDataDto {
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
    example: ['Admin'],
    description: 'User roles',
  })
  roles: string[];
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MDM3NjQ4MDAsImV4cCI6MTcwMzg1MTIwMH0.abcd1234',
    description: 'JWT access token (expires in 24 hours)',
  })
  access_token: string;

  @ApiProperty({
    type: UserDataDto,
    description: 'Authenticated user information',
  })
  user: UserDataDto;
}
