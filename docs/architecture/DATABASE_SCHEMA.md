# Database Schema Documentation

## Overview

The restaurant sales management system uses **15 core models** organized into logical business domains. All tables use a soft-delete pattern with complete audit trails.

**Database:** PostgreSQL
**ORM:** Prisma 5.x
**Schema Location:** `/schema.prisma`

---

## Entity Relationship Diagram

```
┌─────────────┐
│  BaseEntity │ (Audit trail for all entities)
│─────────────│
│ id          │
│ created_at  │
│ created_by ──────┐
│ updated_at  │    │
│ updated_by ──────┤
│ deleted_at  │    │
│ deleted_by ──────┤
│ isdeleted   │    │
└─────────────┘    │
                   │
       ┌───────────▼───────────┐
       │         User          │
       │───────────────────────│
       │ id                    │
       │ fullname              │
       │ username (unique)     │
       │ password (hashed)     │
       │ is_active             │
       │ base_entity_id  ──────┼──► BaseEntity
       └───────────┬───────────┘
                   │
       ┌───────────▼───────────┐
       │       UserRole        │
       │───────────────────────│
       │ id                    │
       │ user_id         ──────┼──► User
       │ role_id         ──────┼──► Role
       └───────────────────────┘

┌─────────────┐
│    Role     │
│─────────────│
│ id          │
│ name        │
└─────────────┘

┌──────────────────────────────────────────────────────────┐
│                    MENU SYSTEM                            │
└──────────────────────────────────────────────────────────┘

┌─────────────┐
│   Section   │ (Menu categories)
│─────────────│
│ id          │
│ name        │
│ base_entity_id ─► BaseEntity
└──────┬──────┘
       │
       │ section_id
       │
┌──────▼──────┐
│    Item     │ (Menu items)
│─────────────│
│ id          │
│ name        │
│ section_id ─┼──► Section
│ price       │
│ image_id ───┼──► Image
│ description │
│ base_entity_id ─► BaseEntity
└─────────────┘

┌─────────────┐
│    Image    │
│─────────────│
│ id          │
│ path        │
└─────────────┘

┌──────────────────────────────────────────────────────────┐
│              SALES & ORDERS (CORE)                        │
└──────────────────────────────────────────────────────────┘

┌─────────────┐
│    Table    │
│─────────────│
│ id          │
│ number (unique)
│ status      │ (AVAILABLE/OCCUPIED/RESERVED)
│ base_entity_id ─► BaseEntity
└──────┬──────┘
       │
       │ table_id (optional)
       │
┌──────▼──────┐
│   Receipt   │ (Orders)
│─────────────│
│ id          │
│ number      │ (auto-increment)
│ is_delivery │
│ phone_number│ (if delivery)
│ location    │ (if delivery)
│ notes       │
│ table_id ───┼──► Table (if dine-in)
│ base_entity_id ─► BaseEntity
└──────┬──────┘
       │
       │ receipt_id
       │
┌──────▼──────────┐
│  ReceiptItem    │ (Line items)
│─────────────────│
│ id              │
│ receipt_id ─────┼──► Receipt
│ item_id    ─────┼──► Item
│ quantity        │
│ status          │ (pending/preparing/ready/done)
│ notes           │
│ base_entity_id ─► BaseEntity
└─────────────────┘

┌──────────────────────────────────────────────────────────┐
│               DELIVERY SYSTEM                             │
└──────────────────────────────────────────────────────────┘

┌──────────────┐
│ DeliveryGuy  │
│──────────────│
│ id           │
│ name         │
│ phone_number │
│ base_entity_id ─► BaseEntity
└──────┬───────┘
       │
       │ dilvery_guy_id (note: typo preserved)
       │
┌──────▼────────────┐
│ DeliveryReceipt   │
│───────────────────│
│ id                │
│ dilvery_guy_id ───┼──► DeliveryGuy
│ is_paid           │
│ receipt_id    ────┼──► Receipt
└───────────────────┘

┌──────────────────────────────────────────────────────────┐
│               DISCOUNT SYSTEM                             │
└──────────────────────────────────────────────────────────┘

┌─────────────┐
│  Discount   │
│─────────────│
│ id          │
│ name        │
│ code (unique)
│ type        │ (amount/percentage/combo)
│ max_receipts│
│ amount      │ (if type=amount)
│ persentage  │ (if type=percentage - typo preserved)
│ start_date  │
│ end_date    │
│ is_active   │
│ base_entity_id ─► BaseEntity
└──────┬──────┘
       │
       ├──────┐
       │      │
┌──────▼─────────┐  ┌────▼────────────┐
│ DiscountItem   │  │DiscountCondition│
│────────────────│  │─────────────────│
│ id             │  │ id              │
│ item_id   ─────┼─►│ discount_id ────┼──► Discount
│ discount_id ───┼─►│ condition_type  │ (min_amount/day_of_week)
│ min_quantity   │  │ value           │
│ base_entity_id │  │ base_entity_id  │
└────────────────┘  └─────────────────┘

       │
       ├──────────────────┐
       │                  │
┌──────▼──────────────┐   │
│  ReceiptDiscount    │   │
│─────────────────────│   │
│ id                  │   │
│ receipt_id ─────────┼──►│ Receipt
│ discount_id    ─────┼──►│ Discount
└─────────────────────┘   │
                          │
┌────────────────────────▼┐
│ ReceiptItemDiscount     │
│─────────────────────────│
│ id                      │
│ receipt_item_id    ─────┼──► ReceiptItem
│ discount_id        ─────┼──► Discount
│ applied_amount          │
└─────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  AUDIT & LOGGING                          │
└──────────────────────────────────────────────────────────┘

┌─────────────┐
│     Log     │
│─────────────│
│ id          │
│ user_id ────┼──► User (optional)
│ event       │
│ occurred_at │
└─────────────┘
```

