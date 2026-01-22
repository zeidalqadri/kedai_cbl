// Admin Dashboard Types for Inventory and Reports

// ============================================================================
// Inventory Types
// ============================================================================

export interface InventoryItem {
  size_id: string
  quantity: number
  reserved: number
  available: number
  low_threshold: number
  is_low_stock: boolean
  is_out_of_stock: boolean
}

export interface ProductInventory {
  id: string
  name: string
  base_price: number
  cost_price: number
  inventory: InventoryItem[]
}

export interface InventorySummary {
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
}

export interface InventoryResponse {
  success: boolean
  products: ProductInventory[]
  summary: InventorySummary
}

export interface StockUpdateRequest {
  product_id: string
  size_id: string
  quantity: number
  update_type: 'set' | 'add' | 'subtract'
  notes?: string
}

export interface StockUpdateResponse {
  success: boolean
  product_id: string
  size_id: string
  new_quantity: number
  transaction_id: string
  message: string
}

// ============================================================================
// Reports Types
// ============================================================================

export interface PnLData {
  gross_revenue: number
  total_cogs: number
  shipping_costs: number
  gross_profit: number
  profit_margin: number
  avg_order_value: number
}

export interface OrderStats {
  total: number
  completed: number
  delivered: number
  shipped: number
  processing: number
  confirmed: number
  pending: number
  cancelled: number
  refunded: number
}

export interface DailyBreakdown {
  date: string
  orders: number
  revenue: number
  profit: number
}

export interface PnLReportResponse {
  success: boolean
  date_range: {
    from: string
    to: string
  }
  pnl: PnLData
  orders: OrderStats
  daily_breakdown: DailyBreakdown[]
  generated_at: string
}

// ============================================================================
// Admin Tab Types
// ============================================================================

export type AdminTab = 'orders' | 'inventory' | 'reports'

export type StockFilter = 'all' | 'low_stock' | 'out_of_stock'

export type DatePreset = 'today' | '7days' | '30days' | 'this_month' | 'custom'
