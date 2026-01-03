# Phase 3: Core Sales - Orders/Receipts

**Duration:** Weeks 5-7
**Goal:** Implement the heart of the sales system - order processing and kitchen workflow
**Milestone:** ⭐ FIRST SALE POSSIBLE - Complete transaction from order to payment

---

## Overview

Phase 3 is the **most critical phase** of the implementation. This is where revenue is generated. The receipts module handles order creation, item tracking, kitchen workflow, and payment completion.

### Why This is Critical
- **Revenue Generation:** This is where money is made
- **Customer Experience:** Orders must be accurate and timely
- **Kitchen Efficiency:** Proper status tracking reduces errors
- **Audit Compliance:** Complete transaction trail required

### Dependencies
- ✅ Phase 1: Authentication, validation, audit trail
- ✅ Phase 2: Menu items and tables must exist

---

## Module 3.1: Receipts (Orders) Module

### Business Value
- Process customer orders with multiple items
- Track order status from creation to completion
- Calculate totals with discount support (Phase 4)
- Maintain complete audit trail of all sales
- Support both dine-in and delivery orders

### File Structure
```
src/receipts/
├── receipts.module.ts
├── receipts.controller.ts
├── receipts.service.ts              # ⭐ Core sales logic
├── receipts.service.spec.ts
├── receipt-items/
│   ├── receipt-items.service.ts
│   └── receipt-items.service.spec.ts
└── dto/
    ├── create-receipt.dto.ts
    ├── create-receipt-item.dto.ts
    ├── update-receipt-item-status.dto.ts
    ├── receipt-summary.dto.ts
    └── filter-receipts.dto.ts
```

---

## Implementation Steps

### Step 1: Create DTOs

#### Create Receipt DTO
```typescript
// src/receipts/dto/create-receipt.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { CreateReceiptItemDto } from './create-receipt-item.dto';

export class CreateReceiptDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  is_delivery: boolean;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.is_delivery === true)
  phone_number?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.is_delivery === true)
  location?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.is_delivery === false)
  table_id?: number;

  @ApiPropertyOptional({ example: 'Customer allergic to peanuts' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptItemDto)
  items: CreateReceiptItemDto[];
}
```

#### Create Receipt Item DTO
```typescript
// src/receipts/dto/create-receipt-item.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class CreateReceiptItemDto {
  @ApiProperty({ example: 15 })
  @IsNumber()
  @IsPositive()
  item_id: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 'No onions' })
  @IsString()
  @IsOptional()
  notes?: string;
}
```

#### Update Status DTO
```typescript
// src/receipts/dto/update-receipt-item-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusEnum } from '@prisma/client';

export class UpdateReceiptItemStatusDto {
  @ApiProperty({ enum: StatusEnum, example: 'preparing' })
  @IsEnum(StatusEnum)
  status: StatusEnum;
}
```

### Step 2: Implement Receipts Service

