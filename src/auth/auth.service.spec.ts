import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let baseEntityService: BaseEntityService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    fullname: 'Test User',
    is_active: true,
    base_entity_id: 1,
    baseEntity: {
      id: 1,
      isdeleted: false,
      created_at: new Date(),
      created_by: null,
      updated_at: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    },
    userRoles: [
      {
        id: 1,
        user_id: 1,
        role_id: 1,
        role: { id: 1, name: 'Admin' },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            role: {
              findMany: jest.fn(),
            },
            baseEntity: {
              create: jest.fn(),
            },
            userRole: {
              createMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-jwt-token'),
          },
        },
        {
          provide: BaseEntityService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    baseEntityService = module.get<BaseEntityService>(BaseEntityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('test-jwt-token');
      expect(result.user.username).toBe('testuser');
      expect(result.user.roles).toEqual(['Admin']);
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ username: 'invalid', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      await expect(
        service.login({ username: 'testuser', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for soft-deleted user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        baseEntity: { ...mockUser.baseEntity, isdeleted: true },
      });

      await expect(
        service.login({ username: 'testuser', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should throw ConflictException if username exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register(
          {
            username: 'testuser',
            password: 'password123',
            fullname: 'Test User',
            roleIds: [1],
          },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
