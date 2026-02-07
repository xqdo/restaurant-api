import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Authenticate user and return JWT token
   */
  async login(loginDto: LoginDto) {
    this.logger.debug(`Login attempt for username: ${loginDto.username}`);

    // Find user by username
    const user = await this.prisma.user.findFirst({
      where: { username: loginDto.username },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        baseEntity: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginDto.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      this.logger.warn(`Login failed: Inactive user - ${loginDto.username}`);
      throw new UnauthorizedException('User account is inactive');
    }

    // Check if user is soft deleted
    if (user.baseEntity?.isdeleted) {
      this.logger.warn(`Login failed: Deleted user - ${loginDto.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${loginDto.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Extract role names
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roles,
    };

    this.logger.log(`Login successful for user: ${loginDto.username}`);

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRATION || '8h',
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        roles,
        is_active: user.is_active,
      },
    };
  }

  /**
   * Register a new user (Admin only)
   * Creates user with base entity for audit trail
   */
  async register(registerDto: RegisterDto, createdBy: number) {
    this.logger.debug(`Registering new user: ${registerDto.username}`);

    // Check if username already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Verify all roles exist
    const roles = await this.prisma.role.findMany({
      where: { id: { in: registerDto.roleIds } },
    });

    if (roles.length !== registerDto.roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create base entity for audit trail
      const baseEntity = await tx.baseEntity.create({
        data: {
          created_at: new Date(),
          created_by: createdBy,
          isdeleted: false,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          fullname: registerDto.fullname,
          username: registerDto.username,
          password: hashedPassword,
          is_active: registerDto.is_active ?? true,
          base_entity_id: baseEntity.id,
        },
      });

      // Assign roles
      await tx.userRole.createMany({
        data: registerDto.roleIds.map((roleId) => ({
          user_id: user.id,
          role_id: roleId,
        })),
      });

      return { userId: user.id, username: user.username };
    });

    this.logger.log(`User registered successfully: ${result.username}`);

    return {
      message: 'User created successfully',
      userId: result.userId,
      username: result.username,
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find all users with optional search and role filter
   */
  async findAllUsers(search?: string, role?: string) {
    this.logger.debug(
      `Finding users with search: ${search}, role: ${role}`,
    );

    const where: any = {
      baseEntity: { isdeleted: false },
    };

    if (search) {
      where.OR = [
        { fullname: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (role) {
      where.userRoles = {
        some: { role: { name: role } },
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        userRoles: { include: { role: true } },
        baseEntity: { select: { created_at: true } },
      },
      orderBy: { id: 'asc' },
    });

    return users.map((user) => ({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      is_active: user.is_active,
      roles: user.userRoles.map((ur) => ur.role.name),
      role_ids: user.userRoles.map((ur) => ur.role_id),
      created_at: user.baseEntity.created_at,
    }));
  }

  /**
   * Find a single user by ID
   */
  async findOneUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        baseEntity: true,
      },
    });

    if (!user || user.baseEntity.isdeleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      is_active: user.is_active,
      roles: user.userRoles.map((ur) => ur.role.name),
      role_ids: user.userRoles.map((ur) => ur.role_id),
      created_at: user.baseEntity.created_at,
    };
  }

  /**
   * Update user (fullname, roles, is_active)
   */
  async updateUser(id: number, dto: UpdateUserDto, updatedBy: number) {
    this.logger.debug(`Updating user ${id}`);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { baseEntity: true },
    });

    if (!user || user.baseEntity.isdeleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.roleIds) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: dto.roleIds } },
      });
      if (roles.length !== dto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.fullname !== undefined) updateData.fullname = dto.fullname;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({ where: { id }, data: updateData });
      }

      if (dto.roleIds) {
        await tx.userRole.deleteMany({ where: { user_id: id } });
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            user_id: id,
            role_id: roleId,
          })),
        });
      }

      await this.baseEntityService.update(user.base_entity_id, updatedBy);

      return this.findOneUser(id);
    });
  }

  /**
   * Reset user password (Admin only)
   */
  async resetPassword(id: number, dto: ResetPasswordDto, updatedBy: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { baseEntity: true },
    });

    if (!user || user.baseEntity.isdeleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await this.baseEntityService.update(user.base_entity_id, updatedBy);

    return { message: 'Password reset successfully' };
  }

  /**
   * Soft delete user
   */
  async removeUser(id: number, deletedBy: number) {
    this.logger.debug(`Soft deleting user ${id}`);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { baseEntity: true },
    });

    if (!user || user.baseEntity.isdeleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.id === deletedBy) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.baseEntityService.softDelete(user.base_entity_id, deletedBy);

    return { message: 'User deleted successfully' };
  }
}
