# Testing Guide

## Overview

This guide covers testing strategies, best practices, and examples for the restaurant sales management system.

**Testing Framework:** Jest
**E2E Testing:** Supertest
**Target Coverage:** 80% overall

---

## Test Types

### 1. Unit Tests
Test individual services, methods, and functions in isolation.

**Location:** `src/**/*.spec.ts`

**Example:**
```typescript
// src/receipts/receipts.service.spec.ts
describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        {
          provide: PrismaService,
          useValue: {
            receipt: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should calculate total correctly', async () => {
    // Arrange
    const receiptId = 1;
    jest.spyOn(prisma.receiptItem, 'findMany').mockResolvedValue([
      { quantity: 2, item: { price: 10 } },
      { quantity: 1, item: { price: 5 } },
    ]);

    // Act
    const result = await service.calculateTotal(receiptId);

    // Assert
    expect(result.subtotal).toBe(25);
  });
});
```

### 2. Integration Tests
Test interactions between multiple components.

**Example:**
```typescript
describe('Receipt Creation Integration', () => {
  it('should create receipt and update table status', async () => {
    const receipt = await receiptsService.create(dto, userId);
    const table = await tablesService.findOne(dto.table_id);

    expect(table.status).toBe('OCCUPIED');
  });
});
```

### 3. E2E Tests
Test complete API workflows from HTTP request to response.

**Location:** `test/*.e2e-spec.ts`

**Example:**
```typescript
// test/receipts.e2e-spec.ts
describe('Receipts (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });

    token = loginResponse.body.access_token;
  });

  it('/receipts (POST) - create order', () => {
    return request(app.getHttpServer())
      .post('/receipts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_delivery: false,
        table_id: 1,
        items: [{ item_id: 1, quantity: 2 }],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.total).toBeGreaterThan(0);
      });
  });
});
```

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test receipts.service.spec

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov

# View coverage in browser
open coverage/lcov-report/index.html
```

---

## Test Structure

### AAA Pattern
```typescript
it('should do something', async () => {
  // Arrange - Set up test data
  const input = { name: 'Test' };

  // Act - Execute the code
  const result = await service.doSomething(input);

  // Assert - Verify results
  expect(result).toBeDefined();
  expect(result.name).toBe('Test');
});
```

### Describe Blocks
```typescript
describe('ReceiptsService', () => {
  describe('create', () => {
    it('should create dine-in receipt', () => {});
    it('should create delivery receipt', () => {});
    it('should throw error if invalid table', () => {});
  });

  describe('calculateTotal', () => {
    it('should sum item prices', () => {});
    it('should apply discounts', () => {});
  });
});
```

---

## Mocking

### Mock PrismaService
```typescript
const mockPrismaService = {
  receipt: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};
```

### Mock Methods
```typescript
jest.spyOn(service, 'findOne').mockResolvedValue(mockReceipt);
jest.spyOn(prisma.item, 'findMany').mockResolvedValue(mockItems);
```

### Reset Mocks
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Testing Best Practices

### 1. Test One Thing
```typescript
// ✅ Good
it('should return 404 if item not found', () => {});
it('should return item if found', () => {});

// ❌ Bad
it('should handle finding items', () => {
  // Tests both found and not found cases
});
```

### 2. Use Descriptive Names
```typescript
// ✅ Good
it('should throw BadRequestException if delivery order missing phone', () => {});

// ❌ Bad
it('should validate input', () => {});
```

### 3. Test Error Cases
```typescript
it('should throw error if price is negative', async () => {
  const dto = { price: -5 };

  await expect(service.create(dto)).rejects.toThrow(BadRequestException);
});
```

### 4. Test Edge Cases
```typescript
it('should handle empty item list', () => {});
it('should handle large quantities', () => {});
it('should handle concurrent updates', () => {});
```

### 5. Don't Test Implementation Details
```typescript
// ✅ Good - Test behavior
it('should create receipt with correct total', () => {});

// ❌ Bad - Test implementation
it('should call prisma.create with correct parameters', () => {});
```

---

## Coverage Goals

| Component | Target | Priority |
|-----------|--------|----------|
| Services | 90% | High |
| Controllers | 70% | Medium |
| DTOs | 100% | High |
| Guards | 80% | High |
| Filters | 80% | Medium |

---

## Test Database

### Option 1: In-Memory SQLite (Fast)
```typescript
// Use for unit tests
beforeAll(async () => {
  process.env.DATABASE_URL = 'file:./test.db';
});
```

### Option 2: Test PostgreSQL Database
```bash
# In .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_test"
```

```typescript
// Reset database between tests
beforeEach(async () => {
  await prisma.receipt.deleteMany();
  await prisma.item.deleteMany();
  // ...
});
```

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'

      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Next Steps

1. Write unit tests alongside implementation
2. Achieve >80% coverage before moving to next phase
3. Add E2E tests for critical paths
4. Set up CI/CD pipeline with tests

---

**Last Updated:** 2025-12-28
