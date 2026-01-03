import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filters
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Restaurant Sales Management API')
    .setDescription(`
      # Restaurant Sales Management API

      Comprehensive REST API for managing restaurant operations including menu, orders, tables, discounts, and delivery.

      ## Features
      - 🔐 JWT-based authentication with role-based access control
      - 🍽️ Menu management with image upload support
      - 📋 Order/receipt processing for dine-in and delivery
      - 👨‍🍳 Kitchen workflow management
      - 💰 Flexible discount system (amount, percentage, combo)
      - 🚚 Delivery tracking and driver management
      - 📊 Comprehensive analytics and reporting
      - 📤 Data export (CSV, Excel)
      - 🔍 Audit logging for all actions

      ## Roles
      - **Admin**: Full system access
      - **Manager**: Operations management, reporting
      - **Waiter**: Order taking, table management
      - **Kitchen**: Kitchen workflow, item preparation
      - **Cashier**: Payment processing
      - **Delivery**: Delivery management

      ## Getting Started
      1. Login with credentials via \`POST /auth/login\`
      2. Copy the JWT token from response
      3. Click "Authorize" button and paste token
      4. Explore endpoints (protected routes require authentication)

      ## Base URL
      \`http://localhost:${process.env.PORT ?? 3000}\`
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: `Enter JWT token obtained from /auth/login endpoint.

**To authenticate:**
1. Call POST /auth/login with your credentials
2. Copy the access_token from the response
3. Click the "Authorize" button above
4. Paste the token (without "Bearer " prefix)
5. Click "Authorize" to save

**Token expires in 24 hours.**

**Example:**
\`\`\`json
POST /auth/login
{
  "username": "admin",
  "password": "Admin@123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\``,
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('authentication', 'User authentication and authorization')
    .addTag('menu-sections', 'Menu section management')
    .addTag('menu-items', 'Menu item management with image upload')
    .addTag('tables', 'Table operations and status management')
    .addTag('orders', 'Order and receipt management')
    .addTag('kitchen', 'Kitchen workflow and item preparation')
    .addTag('discounts', 'Discount and promotion management')
    .addTag('delivery-drivers', 'Delivery driver management')
    .addTag('delivery-orders', 'Delivery order tracking and assignment')
    .addTag('analytics', 'Sales analytics and business reports')
    .addTag('audit', 'System audit logs (Admin only)')
    .addTag('exports', 'Data export to CSV and Excel formats')
    .addTag('system', 'Health check and system status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'list',
      filter: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
