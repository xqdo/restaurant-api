# Phase 2: Menu & Tables

**Duration:** Weeks 3-4
**Goal:** Implement menu management and table operations
**Dependencies:** Phase 1 (Authentication, Validation, Audit)

---

## Overview

Phase 2 implements the prerequisites for taking orders: a digital menu system and table management. These are read-heavy operations that set up the foundation for sales.

### Key Modules
1. **Menu Module** - Sections (categories) and Items with pricing
2. **Tables Module** - Table availability tracking

---

## Module 2.1: Menu Management

### Business Features
- Create/update/delete menu sections (Appetizers, Mains, etc.)
- Create/update/delete menu items with pricing
- Upload images for items
- Search and filter items by section
- Soft delete preserves menu history

### Endpoints
```
GET    /menu/sections              # List all sections
POST   /menu/sections              # Create section (Manager only)
PUT    /menu/sections/:id          # Update section
DELETE /menu/sections/:id          # Soft delete section

GET    /menu/items                 # List items (with filters)
GET    /menu/items/:id             # Get item details
POST   /menu/items                 # Create item (Manager only)
PUT    /menu/items/:id             # Update item
DELETE /menu/items/:id             # Soft delete item
POST   /menu/items/:id/image       # Upload image
```

### DTOs Example
```typescript
export class CreateItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  section_id: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  image_id?: number;
}
```

### Key Business Logic
```typescript
// Soft delete pattern
async remove(id: number, userId: number) {
  const item = await this.findOne(id);
  await this.baseEntityService.softDelete(item.base_entity_id, userId);
  return { message: 'Item deleted successfully' };
}

// Search and filter
async findAll(query: FilterItemsDto) {
  const where: any = {
    baseEntity: { isdeleted: false },
  };

  if (query.section_id) {
    where.section_id = query.section_id;
  }

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  return this.prisma.item.findMany({
    where,
    include: { section: true, image: true },
  });
}
```

---

## Module 2.2: Tables Management

### Business Features
- Create tables with unique numbers
- Track availability (AVAILABLE/OCCUPIED/RESERVED)
- Filter available tables
- Auto-update status when orders created

### Endpoints
```
GET    /tables                     # List all tables
GET    /tables/available           # Only available tables
POST   /tables                     # Create table (Manager only)
PUT    /tables/:id/status          # Update status
DELETE /tables/:id                 # Soft delete table
```

### Status Workflow
```
AVAILABLE → RESERVED (optional) → OCCUPIED (order active) → AVAILABLE (order complete)
```

### DTOs Example
```typescript
export class CreateTableDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsPositive()
  number: number;
}

export class UpdateTableStatusDto {
  @ApiProperty({ enum: TableStatus })
  @IsEnum(TableStatus)
  status: TableStatus;
}
```

### Key Business Logic
```typescript
// Prevent duplicate table numbers
async create(dto: CreateTableDto, userId: number) {
  const existing = await this.prisma.table.findFirst({
    where: { number: dto.number, baseEntity: { isdeleted: false } },
  });

  if (existing) {
    throw new ConflictException('Table number already exists');
  }

  // Create with base entity
  const baseEntity = await this.baseEntityService.create(userId);

  return this.prisma.table.create({
    data: {
      number: dto.number,
      status: TableStatus.AVAILABLE,
      base_entity_id: baseEntity.id,
    },
  });
}
```

---

## File Structure

```
src/menu/
├── menu.module.ts
├── sections/
│   ├── sections.controller.ts
│   ├── sections.service.ts
│   └── sections.service.spec.ts
├── items/
│   ├── items.controller.ts
│   ├── items.service.ts
│   └── items.service.spec.ts
├── images/
│   └── images.service.ts
└── dto/
    ├── create-section.dto.ts
    ├── update-section.dto.ts
    ├── create-item.dto.ts
    ├── update-item.dto.ts
    └── filter-items.dto.ts

src/tables/
├── tables.module.ts
├── tables.controller.ts
├── tables.service.ts
├── tables.service.spec.ts
└── dto/
    ├── create-table.dto.ts
    └── update-table-status.dto.ts
```

---

## Dependencies to Install

```bash
# For file upload
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

---

## Success Criteria

### Phase 2 Complete When:
- [ ] Can create/update/delete menu sections
- [ ] Can create/update/delete menu items
- [ ] Image upload working for items
- [ ] Can filter items by section
- [ ] Can search items by name
- [ ] Table status management functional
- [ ] Only available tables shown when filtering
- [ ] Duplicate table numbers prevented
- [ ] All endpoints documented in Swagger
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests for CRUD operations passing

---

## Testing Examples

```typescript
describe('ItemsService', () => {
  it('should create an item with audit trail', async () => {
    const dto = {
      name: 'Burger',
      section_id: 1,
      price: 12.99,
    };

    const item = await service.create(dto, userId);

    expect(item.name).toBe('Burger');
    expect(item.base_entity_id).toBeDefined();
  });

  it('should soft delete item', async () => {
    await service.remove(itemId, userId);

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { baseEntity: true },
    });

    expect(item.baseEntity.isdeleted).toBe(true);
  });
});
```

---

## Next Steps

After Phase 2 completion:
1. Verify all CRUD operations working
2. Test image upload
3. Ensure soft delete preserves audit trail
4. Proceed to [Phase 3: Core Sales](./PHASE_3_CORE_SALES.md)

---

**Estimated Duration:** 1-2 weeks
**Critical Files:** items.service.ts, tables.service.ts
