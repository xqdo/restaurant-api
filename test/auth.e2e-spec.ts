import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(
      new PrismaExceptionFilter(),
      new HttpExceptionFilter(),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'Admin@123' })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('admin');
      expect(response.body.user.roles).toContain('Admin');

      // Save token for subsequent tests
      adminToken = response.body.access_token;
    });

    it('should return 401 for invalid username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'nonexistent', password: 'password123' })
        .expect(401);
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 400 for missing username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('should return 400 for short password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: '123' })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return current user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body.username).toBe('admin');
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register new user with admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser',
          password: 'Password@123',
          fullname: 'New User',
          roleIds: [3], // Waiter role
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toBe('User created successfully');
    });

    it('should return 401 without token', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'anotheruser',
          password: 'Password@123',
          fullname: 'Another User',
          roleIds: [3],
        })
        .expect(401);
    });

    it('should return 409 for duplicate username', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'admin',
          password: 'Password@123',
          fullname: 'Duplicate Admin',
          roleIds: [1],
        })
        .expect(409);
    });

    it('should return 400 for invalid role IDs', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser2',
          password: 'Password@123',
          fullname: 'Test User 2',
          roleIds: [999], // Non-existent role
        })
        .expect(400);
    });
  });
});
