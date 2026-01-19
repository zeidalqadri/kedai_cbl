-- ============================================================================
-- CBL POPSHOP - DATABASE SCHEMA MIGRATION
-- Run these commands to update an existing popshop_orders table
-- ============================================================================

-- Check if we need to migrate from old schema (id as order_id) to new schema
-- If your table already has order_id column, skip to step 2

-- ============================================================================
-- STEP 1: Migrate from old schema (if id was the order ID)
-- ============================================================================

-- Option A: If table is EMPTY, just drop and recreate
-- DROP TABLE IF EXISTS popshop_orders CASCADE;
-- Then run the full database-schema.sql

-- Option B: If table has data, run these migrations:

-- 1a. Add new columns if they don't exist
ALTER TABLE popshop_orders
ADD COLUMN IF NOT EXISTS order_id VARCHAR(20);

ALTER TABLE popshop_orders
ADD COLUMN IF NOT EXISTS courier VARCHAR(50);

-- 1b. Rename admin_note to admin_notes if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'popshop_orders' AND column_name = 'admin_note') THEN
        ALTER TABLE popshop_orders RENAME COLUMN admin_note TO admin_notes;
    END IF;
END $$;

-- 1c. If order_id is empty, copy from id (if id was the PS order ID)
UPDATE popshop_orders SET order_id = id WHERE order_id IS NULL;

-- 1d. Make order_id NOT NULL and UNIQUE (only after data is migrated)
-- ALTER TABLE popshop_orders ALTER COLUMN order_id SET NOT NULL;
-- ALTER TABLE popshop_orders ADD CONSTRAINT popshop_orders_order_id_unique UNIQUE (order_id);

-- ============================================================================
-- STEP 2: Update status constraint for new statuses
-- ============================================================================

-- Drop old constraint
ALTER TABLE popshop_orders DROP CONSTRAINT IF EXISTS chk_status;

-- Add new constraint with all statuses
ALTER TABLE popshop_orders
ADD CONSTRAINT chk_status
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- ============================================================================
-- STEP 3: Create audit log table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS popshop_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popshop_audit_entity ON popshop_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_popshop_audit_created ON popshop_audit_log(created_at DESC);

-- ============================================================================
-- STEP 4: Verify schema
-- ============================================================================

-- Run this to check your table structure:
-- \d popshop_orders

-- Expected columns:
-- id, order_id, idempotency_key, items, subtotal, shipping_fee, total,
-- customer_name, customer_phone, customer_email, shipping_address,
-- payment_ref, has_proof_image, status, tracking_number, courier, admin_notes,
-- created_at, updated_at
