# Getting Started Guide

Welcome to the Restaurant Sales Management System! This guide will help you set up the development environment and understand the project structure.

---

## Prerequisites

### Required Software
- **Node.js:** v18.x or higher (v20+ recommended)
- **PostgreSQL:** v14.x or higher
- **npm:** v9.x or higher
- **Git:** Latest version

### Recommended Tools
- **VS Code** with extensions:
  - Prisma
  - ESLint
  - Prettier
  - REST Client (for API testing)
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **TablePlus** for database management

---

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd resturant-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - NODE_ENV
# - PORT
```

**Example .env:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRATION="1h"
NODE_ENV="development"
PORT=3000
```

### 4. Database Setup
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed database with initial data
npm run seed
```

### 5. Verify Installation
```bash
# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run start:dev
```

The server should start on http://localhost:3000

---

## Project Structure

```
resturant-api/
├── src/                          # Source code
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module
│   ├── prisma/                   # Database module
│   ├── common/                   # Shared utilities
│   ├── auth/                     # Authentication (Phase 1)
│   ├── menu/                     # Menu management (Phase 2)
│   ├── tables/                   # Table operations (Phase 2)
│   ├── receipts/                 # Orders/sales (Phase 3)
│   ├── kitchen/                  # Kitchen display (Phase 3)
│   ├── discounts/                # Discounts (Phase 4)
│   ├── delivery/                 # Delivery (Phase 4)
│   ├── reports/                  # Analytics (Phase 5)
│   ├── audit/                    # Audit logs (Phase 5)
│   └── exports/                  # Data export (Phase 5)
│
├── test/                         # E2E tests
├── prisma/                       # Prisma schema and migrations
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
├── docs/                         # Documentation
│   ├── README.md                 # Documentation index
│   ├── IMPLEMENTATION_ROADMAP.md # Full roadmap
│   ├── phases/                   # Phase-specific docs
│   ├── architecture/             # Architecture docs
│   └── guides/                   # How-to guides
│
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── nest-cli.json                 # NestJS CLI config
└── README.md                     # Project README
```

---

## Development Workflow

### Starting Development
```bash
# Start development server with hot-reload
npm run start:dev

# The server will restart automatically on file changes
```

### Running Tests
```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

### Database Operations
```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## API Documentation

### Swagger UI
Once Phase 1 is implemented, access interactive API documentation:
```
http://localhost:3000/api/docs
```

### Testing Endpoints

#### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'

# Get profile (replace TOKEN with JWT from login)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

#### Using VS Code REST Client
Create a `test.http` file:
```http
### Login
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

### Get Profile
GET http://localhost:3000/auth/me
Authorization: Bearer {{token}}
```

---

## Common Tasks

### Adding a New Module
```bash
# Use NestJS CLI to generate module
nest g module moduleName
nest g controller moduleName
nest g service moduleName
```

### Creating DTOs
```typescript
// src/module/dto/create-example.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateExampleDto {
  @ApiProperty({ example: 'Example name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### Adding a New Endpoint
```typescript
// In controller
@ApiTags('examples')
@Controller('examples')
export class ExamplesController {

  @ApiOperation({ summary: 'Create example' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateExampleDto) {
    return this.examplesService.create(dto);
  }
}
```

### Using Prisma in Services
```typescript
@Injectable()
export class ExamplesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.example.findMany({
      where: {
        baseEntity: { isdeleted: false }
      }
    });
  }
}
```

---

## Development Best Practices

### 1. Always Use DTOs
```typescript
// ✅ Good
@Post()
create(@Body() createDto: CreateItemDto) {
  return this.service.create(createDto);
}

// ❌ Bad
@Post()
create(@Body() data: any) {
  return this.service.create(data);
}
```

### 2. Validate All Inputs
```typescript
// Use class-validator decorators
export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### 3. Use Audit Trail Service
```typescript
// For all creates/updates/deletes
const baseEntity = await this.baseEntityService.create(userId);
const item = await this.prisma.item.create({
  data: {
    ...itemData,
    base_entity_id: baseEntity.id,
  }
});
```

### 4. Never Hard Delete
```typescript
// ✅ Good - Soft delete
await this.baseEntityService.softDelete(baseEntityId, userId);

// ❌ Bad - Hard delete
await this.prisma.item.delete({ where: { id } });
```

### 5. Write Tests
```typescript
describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ItemsService, PrismaService],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('should create an item', async () => {
    const item = await service.create(createDto, userId);
    expect(item).toBeDefined();
  });
});
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d postgres
```

### Prisma Client Out of Sync
```bash
# Regenerate Prisma Client
npx prisma generate
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors
```bash
# Clean dist folder
rm -rf dist

# Rebuild
npm run build
```

---

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
# Hot-reload enabled
# Detailed error messages
# Swagger UI enabled
```

### Production
```bash
NODE_ENV=production
# Optimized build
# Minimal error details
# Swagger UI disabled (optional)
```

---

## Git Workflow

### Branch Strategy
```bash
# Feature branch
git checkout -b feature/auth-module

# Bug fix
git checkout -b fix/login-error

# Documentation
git checkout -b docs/api-guide
```

### Commit Messages
```bash
# Format: type(scope): message

git commit -m "feat(auth): add JWT authentication"
git commit -m "fix(receipts): correct total calculation"
git commit -m "docs(readme): update installation steps"
git commit -m "test(items): add unit tests for service"
```

### Before Pushing
```bash
# Run all checks
npm run lint
npm run format
npm test
npm run build
```

---

## Next Steps

1. **Review Documentation:**
   - [Implementation Roadmap](../IMPLEMENTATION_ROADMAP.md)
   - [Database Schema](../architecture/DATABASE_SCHEMA.md)
   - [Phase 1: Foundation](../phases/PHASE_1_FOUNDATION.md)

2. **Set Up Development Environment:**
   - Follow installation steps above
   - Verify all tests pass
   - Access Swagger docs

3. **Start Implementation:**
   - Begin with Phase 1 (Authentication)
   - Follow phase sequence
   - Write tests alongside code

4. **Join Development:**
   - Review coding standards
   - Understand project structure
   - Read architecture docs

---

## Useful Commands Reference

```bash
# Development
npm run start:dev          # Start dev server
npm run build              # Build project
npm test                   # Run tests
npm run lint               # Lint code
npm run format             # Format code

# Database
npx prisma migrate dev     # Create & apply migration
npx prisma generate        # Generate Prisma Client
npx prisma studio          # Open database GUI
npx prisma db push         # Push schema without migration

# NestJS CLI
nest g module <name>       # Generate module
nest g controller <name>   # Generate controller
nest g service <name>      # Generate service
nest g resource <name>     # Generate full CRUD resource
```

---

## Support & Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Project Documentation
- [Implementation Roadmap](../IMPLEMENTATION_ROADMAP.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Last Updated:** 2025-12-28
**Version:** 1.0.0
