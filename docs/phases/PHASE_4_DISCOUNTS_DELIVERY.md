# Phase 4: Discounts & Delivery

**Duration:** Weeks 8-10
**Goal:** Advanced features to maximize sales and expand reach
**Dependencies:** Phase 3 (Receipts must exist to apply discounts)

---

## Overview

Phase 4 adds revenue-optimization features: a powerful discount engine and delivery management system.

### Key Modules
1. **Discounts Module** - Promotional codes with conditions
2. **Delivery Module** - Driver management and order assignment

---

## Module 4.1: Discount System

### Discount Types
1. **Amount** - Fixed dollar off (e.g., "$5 off")
2. **Percentage** - Percentage off (e.g., "20% off")  
3. **Combo** - Specific items required (e.g., "Buy burger + fries, 30% off")

### Conditions
- **min_amount** - Minimum order value
- **day_of_week** - Valid only on specific days (0=Sunday, 6=Saturday)

### Key Endpoints
```
POST   /discounts                  # Create discount (Manager)
GET    /discounts/:code            # Validate code
POST   /receipts/:id/discounts/apply  # Apply to order
GET    /discounts/:id/usage        # Track usage
```

### Discount Engine Logic
```typescript
async applyDiscount(receiptId: number, code: string, userId: number) {
  // 1. Validate discount exists and is active
  const discount = await this.validateDiscount(code);
  
  // 2. Check date range
  if (now < discount.start_date || now > discount.end_date) {
    throw new BadRequestException('Discount expired or not yet valid');
  }
  
  // 3. Check conditions (min_amount, day_of_week)
  await this.validateConditions(discount, receiptId);
  
  // 4. Check usage limit
  if (discount.max_receipts) {
    const usage = await this.getUsageCount(discount.id);
    if (usage >= discount.max_receipts) {
      throw new BadRequestException('Discount usage limit reached');
    }
  }
  
  // 5. Calculate discount amount
  const amount = await this.calculateDiscount(discount, receiptId);
  
  // 6. Apply discount
  await this.applyToReceipt(discount, receiptId, amount, userId);
  
  return { applied: true, amount };
}
```

---

## Module 4.2: Delivery Management

### Business Features
- Register delivery drivers
- Assign orders to drivers
- Track delivery status
- Payment settlement for drivers

### Key Endpoints
```
POST   /delivery/drivers           # Register driver (Manager)
GET    /delivery/drivers           # List drivers
POST   /delivery/assign            # Assign order to driver
GET    /delivery/pending           # Unassigned deliveries
GET    /delivery/active            # Out for delivery
PUT    /delivery/:id/mark-paid     # Mark driver paid
```

### Delivery Flow
```
1. Customer places delivery order (is_delivery=true)
2. Kitchen prepares items (same workflow as dine-in)
3. Manager assigns to available driver (DeliveryReceipt created)
4. Driver delivers order
5. Later: Settlement - mark is_paid=true
```

---

## Success Criteria

### Phase 4 Complete When:
- [ ] Amount discount applies correctly
- [ ] Percentage discount applies correctly
- [ ] Combo discount validates required items
- [ ] Discount conditions validated (min_amount, day_of_week)
- [ ] Usage limit tracking works
- [ ] Cannot use expired/inactive discounts
- [ ] Delivery driver registration works
- [ ] Order assignment to driver works
- [ ] Driver payment tracking accurate
- [ ] Delivery orders flow through kitchen correctly

---

## Next Steps

After Phase 4: Proceed to [Phase 5: Analytics](./PHASE_5_ANALYTICS.md)

---

**Estimated Duration:** 2-3 weeks
**Critical Files:** discount-engine.service.ts, delivery-receipts.service.ts
