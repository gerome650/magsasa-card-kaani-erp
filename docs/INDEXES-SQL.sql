-- Database Indexes for Admin CSV Upload Feature
-- Run these SQL commands before deploying to production

-- Verify existing indexes first
SHOW INDEXES FROM users;
SHOW INDEXES FROM farms;
SHOW INDEXES FROM yields;

-- ============================================
-- REQUIRED INDEXES
-- ============================================

-- 1. Composite index for farms lookup in seasons CSV
-- This is CRITICAL for performance when looking up farms by name + farmerName
-- Used in: uploadSeasonsCsv when farmName + farmerName are provided
-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so check first or ignore error if exists
CREATE INDEX idx_farms_name_farmerName ON farms(name, farmerName);

-- 2. Index for yields foreign key
-- This should already exist (foreign keys are usually indexed), but verify
-- Used in: All queries filtering yields by farmId
-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so check first or ignore error if exists
CREATE INDEX idx_yields_farmId ON yields(farmId);

-- ============================================
-- VERIFICATION
-- ============================================

-- After creating indexes, verify they exist:
SHOW INDEXES FROM farms WHERE Key_name = 'idx_farms_name_farmerName';
SHOW INDEXES FROM yields WHERE Key_name = 'idx_yields_farmId';

-- ============================================
-- NOTES
-- ============================================

-- users.openId already has a unique index: users_openId_unique
-- This is used for farmer lookups in uploadFarmsCsv
-- No additional index needed for users table

-- farms.userId is a foreign key and should be indexed automatically
-- If not, consider adding: CREATE INDEX idx_farms_userId ON farms(userId);

-- ============================================
-- PERFORMANCE TESTING
-- ============================================

-- After creating indexes, test lookup performance:
-- EXPLAIN SELECT * FROM farms WHERE name = 'Test Farm' AND farmerName = 'Test Farmer';
-- Should show "Using index" in the Extra column

-- ============================================
-- Batch Orders specific indexes.
-- Apply manually in MySQL (idempotent guard recommended in deployment tooling).
-- ============================================

-- Speeds up status/date filtering for /batch-orders list.
CREATE INDEX idx_batch_orders_status ON batch_orders (status);
CREATE INDEX idx_batch_orders_expected_delivery_date ON batch_orders (expectedDeliveryDate);

-- Supports filtering by creator or supplier for reporting.
CREATE INDEX idx_batch_orders_created_by ON batch_orders (createdByUserId);
CREATE INDEX idx_batch_orders_supplier ON batch_orders (supplierId);

-- Accelerates loading items for a batch order detail page.
CREATE INDEX idx_batch_order_items_order_id ON batch_order_items (batchOrderId);
