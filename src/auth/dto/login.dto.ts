import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username for authentication (alphanumeric, no special characters)',
    example: 'admin',
    examples: {
      admin: {
        value: 'admin',
        description: 'Administrator account with full system access',
      },
      waiter: {
        value: 'john_waiter',
        description: 'Waiter account for order management',
      },
      manager: {
        value: 'sarah_mgr',
        description: 'Manager account for operations and reporting',
      },
      kitchen: {
        value: 'chef_mike',
        description: 'Kitchen staff account for order preparation',
      },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @ApiProperty({
    description: 'Password for authentication (minimum 6 characters)',
    example: 'Admin@123',
    minLength: 6,
    examples: {
      admin: {
        value: 'Admin@123',
        description: 'Strong password with uppercase, lowercase, number, and special character',
      },
      simple: {
        value: 'password123',
        description: 'Minimum 6 characters (not recommended for production)',
      },
    },
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