---

## Enums

### StatusEnum
Order item status workflow
```prisma
enum StatusEnum {
  pending     // Item ordered, waiting for kitchen
  preparing   // Kitchen is preparing
  ready       // Ready to be served
  done        // Served to customer

  @@map("status_t")
}
```

### DiscountTypeEnum
Types of discounts
```prisma
enum DiscountTypeEnum {
  amount      // Fixed dollar amount off
  percentage  // Percentage off
  combo       // Special combo deal

  @@map("type_t")
}
```

### ConditionTypeEnum
Discount application conditions
```prisma
enum ConditionTypeEnum {
  min_amount    // Minimum order amount required
  day_of_week   // Valid only on specific days

  @@map("condition_type_t")
}
```

### TableStatus
Table availability states
```prisma
enum TableStatus {
  AVAILABLE   // Table is free
  OCCUPIED    // Table has active order
  RESERVED    // Table is reserved for future
}
```

---

## Detailed Table Specifications

### BaseEntity (Audit Trail)

**Purpose:** Provides audit trail for all business entities

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| created_at | DateTime | No | When record was created |
| created_by | Int | Yes | User who created (→ User.id) |
| updated_at | DateTime | Yes | Last update timestamp (note: mapped to upadated_at) |
| updated_by | Int | Yes | User who updated (→ User.id) |
| deleted_at | DateTime | Yes | Soft delete timestamp |
| deleted_by | Int | Yes | User who deleted (→ User.id) |
| isdeleted | Boolean | No | Soft delete flag (default: false) |

**Important Note:** `updated_at` is mapped to `upadated_at` in database (typo from original SQL schema - preserved for compatibility)

**Relationships:**
- Circular references with User for audit trail
- Parent entity for all business tables

---

### User

**Purpose:** Staff accounts with authentication credentials

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| fullname | String(255) | No | User's full name |
| username | String(255) | No | Login username |
| password | String(255) | No | Hashed password (bcrypt) |
| is_active | Boolean | No | Account status (default: true) |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Relationships:**
- Has many UserRoles (for role assignments)
- Has many Logs (activity tracking)
- Related to BaseEntity for audit trail

**Business Rules:**
- Username must be unique
- Password must be hashed with bcrypt
- Soft delete preserves audit trail

---

### Role

**Purpose:** Permission levels for access control

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| name | String(255) | No | Role name (Admin, Manager, Waiter, Kitchen, Delivery) |

**Common Roles:**
- **Admin:** Full system access
- **Manager:** Create/edit menu, view reports, manage staff
- **Waiter:** Take orders, update order status
- **Kitchen:** View orders, update cooking status
- **Delivery:** View assigned deliveries

---

### Section (Menu Categories)

**Purpose:** Organize menu items into categories

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| name | String(255) | No | Section name (e.g., "Appetizers", "Mains") |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Examples:**
- Appetizers
- Soups & Salads
- Main Courses
- Desserts
- Beverages

---

### Item (Menu Items)

**Purpose:** Menu items available for sale

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| name | String(255) | No | Item name |
| section_id | Int | No | Category (→ Section.id) |
| price | Decimal | No | Item price |
| image_id | Int | Yes | Photo (→ Image.id) |
| description | Text | Yes | Item description |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Business Rules:**
- Price must be > 0
- Soft delete removes from active menu

---

### Table

**Purpose:** Dining tables for dine-in orders

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| number | Int | No | Table number (unique) |
| status | TableStatus | No | Availability (default: AVAILABLE) |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Status Workflow:**
```
AVAILABLE → RESERVED → OCCUPIED → AVAILABLE
             (optional)
```

---

### Receipt (Orders)

