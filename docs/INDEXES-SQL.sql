-- Batch Orders specific indexes.
-- Apply manually in MySQL (idempotent guard recommended in deployment tooling).

-- Speeds up status/date filtering for /batch-orders list.
CREATE INDEX idx_batch_orders_status ON batch_orders (status);
CREATE INDEX idx_batch_orders_expected_delivery_date ON batch_orders (expectedDeliveryDate);

-- Supports filtering by creator or supplier for reporting.
CREATE INDEX idx_batch_orders_created_by ON batch_orders (createdByUserId);
CREATE INDEX idx_batch_orders_supplier ON batch_orders (supplierId);

-- Accelerates loading items for a batch order detail page.
CREATE INDEX idx_batch_order_items_order_id ON batch_order_items (batchOrderId);

