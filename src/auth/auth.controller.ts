import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@prisma/client';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  ConflictResponseDto,
  InternalServerErrorResponseDto,
  BadRequestResponseDto,
} from '../common/dto/error-response.dto';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Login to get JWT token',
    description: `
      Authenticate user with username and password to receive a JWT access token.

      **Token Details:**
      - Token expires in 24 hours
      - Use token in Authorization header as "Bearer {token}"
      - Token contains user ID, username, and roles

      **Usage:**
      1. Call this endpoint with valid credentials
      2. Copy the access_token from response
      3. Click "Authorize" button in Swagger
      4. Paste token and click "Authorize"
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token and user information',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials - username or password incorrect',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'Register new user (Admin only)',
    description: `
      Create a new user account with assigned roles. Only accessible by Admin users.

      **Business Rules:**
      - Username must be unique
      - Password must be at least 6 characters
      - At least one role must be assigned
      - User is active by default unless specified otherwise

      **Available Roles:**
      - 1: Admin - Full system access
      - 2: Manager - Operations and reporting
      - 3: Waiter - Order management
      - 4: Kitchen - Order preparation
      - 5: Cashier - Payment processing
      - 6: Delivery - Delivery management
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: 5,
        fullname: 'Emily Johnson',
        username: 'emily_waiter',
        is_active: true,
        roles: ['Waiter'],
        created_at: '2025-12-28T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation failed',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Username already exists',
    type: ConflictResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post('register')
  register(@Body() registerDto: RegisterDto, @CurrentUser() user: User) {
    return this.authService.register(registerDto, user.id);
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description: `
      Retrieve the authenticated user's profile information.

      **Returns:**
      - User ID
      - Full name
      - Username
      - Account status
      - User roles

      **Authentication:**
      - Requires valid JWT token
      - Any authenticated user can access their own profile
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current user profile',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    return {
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      is_active: user.is_active,
      roles,
    };
  }
}
