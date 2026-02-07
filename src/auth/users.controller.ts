import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('users')
@Controller('auth/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'List all users (Admin only)',
    description: 'Returns all non-deleted users with their roles. Supports search and role filtering.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by fullname or username' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role name (Admin, Manager, Waiter, Kitchen, Cashier, Delivery)' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.authService.findAllUsers(search, role);
  }

  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOneUser(id);
  }

  @ApiOperation({
    summary: 'Update user (Admin only)',
    description: 'Update user fullname, roles, or active status. All fields are optional.',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.authService.updateUser(id, dto, user.id);
  }

  @ApiOperation({
    summary: 'Reset user password (Admin only)',
    description: 'Set a new password for the user. Minimum 6 characters.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.authService.resetPassword(id, dto, user.id);
  }

  @ApiOperation({
    summary: 'Soft delete user (Admin only)',
    description: 'Marks user as deleted. User will no longer be able to login.',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.authService.removeUser(id, user.id);
  }
}
