import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    examples: {
      waiter: {
        value: 'Emily Johnson',
        description: 'Waiter staff member',
      },
      kitchen: {
        value: 'Michael Chen',
        description: 'Kitchen staff member',
      },
      manager: {
        value: 'Sarah Williams',
        description: 'Restaurant manager',
      },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullname: string;

  @ApiProperty({
    description: 'Unique username for the user (must be unique across all users)',
    example: 'johndoe',
    examples: {
      waiter: {
        value: 'emily_waiter',
        description: 'Username for waiter account',
      },
      kitchen: {
        value: 'chef_michael',
        description: 'Username for kitchen staff',
      },
      delivery: {
        value: 'driver_alex',
        description: 'Username for delivery personnel',
      },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @ApiProperty({
    description: 'Password for the user account (minimum 6 characters, recommend using strong passwords)',
    example: 'SecurePass@123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Array of role IDs to assign to the user. Common roles: 1=Admin, 2=Manager, 3=Waiter, 4=Kitchen, 5=Cashier, 6=Delivery',
    example: [3],
    type: [Number],
    examples: {
      waiter: {
        value: [3],
        description: 'Assign Waiter role only',
      },
      manager_waiter: {
        value: [2, 3],
        description: 'Assign both Manager and Waiter roles',
      },
      kitchen: {
        value: [4],
        description: 'Assign Kitchen role only',
      },
    },
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one role must be assigned' })
  @IsInt({ each: true, message: 'Each role ID must be an integer' })
  roleIds: number[];

  @ApiProperty({
    description: 'Whether the user account is active (defaults to true if not specified)',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