```typescript
// src/receipts/receipts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { StatusEnum } from '@prisma/client';

@Injectable()
export class ReceiptsService {
  constructor(
    private prisma: PrismaService,
    private baseEntityService: BaseEntityService,
  ) {}

  /**
   * Create new receipt with items
   * Uses transaction to ensure data consistency
   */
  async create(dto: CreateReceiptDto, userId: number) {
    // Validation: Delivery orders need phone and location
    if (dto.is_delivery && (!dto.phone_number || !dto.location)) {
      throw new BadRequestException(
        'Delivery orders require phone_number and location',
      );
    }

    // Validation: Dine-in orders need table
    if (!dto.is_delivery && !dto.table_id) {
      throw new BadRequestException('Dine-in orders require table_id');
    }

    // Validate table exists and is available (if dine-in)
    if (dto.table_id) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.table_id },
        include: { baseEntity: true },
      });

      if (!table || table.baseEntity.isdeleted) {
        throw new NotFoundException('Table not found');
      }

      if (table.status !== 'AVAILABLE') {
        throw new BadRequestException('Table is not available');
      }
    }

    // Validate all items exist
    const itemIds = dto.items.map((item) => item.item_id);
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        baseEntity: { isdeleted: false },
      },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('One or more items not found');
    }

    // Create receipt with transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create base entity for receipt
      const receiptBaseEntity = await tx.baseEntity.create({
        data: {
          created_at: new Date(),
          created_by: userId,
        },
      });

      // 2. Get next receipt number
      const lastReceipt = await tx.receipt.findFirst({
        orderBy: { number: 'desc' },
      });
      const nextNumber = (lastReceipt?.number || 0) + 1;

      // 3. Create receipt
      const receipt = await tx.receipt.create({
        data: {
          number: nextNumber,
          is_delivery: dto.is_delivery,
          phone_number: dto.phone_number,
          location: dto.location,
          notes: dto.notes,
          table_id: dto.table_id,
          base_entity_id: receiptBaseEntity.id,
        },
      });

      // 4. Create receipt items
      const receiptItems = [];
      for (const itemDto of dto.items) {
        const itemBaseEntity = await tx.baseEntity.create({
          data: {
            created_at: new Date(),
            created_by: userId,
          },
        });

        const receiptItem = await tx.receiptItem.create({
          data: {
            receipt_id: receipt.id,
            item_id: itemDto.item_id,
            quantity: itemDto.quantity,
            status: StatusEnum.pending,
            notes: itemDto.notes,
            base_entity_id: itemBaseEntity.id,
          },
          include: {
            item: true,
          },
        });

        receiptItems.push(receiptItem);
      }

      // 5. Update table status to OCCUPIED (if dine-in)
      if (dto.table_id) {
        await tx.table.update({
          where: { id: dto.table_id },
          data: { status: 'OCCUPIED' },
        });
      }

      // 6. Calculate total
      const totals = await this.calculateTotal(receipt.id, tx);

      return {
        ...receipt,
        items: receiptItems,
        ...totals,
      };
    });
  }

  /**
   * Get receipt by ID with all details
   */
  async findOne(id: number) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        baseEntity: {
          include: {
            createdByUser: {
              select: { id: true, fullname: true },
            },
          },
        },
        table: true,
        receiptItems: {
          where: {
            baseEntity: { isdeleted: false },
          },
          include: {
            item: true,
          },
        },
        receiptDiscounts: {
          include: {
            discount: true,
          },
        },
      },
    });

    if (!receipt || receipt.baseEntity.isdeleted) {
      throw new NotFoundException('Receipt not found');
    }

    const totals = await this.calculateTotal(id);

    return {
      ...receipt,
      ...totals,
    };
  }

  /**
   * List receipts with filters
   */
  async findAll(query: any) {
    const where: any = {
      baseEntity: { isdeleted: false },
    };

    // Filter by delivery
    if (query.is_delivery !== undefined) {
      where.is_delivery = query.is_delivery === 'true';
    }

    // Filter by table
    if (query.table_id) {
      where.table_id = parseInt(query.table_id);
    }

    // Filter by date range
    if (query.start_date || query.end_date) {
      where.baseEntity = {
        ...where.baseEntity,
        created_at: {},
      };
      if (query.start_date) {
        where.baseEntity.created_at.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        where.baseEntity.created_at.lte = new Date(query.end_date);
      }
    }

    const receipts = await this.prisma.receipt.findMany({
      where,
      include: {
        table: true,
        receiptItems: {
          where: { baseEntity: { isdeleted: false } },
        },
      },
      orderBy: { number: 'desc' },
      skip: (query.page - 1) * query.perPage || 0,
      take: query.perPage || 10,
    });

    const total = await this.prisma.receipt.count({ where });

    return {
      data: receipts,
      meta: {
        total,
        page: query.page || 1,
        perPage: query.perPage || 10,
        totalPages: Math.ceil(total / (query.perPage || 10)),
      },
    };
  }

  /**
   * Calculate receipt total
   */
  async calculateTotal(receiptId: number, tx?: any) {
    const prisma = tx || this.prisma;

    const receiptItems = await prisma.receiptItem.findMany({
      where: {
        receipt_id: receiptId,
        baseEntity: { isdeleted: false },
      },
      include: { item: true },
    });

    // Calculate subtotal
    const subtotal = receiptItems.reduce((sum, ri) => {
      return sum + Number(ri.item.price) * Number(ri.quantity);
    }, 0);

    // Get discounts (Phase 4 will implement this)
    const receiptDiscounts = await prisma.receiptDiscount.findMany({
      where: { receipt_id: receiptId },
      include: { discount: true },
    });

    const receiptItemDiscounts = await prisma.receiptItemDiscount.findMany({
      where: {
        receiptItem: {
          receipt_id: receiptId,
        },
      },
    });

    // For now, discount is 0 (Phase 4 will calculate)
    const totalDiscount =
      receiptItemDiscounts.reduce(
        (sum, rid) => sum + Number(rid.applied_amount),
        0,
      ) || 0;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      total_discount: Number(totalDiscount.toFixed(2)),
      total: Number((subtotal - totalDiscount).toFixed(2)),
    };
  }

  /**
   * Complete receipt (mark as paid)
   */
  async complete(id: number, userId: number) {
    const receipt = await this.findOne(id);

    // Update base entity
    await this.baseEntityService.update(receipt.base_entity_id, userId);

    // Update table to AVAILABLE (if dine-in)
    if (receipt.table_id) {
      await this.prisma.table.update({
        where: { id: receipt.table_id },
        data: { status: 'AVAILABLE' },
      });
    }

    return {
      message: 'Receipt completed successfully',
      receipt_id: id,
      total: receipt.total,
    };
  }
}
```

