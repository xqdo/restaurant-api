# API Design Guidelines

## REST API Conventions

This document outlines the API design patterns and conventions used throughout the restaurant sales management system.

---

## Base URL

```
Development: http://localhost:3000
Production: https://api.restaurant.com
```

---

## Authentication

### JWT Bearer Token
All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Getting a Token
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullname": "Admin User",
    "username": "admin",
    "roles": ["Admin"]
  }
}
```

---

## HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve resources | `GET /menu/items` |
| POST | Create new resource | `POST /receipts` |
| PUT | Update entire resource | `PUT /tables/1` |
| PATCH | Partial update | `PATCH /tables/1/status` |
| DELETE | Soft delete resource | `DELETE /menu/items/1` |

---

## Response Format

### Success Response
```json
{
  "id": 1,
  "name": "Burger",
  "price": 12.99,
  "created_at": "2025-12-28T10:00:00Z"
}
```

### List Response (with Pagination)
```json
{
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "perPage": 10,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-28T10:00:00Z",
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "price must be a positive number"
    }
  ]
}
```

---

## HTTP Status Codes

### Success Codes
- **200 OK** - Successful GET, PUT, PATCH
- **201 Created** - Successful POST
- **204 No Content** - Successful DELETE

### Client Error Codes
- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Duplicate entry (e.g., unique constraint violation)
- **422 Unprocessable Entity** - Business logic validation failed

### Server Error Codes
- **500 Internal Server Error** - Unexpected server error

---

## Endpoint Naming Conventions

### Resources (Plural Nouns)
```
✅ Good:
/menu/items
/receipts
/tables
/delivery/drivers

❌ Bad:
/item
/getReceipts
/table-list
```

### Actions (HTTP Methods, Not Verbs in URL)
```
✅ Good:
POST /receipts            # Create receipt
GET /receipts/1           # Get receipt
PUT /receipts/1/complete  # Complete receipt

❌ Bad:
POST /createReceipt
GET /getReceipt/1
POST /completeReceipt/1
```

### Nested Resources
```
✅ Good:
GET /receipts/1/items         # Get items of receipt 1
POST /receipts/1/items        # Add item to receipt 1
PUT /receipts/1/items/5       # Update item 5 of receipt 1

❌ Bad:
GET /receipt-items?receipt_id=1
```

---

## Query Parameters

### Filtering
```http
GET /menu/items?section_id=2&price_min=5&price_max=20
```

### Searching
```http
GET /menu/items?search=burger
```

### Sorting
```http
GET /menu/items?sort=price&order=asc
GET /menu/items?sort=-price  # Descending (- prefix)
```

### Pagination
```http
GET /receipts?page=2&perPage=20
```

### Field Selection
```http
GET /users?fields=id,fullname,username
```

---

## Request/Response Examples

### 1. Menu Items

#### Create Item
```http
POST /menu/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Classic Burger",
  "section_id": 2,
  "price": 12.99,
  "description": "Beef patty with lettuce, tomato, and special sauce",
  "image_id": null
}

Response: 201 Created
{
  "id": 15,
  "name": "Classic Burger",
  "section_id": 2,
  "price": 12.99,
  "description": "Beef patty with lettuce, tomato, and special sauce",
  "image_id": null,
  "base_entity_id": 45,
  "section": {
    "id": 2,
    "name": "Main Courses"
  }
}
```

#### List Items with Filters
```http
GET /menu/items?section_id=2&search=burger&sort=price

Response: 200 OK
{
  "data": [
    {
      "id": 15,
      "name": "Classic Burger",
      "price": 12.99,
      "section": { "name": "Main Courses" }
    },
    {
      "id": 16,
      "name": "Cheese Burger",
      "price": 14.99,
      "section": { "name": "Main Courses" }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 10
  }
}
```

### 2. Receipts (Orders)

#### Create Receipt
```http
POST /receipts
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_delivery": false,
  "table_id": 5,
  "notes": "Customer allergic to peanuts",
  "items": [
    {
      "item_id": 15,
      "quantity": 2,
      "notes": "No onions"
    },
    {
      "item_id": 20,
      "quantity": 1,
      "notes": null
    }
  ]
}

Response: 201 Created
{
  "id": 105,
  "number": 105,
  "is_delivery": false,
  "table_id": 5,
  "notes": "Customer allergic to peanuts",
  "created_at": "2025-12-28T14:30:00Z",
  "items": [
    {
      "id": 250,
      "item_id": 15,
      "quantity": 2,
      "status": "pending",
      "notes": "No onions",
      "item": {
        "name": "Classic Burger",
        "price": 12.99
      }
    },
    {
      "id": 251,
      "item_id": 20,
      "quantity": 1,
      "status": "pending",
      "notes": null,
      "item": {
        "name": "Fries",
        "price": 4.99
      }
    }
  ],
  "subtotal": 30.97,
  "discount": 0,
  "total": 30.97
}
```

#### Get Receipt Summary
```http
GET /receipts/105

Response: 200 OK
{
  "id": 105,
  "number": 105,
  "table": {
    "number": 5,
    "status": "OCCUPIED"
  },
  "items": [...],
  "discounts": [],
  "subtotal": 30.97,
  "total_discount": 0,
  "total": 30.97,
  "created_at": "2025-12-28T14:30:00Z",
  "created_by": {
    "fullname": "John Waiter"
  }
}
```

### 3. Discounts

#### Apply Discount
```http
POST /receipts/105/discounts/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "discount_code": "SUMMER20"
}

