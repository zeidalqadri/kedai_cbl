-- ============================================================================
-- CBL POPSHOP - DATABASE SCHEMA
-- Version: 1.0.0
-- PostgreSQL / Supabase
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PRODUCTS TABLE
-- Product catalog (can be managed via admin in future)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    sizes JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_category CHECK (category IN ('apparel', 'equipment')),
    CONSTRAINT chk_price_positive CHECK (base_price > 0)
);

-- Index for active products
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert initial products
INSERT INTO products (id, name, description, base_price, category, images, sizes) VALUES
    ('cbl-jingga-tshirt', 'CBL Jingga T-Shirt', 'Official CBL jersey in vibrant Jingga (orange)', 89.00, 'apparel',
     ARRAY['/products/tshirt/CBL_jingga_HR.png', '/products/tshirt/CBL_jingga_back_HR.png', '/products/tshirt/CBL_jingga_left_HR.png', '/products/tshirt/CBL_jingga_right_HR.png'],
     '[{"id": "S", "label": "S", "available": true, "price_modifier": 0}, {"id": "M", "label": "M", "available": true, "price_modifier": 0}, {"id": "L", "label": "L", "available": true, "price_modifier": 0}, {"id": "XL", "label": "XL", "available": true, "price_modifier": 0}, {"id": "2XL", "label": "2XL", "available": true, "price_modifier": 0}]'::JSONB
    ),
    ('cbl-basketball', 'CBL Basketball', 'Official CBL game ball', 129.00, 'equipment',
     ARRAY['/products/basketball/placeholder.png'],
     '[{"id": "5", "label": "Size 5 (Youth)", "available": true, "price_modifier": 0}, {"id": "6", "label": "Size 6 (Women)", "available": true, "price_modifier": 10}, {"id": "7", "label": "Size 7 (Men)", "available": true, "price_modifier": 20}]'::JSONB
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORDERS TABLE
-- Main order records
-- ============================================================================
CREATE TABLE IF NOT EXISTS popshop_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) UNIQUE NOT NULL,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,

    -- Order items (stored as JSON)
    items JSONB NOT NULL,

    -- Totals
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    -- Customer details
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    shipping_address JSONB NOT NULL,

    -- Payment details
    payment_ref VARCHAR(100),
    has_proof_image BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status and tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    tracking_number VARCHAR(50),
    courier VARCHAR(50),
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    CONSTRAINT chk_total_positive CHECK (total > 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_popshop_orders_status ON popshop_orders(status);
CREATE INDEX IF NOT EXISTS idx_popshop_orders_created_at ON popshop_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popshop_orders_customer_email ON popshop_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_popshop_orders_idempotency ON popshop_orders(idempotency_key);

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_popshop_orders_status_created ON popshop_orders(status, created_at DESC);

-- ============================================================================
-- AUDIT LOG TABLE
-- Tracks all state changes for compliance and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS popshop_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_popshop_audit_entity ON popshop_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_popshop_audit_created ON popshop_audit_log(created_at DESC);

-- ============================================================================
-- ERROR LOG TABLE
-- Stores workflow errors for debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS popshop_error_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_id VARCHAR(50) NOT NULL UNIQUE,
    workflow_id VARCHAR(100),
    workflow_name VARCHAR(200),
    execution_id VARCHAR(100),
    error_message TEXT NOT NULL,
    error_node VARCHAR(100),
    error_stack TEXT,
    context JSONB,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for error queries
CREATE INDEX IF NOT EXISTS idx_popshop_error_log_created ON popshop_error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popshop_error_log_resolved ON popshop_error_log(resolved);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get order statistics
CREATE OR REPLACE FUNCTION get_popshop_order_stats(
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    processing_orders BIGINT,
    shipped_orders BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    total_revenue_myr DECIMAL,
    avg_order_myr DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
        COUNT(*) FILTER (WHERE status IN ('paid', 'processing'))::BIGINT as processing_orders,
        COUNT(*) FILTER (WHERE status = 'shipped')::BIGINT as shipped_orders,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_orders,
        COALESCE(SUM(total) FILTER (WHERE status IN ('completed', 'shipped')), 0)::DECIMAL as total_revenue_myr,
        COALESCE(AVG(total) FILTER (WHERE status IN ('completed', 'shipped')), 0)::DECIMAL as avg_order_myr
    FROM popshop_orders
    WHERE
        (p_date_from IS NULL OR created_at >= p_date_from)
        AND (p_date_to IS NULL OR created_at <= p_date_to);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_popshop_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_popshop_orders_updated_at
    BEFORE UPDATE ON popshop_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_popshop_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_popshop_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable for production security
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE popshop_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on popshop_orders" ON popshop_orders
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Anon can read orders (for lookup)
CREATE POLICY "Anon can read popshop_orders" ON popshop_orders
    FOR SELECT
    USING (true);

-- Enable RLS on products (read-only for anon)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products" ON products
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role full access on products" ON products
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON products TO anon;
GRANT SELECT ON popshop_orders TO anon;
GRANT ALL ON products TO service_role;
GRANT ALL ON popshop_orders TO service_role;
GRANT ALL ON popshop_audit_log TO service_role;
GRANT ALL ON popshop_error_log TO service_role;
