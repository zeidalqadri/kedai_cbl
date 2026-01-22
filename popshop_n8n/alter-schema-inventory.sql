-- ============================================================================
-- CBL Popshop Schema Migration: Inventory & Cost Tracking
-- Run this migration in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Add cost tracking to products
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;

-- Update existing products with cost prices
UPDATE products SET cost_price = 35 WHERE id = 'cbl-jingga-tee';
UPDATE products SET cost_price = 65 WHERE id = 'cbl-basketball';

-- ============================================================================
-- 2. Create product_inventory table (per size stock tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_inventory (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_id VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_product_size UNIQUE (product_id, size_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_low_stock ON product_inventory(quantity) WHERE quantity <= 5;

-- ============================================================================
-- 3. Add cost columns to orders for P&L tracking
-- ============================================================================

ALTER TABLE popshop_orders
ADD COLUMN IF NOT EXISTS items_cost DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit DECIMAL(10, 2) DEFAULT 0;

-- ============================================================================
-- 4. Create inventory_transactions audit log
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(50) NOT NULL,
    size_id VARCHAR(20) NOT NULL,
    quantity_change INTEGER NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    reference_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id, size_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at);

-- ============================================================================
-- 5. Seed initial inventory data
-- ============================================================================

-- CBL Jingga T-Shirt sizes (S, M, L, XL)
INSERT INTO product_inventory (product_id, size_id, quantity, low_stock_threshold) VALUES
    ('cbl-jingga-tee', 'S', 50, 5),
    ('cbl-jingga-tee', 'M', 50, 5),
    ('cbl-jingga-tee', 'L', 50, 5),
    ('cbl-jingga-tee', 'XL', 50, 5)
ON CONFLICT (product_id, size_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    low_stock_threshold = EXCLUDED.low_stock_threshold;

-- CBL Basketball (Size 7)
INSERT INTO product_inventory (product_id, size_id, quantity, low_stock_threshold) VALUES
    ('cbl-basketball', '7', 30, 5)
ON CONFLICT (product_id, size_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    low_stock_threshold = EXCLUDED.low_stock_threshold;

-- ============================================================================
-- 6. Create trigger to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_updated_at ON product_inventory;
CREATE TRIGGER inventory_updated_at
    BEFORE UPDATE ON product_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

-- ============================================================================
-- 7. Helper view for inventory status (optional)
-- ============================================================================

CREATE OR REPLACE VIEW inventory_status AS
SELECT
    p.id as product_id,
    p.name as product_name,
    p.base_price,
    p.cost_price,
    pi.size_id,
    pi.quantity,
    pi.reserved_quantity,
    pi.quantity - pi.reserved_quantity as available_quantity,
    pi.low_stock_threshold,
    CASE
        WHEN pi.quantity <= 0 THEN 'out_of_stock'
        WHEN pi.quantity <= pi.low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products p
LEFT JOIN product_inventory pi ON p.id = pi.product_id
WHERE p.is_active = true
ORDER BY p.name, pi.size_id;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON inventory_status TO anon;
-- GRANT ALL ON product_inventory TO authenticated;
-- GRANT ALL ON inventory_transactions TO authenticated;
