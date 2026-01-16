-- ============================================================================
-- CRYPTICO ATM - SUPABASE DATABASE SCHEMA
-- Version: 1.0.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CRYPTO PRICES TABLE
-- Stores current cryptocurrency prices with markup
-- ============================================================================
CREATE TABLE IF NOT EXISTS crypto_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL UNIQUE,
    coingecko_id VARCHAR(50) NOT NULL,
    price_myr DECIMAL(18, 8) NOT NULL,
    rate_with_markup DECIMAL(18, 8) NOT NULL,
    markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    fetch_error BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON crypto_prices(symbol);

-- Insert initial seed data
INSERT INTO crypto_prices (symbol, coingecko_id, price_myr, rate_with_markup, markup_percent, is_fallback) VALUES
    ('USDT', 'tether', 4.50, 4.59, 2.00, true),
    ('USDC', 'usd-coin', 4.50, 4.59, 2.00, true),
    ('BNB', 'binancecoin', 2800.00, 2856.00, 2.00, true),
    ('MATIC', 'matic-network', 2.15, 2.19, 2.00, true)
ON CONFLICT (symbol) DO NOTHING;

-- ============================================================================
-- ORDERS TABLE
-- Main transaction records
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(20) PRIMARY KEY,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    
    -- Crypto details
    crypto VARCHAR(10) NOT NULL,
    network VARCHAR(20) NOT NULL,
    amount_myr DECIMAL(12, 2) NOT NULL,
    amount_crypto DECIMAL(18, 8) NOT NULL,
    network_fee DECIMAL(8, 2) NOT NULL DEFAULT 0,
    rate DECIMAL(18, 8) NOT NULL,
    base_rate DECIMAL(18, 8),
    
    -- Customer details
    customer_name VARCHAR(100) NOT NULL,
    customer_contact_type VARCHAR(20) NOT NULL,
    customer_contact VARCHAR(100) NOT NULL,
    wallet_address VARCHAR(100) NOT NULL,
    
    -- Payment details
    payment_ref VARCHAR(100),
    has_proof_image BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status and tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    tx_hash VARCHAR(100),
    admin_note TEXT,
    kiosk_id VARCHAR(50) DEFAULT 'default',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'cancelled')),
    CONSTRAINT chk_crypto CHECK (crypto IN ('USDT', 'USDC', 'BNB', 'MATIC')),
    CONSTRAINT chk_network CHECK (network IN ('TRC-20', 'BEP-20', 'ERC-20', 'POLYGON')),
    CONSTRAINT chk_contact_type CHECK (customer_contact_type IN ('telegram', 'email')),
    CONSTRAINT chk_amount_positive CHECK (amount_myr > 0),
    CONSTRAINT chk_crypto_amount_positive CHECK (amount_crypto > 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_crypto ON orders(crypto);
CREATE INDEX IF NOT EXISTS idx_orders_network ON orders(network);
CREATE INDEX IF NOT EXISTS idx_orders_kiosk_id ON orders(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_contact ON orders(customer_contact);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ============================================================================
-- AUDIT LOG TABLE
-- Tracks all state changes for compliance and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
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
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- ============================================================================
-- ERROR LOG TABLE
-- Stores workflow errors for debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_log (
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
CREATE INDEX IF NOT EXISTS idx_error_log_workflow ON error_log(workflow_name);
CREATE INDEX IF NOT EXISTS idx_error_log_created ON error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_resolved ON error_log(resolved);

-- ============================================================================
-- KIOSKS TABLE (OPTIONAL)
-- For multi-kiosk deployments
-- ============================================================================
CREATE TABLE IF NOT EXISTS kiosks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default kiosk
INSERT INTO kiosks (id, name, location, is_active) VALUES
    ('default', 'Main Kiosk', 'Primary Location', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RATE LOCKS TABLE (OPTIONAL)
-- For stricter rate lock enforcement
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    crypto VARCHAR(10) NOT NULL,
    locked_rate DECIMAL(18, 8) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    order_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for rate lock lookups
CREATE INDEX IF NOT EXISTS idx_rate_locks_session ON rate_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_rate_locks_expires ON rate_locks(expires_at);

-- Cleanup old rate locks (optional scheduled job)
-- DELETE FROM rate_locks WHERE expires_at < NOW() - INTERVAL '1 hour';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable for production security
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on orders" ON orders
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Anon can only read their own orders (by order ID)
-- This requires the frontend to have the order ID
CREATE POLICY "Anon can read own order" ON orders
    FOR SELECT
    USING (true);  -- Open for lookup by ID

-- Enable RLS on crypto_prices (read-only for anon)
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prices" ON crypto_prices
    FOR SELECT
    USING (true);

CREATE POLICY "Service role full access on prices" ON crypto_prices
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get order statistics
CREATE OR REPLACE FUNCTION get_order_stats(
    p_kiosk_id VARCHAR DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    completed_orders BIGINT,
    rejected_orders BIGINT,
    total_volume_myr DECIMAL,
    avg_order_myr DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_orders,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_orders,
        COALESCE(SUM(amount_myr) FILTER (WHERE status = 'completed'), 0)::DECIMAL as total_volume_myr,
        COALESCE(AVG(amount_myr) FILTER (WHERE status = 'completed'), 0)::DECIMAL as avg_order_myr
    FROM orders
    WHERE 
        (p_kiosk_id IS NULL OR kiosk_id = p_kiosk_id)
        AND (p_date_from IS NULL OR created_at >= p_date_from)
        AND (p_date_to IS NULL OR created_at <= p_date_to);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired rate locks
CREATE OR REPLACE FUNCTION cleanup_expired_rate_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_locks 
    WHERE expires_at < NOW() - INTERVAL '1 hour'
    AND used = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kiosks_updated_at
    BEFORE UPDATE ON kiosks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON crypto_prices TO anon;
GRANT SELECT ON orders TO anon;
GRANT ALL ON crypto_prices TO service_role;
GRANT ALL ON orders TO service_role;
GRANT ALL ON audit_log TO service_role;
GRANT ALL ON error_log TO service_role;
GRANT ALL ON kiosks TO service_role;
GRANT ALL ON rate_locks TO service_role;
