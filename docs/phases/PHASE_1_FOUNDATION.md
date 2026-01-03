# Phase 1: Foundation & Infrastructure

**Duration:** Weeks 1-2
**Goal:** Establish secure, scalable foundation for all features
**Deliverables:** Authentication, API documentation, validation, audit trail

---

## Overview

Phase 1 creates the foundational infrastructure that all subsequent features depend on. Without proper authentication, validation, and audit logging, building feature modules would be insecure and inconsistent.

### Why This Must Come First
- **Security:** All endpoints need authentication and authorization
- **Quality:** Validation prevents bad data from entering the system
- **Compliance:** Audit trail required for sales transactions
- **Developer Experience:** Swagger docs make API development faster

---

## Module 1.1: Authentication & Authorization

### Business Value
- Secure API access for different staff roles
- Role-based permissions (Manager can create items, Waiter cannot)
- JWT tokens for stateless authentication
- Track which user performed each action

### Technical Stack
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

### File Structure
```
src/auth/
├── auth.module.ts                # Module definition
├── auth.controller.ts            # Login, register endpoints
├── auth.service.ts               # Business logic
├── guards/
│   ├── jwt-auth.guard.ts        # Protect routes with JWT
│   └── roles.guard.ts           # Check user roles
├── strategies/
│   └── jwt.strategy.ts          # Passport JWT strategy
├── decorators/
│   ├── roles.decorator.ts       # @Roles('Admin', 'Manager')
│   └── current-user.decorator.ts # @CurrentUser() in controllers
└── dto/
    ├── login.dto.ts             # Email/password validation
    └── register.dto.ts          # New user data
```

### Implementation Steps

#### Step 1: Create Auth Module
```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

#### Step 2: Create DTOs with Validation
```typescript
// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

// src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsArray } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ type: [Number], example: [1] })
  @IsArray()
  roleIds: number[];
}
```

#### Step 3: Implement Auth Service
```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { username: loginDto.username },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.userRoles.map(ur => ur.role.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        roles: user.userRoles.map(ur => ur.role.name),
      },
    };
  }

  async register(registerDto: RegisterDto, createdBy: number) {
    // Create base entity for audit trail
    const baseEntity = await this.prisma.baseEntity.create({
      data: {
        created_at: new Date(),
        created_by: createdBy,
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullname: registerDto.fullname,
        username: registerDto.username,
        password: hashedPassword,
        base_entity_id: baseEntity.id,
      },
    });

    // Assign roles
    await this.prisma.userRole.createMany({
      data: registerDto.roleIds.map(roleId => ({
        user_id: user.id,
        role_id: roleId,
      })),
    });

    return { message: 'User created successfully', userId: user.id };
  }

  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
  }
}
```

#### Step 4: Create JWT Strategy
```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

#### Step 5: Create Guards
```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRoles = user.userRoles.map(ur => ur.role.name);

    return requiredRoles.some(role => userRoles.includes(role));
  }
}
```

#### Step 6: Create Decorators
```typescript
// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### Step 7: Create Controller
```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login to get JWT token' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Register new user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post('register')
  register(@Body() registerDto: RegisterDto, @CurrentUser() user: any) {
    return this.authService.register(registerDto, user.id);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

### Testing Authentication

#### Unit Tests
```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { findFirst: jest.fn(), create: jest.fn() },
            baseEntity: { create: jest.fn() },
            userRole: { createMany: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'test-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests...
});
```

#### E2E Tests
```typescript
// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST) - success', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('user');
      });
  });

  it('/auth/login (POST) - invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });
});
```

---

## Module 1.2: API Documentation (Swagger)

### Setup in main.ts
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Restaurant Sales API')
    .setDescription('API for restaurant management system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('menu', 'Menu management')
    .addTag('tables', 'Table operations')
    .addTag('receipts', 'Order/Receipt management')
    .addTag('discounts', 'Discount management')
    .addTag('delivery', 'Delivery operations')
    .addTag('reports', 'Analytics and reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger docs available at: http://localhost:3000/api/docs');
}
bootstrap();
```

---

## Module 1.3: Global Error Handling & Validation

### HTTP Exception Filter
```typescript
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message,
    });
  }
}
```

### Prisma Exception Filter
```typescript
// src/common/filters/prisma-exception.filter.ts
import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002':
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Unique constraint violation',
        });
        break;
      case 'P2025':
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        });
        break;
      default:
        super.catch(exception, host);
    }
  }
}
```

### Apply Filters Globally
```typescript
// src/main.ts (add to bootstrap function)
app.useGlobalFilters(
  new HttpExceptionFilter(),
  new PrismaExceptionFilter(),
);
```

---

## Module 1.4: Audit Trail Service

### Base Entity Service
```typescript
// src/common/base-entity/base-entity.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BaseEntityService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number) {
    return this.prisma.baseEntity.create({
      data: {
        created_at: new Date(),
        created_by: userId,
      },
    });
  }

  async update(baseEntityId: number, userId: number) {
    return this.prisma.baseEntity.update({
      where: { id: baseEntityId },
      data: {
        updated_at: new Date(),
        updated_by: userId,
      },
    });
  }

  async softDelete(baseEntityId: number, userId: number) {
    return this.prisma.baseEntity.update({
      where: { id: baseEntityId },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
        isdeleted: true,
      },
    });
  }
}
```

---

## Environment Configuration

### .env File
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="1h"
NODE_ENV="development"
PORT=3000
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Can login with username/password and receive JWT
- [ ] Protected routes return 401 without token
- [ ] Role-based access working (Admin can register users, Waiter cannot)
- [ ] Swagger UI accessible at `/api/docs`
- [ ] Invalid DTOs return 400 with detailed validation errors
- [ ] Prisma errors translated to proper HTTP status codes
- [ ] Audit trail captures created_by/updated_by/deleted_by
- [ ] Unit tests passing for AuthService
- [ ] E2E tests passing for login/register

---

## Common Issues & Solutions

### Issue: JWT_SECRET not found
**Solution:** Create .env file with JWT_SECRET

### Issue: Circular dependency in guards
**Solution:** Use forwardRef() or restructure modules

### Issue: Validation not working
**Solution:** Ensure ValidationPipe is applied globally in main.ts

---

## Next Steps

After Phase 1 completion:
1. Review success criteria checklist
2. Ensure all tests passing
3. Verify Swagger docs accessible
4. Proceed to [Phase 2: Menu & Tables](./PHASE_2_MENU_TABLES.md)

---

**Estimated Duration:** 1-2 weeks
**Critical Path:** Yes - all other phases depend on this
