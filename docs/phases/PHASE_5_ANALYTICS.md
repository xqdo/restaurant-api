# Phase 5: Analytics & Reporting

**Duration:** Weeks 11-13
**Goal:** Business intelligence for data-driven decisions
**Dependencies:** All previous phases (needs complete sales data)

---

## Overview

Phase 5 provides insights into business performance through reports, analytics, and data export capabilities.

### Key Modules
1. **Reports Module** - Sales and performance analytics
2. **Audit Module** - Activity logging and compliance
3. **Exports Module** - Data export (CSV/Excel)

---

## Module 5.1: Sales Reports

### Report Types

#### Daily Sales Report
```typescript
GET /reports/sales/daily?date=2025-12-28

Response:
{
  "date": "2025-12-28",
  "total_receipts": 45,
  "total_revenue": 2450.75,
  "average_order_value": 54.46,
  "dine_in_orders": 30,
  "delivery_orders": 15
}
```

#### Top Selling Items
```typescript
GET /reports/items/top-selling?period=7days

Response:
{
  "period": "last_7_days",
  "items": [
    {
      "item_id": 15,
      "name": "Classic Burger",
      "quantity_sold": 120,
      "revenue": 1558.80
    }
  ]
}
```

#### Discount Effectiveness
```typescript
GET /reports/discounts/usage

Response:
{
  "discounts": [
    {
      "code": "SUMMER20",
      "times_used": 35,
      "total_discount_amount": 420.50,
      "average_order_increase": 15.2
    }
  ]
}
```

### Key Endpoints
```
GET /reports/sales/daily
GET /reports/sales/period?start=2025-01-01&end=2025-01-31
GET /reports/items/top-selling
GET /reports/items/slow-moving
GET /reports/revenue/by-section
GET /reports/staff/performance
GET /reports/tables/turnover
```

---

## Module 5.2: Audit Logs

### Logged Events
- User login/logout
- Receipt creation/modification
- Price changes
- Discount applications
- Payment completions
- Role changes

### Endpoints
```
GET /audit/logs                    # All logs (Admin only)
GET /audit/logs/user/:id           # User activity
GET /audit/logs/receipt/:id        # Receipt changes
GET /audit/logs/events/:event      # Filter by event type
```

---

## Module 5.3: Data Export

### Dependencies
```bash
npm install exceljs csv-writer
```

### Endpoints
```
GET /exports/sales/csv?start=2025-01-01&end=2025-01-31
GET /exports/receipts/excel?month=12&year=2025
POST /exports/custom                # Custom report builder
```

---

## Performance Optimization

### Database Indexes
```sql
CREATE INDEX idx_receipts_created_at ON receipt(created_at);
CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX idx_items_section ON items(section_id);
```

### Caching Strategy
```typescript
// Cache daily reports for 1 hour
@CacheKey('daily-sales')
@CacheTTL(3600)
async getDailySales(date: string) {
  // ... query
}
```

### Pagination
```typescript
// Always paginate list endpoints
const receipts = await prisma.receipt.findMany({
  skip: (page - 1) * perPage,
  take: perPage,
});
```

---

## Success Criteria

### Phase 5 Complete When:
- [ ] Daily sales report shows accurate totals
- [ ] Top selling items query performs fast (<1s)
- [ ] Period reports handle large date ranges
- [ ] Staff performance metrics accurate
- [ ] Discount ROI calculations correct
- [ ] CSV export generates valid files
- [ ] Excel export working with formatting
- [ ] Audit logs capture all changes
- [ ] Report queries optimized with indexes
- [ ] Pagination working on all lists

---

## Next Steps

After Phase 5: System is complete! Focus on:
1. Performance tuning
2. Security hardening  
3. Deployment preparation
4. User training documentation

---

**Estimated Duration:** 2-3 weeks
**Final Milestone:** Complete restaurant sales management system