**Purpose:** Customer orders (dine-in or delivery)

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| number | Int | No | Auto-increment order number |
| is_delivery | Boolean | No | Delivery order flag (default: false) |
| phone_number | String(255) | Yes | Customer phone (required if delivery) |
| location | String(255) | Yes | Delivery address (required if delivery) |
| notes | Text | Yes | Special instructions |
| table_id | Int | Yes | Table (→ Table.id) (null if delivery) |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Business Rules:**
- If is_delivery=true, phone_number and location required
- If is_delivery=false, table_id required
- Receipt number auto-increments

**Total Calculation:**
```typescript
subtotal = sum(ReceiptItem.quantity * Item.price)
discount = sum(ReceiptDiscount + ReceiptItemDiscount)
total = subtotal - discount
```

---

### ReceiptItem (Line Items)

**Purpose:** Individual items in an order

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| receipt_id | Int | No | Order (→ Receipt.id) |
| item_id | Int | No | Menu item (→ Item.id) |
| quantity | Decimal | No | Quantity ordered |
| status | StatusEnum | No | Cooking status (default: pending) |
| notes | Text | Yes | Item-specific notes (e.g., "no onions") |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Status Workflow:**
```
pending → preparing → ready → done
```

**Business Rules:**
- Quantity must be > 0
- Status can only move forward in workflow

---

### Discount

**Purpose:** Promotional codes and rules

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | No | Primary key |
| name | String(255) | No | Display name |
| code | String(255) | No | Discount code (unique) |
| type | DiscountTypeEnum | No | Discount type |
| max_receipts | Int | Yes | Usage limit (null = unlimited) |
| amount | Decimal | Yes | Fixed amount (if type=amount) |
| persentage | Decimal | Yes | Percentage (if type=percentage) (note: typo) |
| start_date | DateTime | No | Valid from date |
| end_date | DateTime | No | Valid until date |
| is_active | Boolean | No | Active status (default: true) |
| base_entity_id | Int | No | Audit trail (→ BaseEntity.id) |

**Important Note:** `persentage` field name has typo (should be percentage) - preserved from original SQL schema

**Discount Types:**
1. **amount:** Fixed dollar off (e.g., $5 off)
2. **percentage:** Percentage off (e.g., 20% off)
3. **combo:** Requires specific items

**Business Rules:**
- Code must be unique
- Only one of amount/persentage should be set (based on type)
- start_date must be before end_date
- Check max_receipts usage limit before applying

---

## Important Schema Notes

### Preserved Typos
These typos exist in the original SQL database and are preserved for compatibility:

1. **BaseEntity.updated_at** → mapped to `upadated_at`
2. **DeliveryReceipt.dilvery_guy_id** → mapped to `dilvery_guy_id`
3. **Discount.persentage** → mapped to `persentage`

**Do NOT fix these in migrations** - they maintain compatibility with existing database.

### Soft Delete Pattern
All business entities use soft delete:
- Set `isdeleted = true`
- Set `deleted_at = current timestamp`
- Set `deleted_by = user ID`
- Never hard delete sales data (audit compliance)

### Audit Trail
Every business operation tracks:
- **Who:** created_by, updated_by, deleted_by
- **When:** created_at, updated_at, deleted_at
- **What:** Full history via BaseEntity

---

## Database Indexes (Recommended)

### High-Priority Indexes
```sql
-- Receipts by date (for reports)
CREATE INDEX idx_receipts_created_at ON receipt(created_at);

-- Items by section (for menu queries)
CREATE INDEX idx_items_section ON item(section_id);

-- Receipt items by receipt (for order details)
CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);

-- Discount by code (for validation)
CREATE INDEX idx_discount_code ON discounts(code);

-- Table by status (for availability)
CREATE INDEX idx_table_status ON tables(status);
```

### Additional Indexes
```sql
-- User authentication
CREATE INDEX idx_user_username ON users(username);

-- Soft delete filtering
CREATE INDEX idx_base_entity_deleted ON base_entity(isdeleted);
```

---

## Schema Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 20251228141952_init | 2025-12-28 | Initial schema with 15 models |

**Migration Location:** `prisma/migrations/`

---

## Querying Best Practices

### Always Exclude Soft-Deleted
```typescript
// Include filter in all queries
const items = await prisma.item.findMany({
  where: {
    baseEntity: { isdeleted: false }
  }
});
```

### Use Transactions for Multi-Table Operations
```typescript
await prisma.$transaction(async (tx) => {
  const baseEntity = await tx.baseEntity.create({...});
  const receipt = await tx.receipt.create({...});
  await tx.receiptItem.createMany({...});
});
```

### Optimize with Select
```typescript
// Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    fullname: true,
    username: true,
    // Exclude password
  }
});
```

---

**Last Updated:** 2025-12-28
**Schema Version:** 1.0.0
**Database:** PostgreSQL with Prisma ORM