### Step 3: Implement Receipt Items Service

```typescript
// src/receipts/receipt-items/receipt-items.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { StatusEnum } from '@prisma/client';

@Injectable()
export class ReceiptItemsService {
  constructor(
    private prisma: PrismaService,
    private baseEntityService: BaseEntityService,
  ) {}

  /**
   * Update receipt item status
   * Workflow: pending → preparing → ready → done
   */
  async updateStatus(
    receiptId: number,
    itemId: number,
    status: StatusEnum,
    userId: number,
  ) {
    const receiptItem = await this.prisma.receiptItem.findFirst({
      where: {
        id: itemId,
        receipt_id: receiptId,
        baseEntity: { isdeleted: false },
      },
      include: {
        baseEntity: true,
      },
    });

    if (!receiptItem) {
      throw new NotFoundException('Receipt item not found');
    }

    // Validate status transition
    this.validateStatusTransition(receiptItem.status, status);

    // Update item status
    await this.prisma.receiptItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Update audit trail
    await this.baseEntityService.update(
      receiptItem.base_entity_id,
      userId,
    );

    return {
      message: 'Status updated successfully',
      item_id: itemId,
      new_status: status,
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: StatusEnum,
    newStatus: StatusEnum,
  ) {
    const validTransitions = {
      pending: ['preparing'],
      preparing: ['ready'],
      ready: ['done'],
      done: [], // Cannot change from done
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
```

### Step 4: Create Controller

```typescript
// src/receipts/receipts.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
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
} from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { ReceiptItemsService } from './receipt-items/receipt-items.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptItemStatusDto } from './dto/update-receipt-item-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('receipts')
@Controller('receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(
    private receiptsService: ReceiptsService,
    private receiptItemsService: ReceiptItemsService,
  ) {}

  @ApiOperation({ summary: 'Create new receipt/order' })
  @ApiResponse({ status: 201, description: 'Receipt created' })
  @Roles('Waiter', 'Manager', 'Admin')
  @Post()
  create(@Body() dto: CreateReceiptDto, @CurrentUser() user: any) {
    return this.receiptsService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List all receipts' })
  @ApiResponse({ status: 200, description: 'List of receipts' })
  @Get()
  findAll(@Query() query: any) {
    return this.receiptsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ status: 200, description: 'Receipt details' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update receipt item status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @Roles('Kitchen', 'Waiter', 'Manager', 'Admin')
  @Put(':receiptId/items/:itemId/status')
  updateItemStatus(
    @Param('receiptId', ParseIntPipe) receiptId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateReceiptItemStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.receiptItemsService.updateStatus(
      receiptId,
      itemId,
      dto.status,
      user.id,
    );
  }

  @ApiOperation({ summary: 'Complete receipt (mark as paid)' })
  @ApiResponse({ status: 200, description: 'Receipt completed' })
  @Roles('Waiter', 'Manager', 'Admin')
  @Put(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.receiptsService.complete(id, user.id);
  }

  @ApiOperation({ summary: 'Get receipt total' })
  @ApiResponse({ status: 200, description: 'Receipt totals' })
  @Get(':id/total')
  async getTotal(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.calculateTotal(id);
  }
}
```

