// API Client for CryptoKiosk Backend (n8n webhooks)
// Handles all HTTP requests to the n8n webhook server

import type { Order, OrderStatus, CryptoSymbol, NetworkType } from '../types'
import { config } from '../config'

const API_BASE = config.apiUrl

// Response types from n8n webhooks
interface N8nApiResponse {
  ok: boolean
  error_code?: string
  message?: string
  [key: string]: unknown
}

// Transformed response for internal use
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}

// ============================================================================
// GENERIC FETCH HELPERS
// ============================================================================

async function publicFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.apiKey && { 'X-API-Key': config.apiKey }),
    ...(options.headers as Record<string, string>),
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json() as N8nApiResponse

    if (!data.ok) {
      return {
        success: false,
        error: data.message || 'Request failed',
        errorCode: data.error_code,
      }
    }

    return {
      success: true,
      data: data as unknown as T,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Admin-Key': config.adminApiKey,
    ...(options.headers as Record<string, string>),
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json() as N8nApiResponse

    if (!data.ok) {
      return {
        success: false,
        error: data.message || 'Request failed',
        errorCode: data.error_code,
      }
    }

    return {
      success: true,
      data: data as unknown as T,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// ============================================================================
// ORDER API (Customer-facing)
// ============================================================================

export interface CreateOrderInput {
  crypto: CryptoSymbol
  network: NetworkType
  amountMYR: number
  customerName: string
  contactType: 'telegram' | 'email'
  contact: string
  walletAddress: string
  rateLockTimestamp: number
  currentRate: number
  baseRate: number
  paymentRef?: string
  proofImageBase64?: string
}

export interface OrderSubmitResponse {
  ok: boolean
  orderId: string
  status: OrderStatus
  crypto: CryptoSymbol
  network: NetworkType
  amountMYR: number
  amountCrypto: number
  rate: number
  networkFee: number
  estimatedDelivery: string
  message: string
  trackingUrl: string
}

export interface OrderLookupResponse {
  ok: boolean
  order: {
    id: string
    status: OrderStatus
    statusDisplay: {
      label: string
      emoji: string
      description: string
    }
    crypto: CryptoSymbol
    network: NetworkType
    amountMYR: number
    amountCrypto: number
    networkFee: number
    rate: number
    customerName: string
    walletAddress: string
    createdAt: string
    updatedAt: string
    txHash?: string
    txExplorerUrl?: string
  }
}

export const orderApi = {
  // Create new order (POST /order/submit)
  async create(input: CreateOrderInput): Promise<ApiResponse<OrderSubmitResponse>> {
    return publicFetch<OrderSubmitResponse>('/order/submit', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  // Lookup order by ID (GET /order/lookup?id=)
  async lookup(orderId: string): Promise<ApiResponse<OrderLookupResponse>> {
    // No auth needed for lookup
    try {
      const response = await fetch(`${API_BASE}/order/lookup?id=${encodeURIComponent(orderId)}`)
      const data = await response.json() as N8nApiResponse

      if (!data.ok) {
        return {
          success: false,
          error: data.message || 'Order not found',
          errorCode: data.error_code,
        }
      }

      return {
        success: true,
        data: data as unknown as OrderLookupResponse,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  },
}

// ============================================================================
// ADMIN API (Admin-facing)
// ============================================================================

export interface AdminOrder {
  id: string
  idempotency_key: string
  crypto: CryptoSymbol
  network: NetworkType
  amount_myr: number
  amount_crypto: number
  network_fee: number
  rate: number
  base_rate: number
  customer_name: string
  customer_contact_type: string
  customer_contact: string
  wallet_address: string
  payment_ref: string | null
  has_proof_image: boolean
  status: OrderStatus
  tx_hash: string | null
  admin_note: string | null
  kiosk_id: string
  created_at: string
  updated_at: string
}

export interface AdminOrdersResponse {
  ok: boolean
  orders: AdminOrder[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface AdminStatsResponse {
  ok: boolean
  stats: {
    generatedAt: string
    overview: {
      totalOrders: number
      totalCompleted: number
      totalPending: number
      totalApproved: number
      totalRejected: number
      totalVolumeMYR: number
      successRate: string
    }
    today: {
      orders: number
      byStatus: Record<OrderStatus, number>
    }
    allTime: {
      byStatus: Record<OrderStatus, number>
    }
    recentPending: AdminOrder[]
  }
}

export interface StatusUpdateResponse {
  ok: boolean
  orderId: string
  previousStatus: OrderStatus
  newStatus: OrderStatus
  txHash?: string
  updatedAt: string
}

export const adminApi = {
  // List all orders (GET /admin/orders)
  async getOrders(params?: {
    status?: OrderStatus
    crypto?: CryptoSymbol
    limit?: number
    offset?: number
  }): Promise<ApiResponse<AdminOrdersResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.crypto) searchParams.set('crypto', params.crypto)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))

    const query = searchParams.toString()
    return adminFetch<AdminOrdersResponse>(`/admin/orders${query ? `?${query}` : ''}`)
  },

  // Get dashboard stats (GET /admin/stats)
  async getStats(): Promise<ApiResponse<AdminStatsResponse>> {
    return adminFetch<AdminStatsResponse>('/admin/stats')
  },

  // Approve order (POST /order/status with action=approve)
  async approveOrder(orderId: string, note?: string): Promise<ApiResponse<StatusUpdateResponse>> {
    return adminFetch<StatusUpdateResponse>('/order/status', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        action: 'approve',
        note,
      }),
    })
  },

  // Reject order (POST /order/status with action=reject)
  async rejectOrder(orderId: string, note?: string): Promise<ApiResponse<StatusUpdateResponse>> {
    return adminFetch<StatusUpdateResponse>('/order/status', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        action: 'reject',
        note,
      }),
    })
  },

  // Complete order with TX hash (POST /order/status with action=complete)
  async completeOrder(orderId: string, txHash: string, note?: string): Promise<ApiResponse<StatusUpdateResponse>> {
    return adminFetch<StatusUpdateResponse>('/order/status', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        action: 'complete',
        txHash,
        note,
      }),
    })
  },

  // Cancel order (POST /order/status with action=cancel)
  async cancelOrder(orderId: string, note?: string): Promise<ApiResponse<StatusUpdateResponse>> {
    return adminFetch<StatusUpdateResponse>('/order/status', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        action: 'cancel',
        note,
      }),
    })
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Convert AdminOrder to Order format for UI components
export function adminOrderToOrder(adminOrder: AdminOrder): Order {
  return {
    id: adminOrder.id,
    crypto: adminOrder.crypto,
    network: adminOrder.network,
    amountMYR: Number(adminOrder.amount_myr),
    amountCrypto: Number(adminOrder.amount_crypto),
    networkFee: Number(adminOrder.network_fee),
    rate: Number(adminOrder.rate),
    customer: {
      name: adminOrder.customer_name,
      contactType: adminOrder.customer_contact_type as 'telegram' | 'email',
      contact: adminOrder.customer_contact,
      walletAddress: adminOrder.wallet_address,
    },
    paymentRef: adminOrder.payment_ref || '',
    hasProofImage: adminOrder.has_proof_image,
    status: adminOrder.status,
    txHash: adminOrder.tx_hash || undefined,
    createdAt: new Date(adminOrder.created_at).getTime(),
    updatedAt: new Date(adminOrder.updated_at).getTime(),
  }
}

// Check if API is configured and reachable
export async function checkApiHealth(): Promise<boolean> {
  try {
    // Try to hit admin stats endpoint (requires auth)
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        'X-Admin-Key': config.adminApiKey,
      },
    })
    const data = await response.json()
    return data.ok === true
  } catch {
    return false
  }
}
