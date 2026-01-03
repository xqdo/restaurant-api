import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
}