---

## Module 3.2: Kitchen Display System

### Kitchen Service
```typescript
// src/kitchen/kitchen.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusEnum } from '@prisma/client';

@Injectable()
export class KitchenService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all pending items for kitchen
   */
  async getPendingItems() {
    const items = await this.prisma.receiptItem.findMany({
      where: {
        status: { in: [StatusEnum.pending, StatusEnum.preparing] },
        baseEntity: { isdeleted: false },
      },
      include: {
        item: true,
        receipt: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        baseEntity: {
          created_at: 'asc', // Oldest first
        },
      },
    });

    return items;
  }

  /**
   * Get items grouped by table/receipt
   */
  async getItemsByTable() {
    const items = await this.getPendingItems();

    // Group by receipt
    const grouped = items.reduce((acc, item) => {
      const receiptId = item.receipt_id;
      if (!acc[receiptId]) {
        acc[receiptId] = {
          receipt_id: receiptId,
          receipt_number: item.receipt.number,
          table_number: item.receipt.table?.number,
          is_delivery: item.receipt.is_delivery,
          items: [],
        };
      }
      acc[receiptId].items.push(item);
      return acc;
    }, {});

    return Object.values(grouped);
  }
}
```

---

## Testing

### Unit Tests
```typescript
// src/receipts/receipts.service.spec.ts
describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        BaseEntityService,
        {
          provide: PrismaService,
          useValue: {
            receipt: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a dine-in receipt', async () => {
      // Test implementation
    });

    it('should throw error if delivery without phone', async () => {
      // Test implementation
    });
  });

  describe('calculateTotal', () => {
    it('should calculate subtotal correctly', async () => {
      // Mock receipt items
      // Calculate total
      // Assert result
    });
  });
});
```

### E2E Tests
```typescript
// test/receipts.e2e-spec.ts
describe('Receipts (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup app and login
  });

  it('/receipts (POST) - create dine-in order', () => {
    return request(app.getHttpServer())
      .post('/receipts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        is_delivery: false,
        table_id: 1,
        items: [{ item_id: 1, quantity: 2 }],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.number).toBeGreaterThan(0);
        expect(res.body.items).toHaveLength(1);
      });
  });
});
```

---

## Success Criteria

### Phase 3 Complete When: ⭐
- [ ] Can create receipt with multiple items
- [ ] Receipt number auto-increments correctly
- [ ] Receipt total calculates accurately
- [ ] Table status updates to OCCUPIED on order creation
- [ ] Table status returns to AVAILABLE on completion
- [ ] Kitchen can see all pending items
- [ ] Item status workflow enforced (pending → preparing → ready → done)
- [ ] Cannot transition done items to other statuses
- [ ] Delivery orders require phone and location
- [ ] Dine-in orders require table
- [ ] All operations recorded in audit trail
- [ ] Unit tests coverage > 80%
- [ ] E2E test for complete order flow passes

---

## Common Issues & Solutions

### Issue: Receipt number not incrementing
**Solution:** Ensure transaction is used and findFirst with orderBy

### Issue: Table stays OCCUPIED after completion
**Solution:** Verify complete() method updates table status

### Issue: Decimal precision in totals
**Solution:** Use .toFixed(2) and convert to Number

### Issue: Status transition allows invalid changes
**Solution:** Implement validateStatusTransition logic

---

## Next Steps

After Phase 3 completion:
1. Verify all success criteria met
2. Test complete order flow end-to-end
3. Ensure kitchen workflow smooth
4. Proceed to [Phase 4: Discounts & Delivery](./PHASE_4_DISCOUNTS_DELIVERY.md)

---

**Estimated Duration:** 2-3 weeks
**Priority:** CRITICAL - This is revenue-generating code
**First Sale Milestone:** Complete at end of this phase
