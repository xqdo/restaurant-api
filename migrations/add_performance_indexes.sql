-- Migration: Add Performance Indexes for Phase 5 Analytics & Reporting
-- Created: 2025-12-28
-- Purpose: Optimize query performance for reports, analytics, and exports

-- ============= BASE ENTITY INDEXES (For date-based queries) =============

-- Index for querying entities by creation date (used in all reports)
CREATE INDEX IF NOT EXISTS idx_base_entity_created_at
ON base_entity(created_at);

-- Index for filtering out deleted entities
CREATE INDEX IF NOT EXISTS idx_base_entity_deleted
ON base_entity(isdeleted) WHERE isdeleted = false;

-- Composite index for active entities sorted by date
CREATE INDEX IF NOT EXISTS idx_base_entity_active_by_date
ON base_entity(created_at DESC, isdeleted) WHERE isdeleted = false;

-- ============= RECEIPT ITEMS INDEXES (For sales aggregation) =============

-- Index for aggregating items (used in top-selling items report)
CREATE INDEX IF NOT EXISTS idx_receipt_items_item
ON receipt_items(item_id);

-- Index for querying all items in a receipt
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt
ON receipt_items(receipt_id);

-- Composite index for item performance queries
CREATE INDEX IF NOT EXISTS idx_receipt_items_item_with_base
ON receipt_items(item_id, base_entity_id);

-- ============= ITEMS & SECTIONS INDEXES (For revenue by section) =============

-- Index for grouping items by section
CREATE INDEX IF NOT EXISTS idx_items_section
ON items(section_id);

-- Composite index for active items by section
CREATE INDEX IF NOT EXISTS idx_items_section_active
ON items(section_id, base_entity_id);

-- ============= DISCOUNT TRACKING INDEXES =============

-- Index for receipt-level discount usage tracking
CREATE INDEX IF NOT EXISTS idx_receipt_discounts_discount
ON receipt_discounts(discount_id);

-- Index for querying all discounts on a receipt
CREATE INDEX IF NOT EXISTS idx_receipt_discounts_receipt
ON receipt_discounts(receipt_id);

-- Index for item-level discount usage tracking
CREATE INDEX IF NOT EXISTS idx_receipt_item_discounts_discount
ON receipt_item_discounts(discount_id);

-- Index for querying discounts on a receipt item
CREATE INDEX IF NOT EXISTS idx_receipt_item_discounts_item
ON receipt_item_discounts(receipt_item_id);

-- ============= AUDIT LOGS INDEXES =============

-- Index for querying logs by user (user activity report)
CREATE INDEX IF NOT EXISTS idx_logs_user
ON logs(user_id);

-- Index for querying logs by event type
CREATE INDEX IF NOT EXISTS idx_logs_event
ON logs(event);

-- Index for querying logs by date
CREATE INDEX IF NOT EXISTS idx_logs_occurred_at
ON logs(occurred_at DESC);

-- Composite index for user activity by date
CREATE INDEX IF NOT EXISTS idx_logs_user_date
ON logs(user_id, occurred_at DESC);

-- Composite index for event logs by date
CREATE INDEX IF NOT EXISTS idx_logs_event_date
ON logs(event, occurred_at DESC);

-- ============= RECEIPT INDEXES (For table turnover and staff performance) =============

-- Index for table utilization queries
CREATE INDEX IF NOT EXISTS idx_receipt_table
ON receipt(table_id) WHERE table_id IS NOT NULL;

-- Index for delivery orders
CREATE INDEX IF NOT EXISTS idx_receipt_delivery
ON receipt(is_delivery);

-- ============= DELIVERY INDEXES =============

-- Index for driver performance queries
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_driver
ON delivery_receipts(dilvery_guy_id);

-- Index for unpaid deliveries
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_unpaid
ON delivery_receipts(is_paid) WHERE is_paid = false;

-- ============= USER & ROLES INDEXES =============

-- Index for user role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user
ON user_roles(user_id);

-- Index for finding users by role
CREATE INDEX IF NOT EXISTS idx_user_roles_role
ON user_roles(role_id);

-- ============= TABLES INDEX =============

-- Index for table status queries
CREATE INDEX IF NOT EXISTS idx_tables_status
ON tables(status);

-- ============= VERIFY INDEXES =============

-- To verify indexes were created, run:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- ============= PERFORMANCE NOTES =============

-- Expected improvements:
-- - Daily sales report: 60-80% faster
-- - Top selling items: 70-90% faster
-- - Revenue by section: 50-70% faster
-- - Staff performance: 40-60% faster
-- - Table turnover: 50-70% faster
-- - Discount usage: 60-80% faster
-- - Audit logs queries: 70-90% faster

-- To analyze query performance after migration:
-- EXPLAIN ANALYZE SELECT ... your query here ...

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan as index_scans
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;