Response: 200 OK
{
  "message": "Discount applied successfully",
  "discount": {
    "code": "SUMMER20",
    "type": "percentage",
    "value": 20
  },
  "previous_total": 30.97,
  "discount_amount": 6.19,
  "new_total": 24.78
}
```

---

## Error Handling

### Validation Errors
```http
POST /menu/items
{
  "name": "",
  "price": -5
}

Response: 400 Bad Request
{
  "statusCode": 400,
  "timestamp": "2025-12-28T10:00:00Z",
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "name should not be empty"
    },
    {
      "field": "price",
      "message": "price must be a positive number"
    }
  ]
}
```

### Business Logic Errors
```http
POST /receipts/105/discounts/apply
{
  "discount_code": "EXPIRED"
}

Response: 422 Unprocessable Entity
{
  "statusCode": 422,
  "timestamp": "2025-12-28T10:00:00Z",
  "message": "Discount code has expired"
}
```

### Not Found
```http
GET /menu/items/9999

Response: 404 Not Found
{
  "statusCode": 404,
  "timestamp": "2025-12-28T10:00:00Z",
  "message": "Item not found"
}
```

### Unauthorized
```http
GET /admin/users
# No Authorization header

Response: 401 Unauthorized
{
  "statusCode": 401,
  "timestamp": "2025-12-28T10:00:00Z",
  "message": "Unauthorized"
}
```

### Forbidden
```http
POST /menu/items
Authorization: Bearer <waiter-token>

Response: 403 Forbidden
{
  "statusCode": 403,
  "timestamp": "2025-12-28T10:00:00Z",
  "message": "Forbidden resource"
}
```

---

## Versioning

### URL Versioning (Future)
```
/v1/menu/items
/v2/menu/items
```

### Header Versioning (Alternative)
```http
API-Version: 1
```

**Current:** No versioning (v1 implicit)

---

## Rate Limiting

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Future Feature:** Not implemented in initial phases

---

## CORS Configuration

### Allowed Origins (Development)
```
http://localhost:3000
http://localhost:4200
```

### Allowed Origins (Production)
```
https://restaurant.com
https://admin.restaurant.com
```

### Allowed Methods
```
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## Swagger/OpenAPI Documentation

### Decorators for Endpoints
```typescript
@ApiTags('menu')
@Controller('menu/items')
export class ItemsController {

  @ApiOperation({ summary: 'Get all menu items' })
  @ApiQuery({ name: 'section_id', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of items' })
  @Get()
  findAll(@Query() query: FilterItemsDto) {
    return this.itemsService.findAll(query);
  }

  @ApiOperation({ summary: 'Create new menu item' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Item created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Manager', 'Admin')
  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }
}
```

### DTO Swagger Decorators
```typescript
export class CreateItemDto {
  @ApiProperty({ example: 'Classic Burger' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2, description: 'Section ID' })
  @IsNumber()
  @IsPositive()
  section_id: number;

  @ApiProperty({ example: 12.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'Delicious burger' })
  @IsString()
  @IsOptional()
  description?: string;
}
```

---

## Best Practices

### 1. Use Consistent Naming
- **Resources:** Plural nouns (`/items`, `/receipts`)
- **Fields:** snake_case in database, camelCase in API responses
- **Enums:** UPPER_CASE

### 2. Always Validate Input
```typescript
// Use class-validator decorators
@IsString()
@MinLength(3)
@MaxLength(50)
name: string;
```

### 3. Return Appropriate Status Codes
```typescript
// Create = 201
@Post()
@HttpCode(201)
create(@Body() dto: CreateDto) {}

// Update = 200
@Put(':id')
update(@Param('id') id: number, @Body() dto: UpdateDto) {}

// Delete = 204
@Delete(':id')
@HttpCode(204)
remove(@Param('id') id: number) {}
```

### 4. Include Metadata in Lists
```typescript
return {
  data: items,
  meta: {
    total: count,
    page: query.page || 1,
    perPage: query.perPage || 10,
    totalPages: Math.ceil(count / (query.perPage || 10))
  }
};
```

### 5. Use DTOs for All Inputs
```typescript
// ✅ Good
@Post()
create(@Body() dto: CreateItemDto) {}

// ❌ Bad
@Post()
create(@Body() data: any) {}
```

### 6. Document All Endpoints
```typescript
// Add Swagger decorators
@ApiOperation({ summary: 'Description' })
@ApiResponse({ status: 200, description: 'Success' })
```

---

## API Endpoint Index

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register user (Admin only)
- `GET /auth/me` - Get current user

### Menu
- `GET /menu/sections` - List sections
- `POST /menu/sections` - Create section
- `GET /menu/items` - List items
- `POST /menu/items` - Create item
- `PUT /menu/items/:id` - Update item
- `DELETE /menu/items/:id` - Delete item
- `POST /menu/items/:id/image` - Upload image

### Tables
- `GET /tables` - List tables
- `GET /tables/available` - Available tables
- `PUT /tables/:id/status` - Update status

### Receipts (Orders)
- `POST /receipts` - Create order
- `GET /receipts` - List orders
- `GET /receipts/:id` - Get order
- `POST /receipts/:id/items` - Add item
- `PUT /receipts/:id/items/:itemId/status` - Update item status
- `PUT /receipts/:id/complete` - Complete order

### Discounts
- `POST /discounts` - Create discount
- `GET /discounts/:code` - Validate code
- `POST /receipts/:id/discounts/apply` - Apply discount

### Delivery
- `POST /delivery/drivers` - Register driver
- `POST /delivery/assign` - Assign order
- `GET /delivery/pending` - Pending deliveries

### Reports
- `GET /reports/sales/daily` - Daily sales
- `GET /reports/items/top-selling` - Top items

---

**Last Updated:** 2025-12-28
**Version:** 1.0.0
**API Version:** v1 (implicit)
