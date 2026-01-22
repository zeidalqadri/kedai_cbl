// API Client for CBL Popshop Backend (n8n webhooks)
// Handles all HTTP requests to the n8n webhook server

import type { Order, OrderStatus, OrderItem, Customer } from '../types'
import { config } from '../config'

const API_BASE = config.apiUrl

// Response types from n8n webhooks
interface N8nApiResponse {
  success?: boolean
  ok?: boolean
  error?: string
  error_code?: string
  code?: string
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

    // Check for empty or non-OK response
    if (!response.ok) {
      const text = await response.text()
      let errorData: N8nApiResponse = {}
      try {
        errorData = text ? JSON.parse(text) : {}
      } catch {
        // Response wasn't valid JSON
      }
      return {
        success: false,
        error: errorData.error || errorData.message || `Server error (${response.status})`,
        errorCode: errorData.error_code || errorData.code || String(response.status),
      }
    }

    const text = await response.text()
    if (!text) {
      return {
        success: false,
        error: 'Server returned empty response. Please try again.',
        errorCode: 'EMPTY_RESPONSE',
      }
    }

    let data: N8nApiResponse
    try {
      data = JSON.parse(text)
    } catch {
      return {
        success: false,
        error: 'Invalid server response. Please try again.',
        errorCode: 'INVALID_JSON',
      }
    }

    // n8n workflows use 'success' field
    if (!data.success && !data.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        errorCode: data.error_code || data.code,
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

    // Check for empty or non-OK response
    if (!response.ok) {
      const text = await response.text()
      let errorData: N8nApiResponse = {}
      try {
        errorData = text ? JSON.parse(text) : {}
      } catch {
        // Response wasn't valid JSON
      }
      return {
        success: false,
        error: errorData.error || errorData.message || `Server error (${response.status})`,
        errorCode: errorData.error_code || errorData.code || String(response.status),
      }
    }

    const text = await response.text()
    if (!text) {
      return {
        success: false,
        error: 'Server returned empty response. Please try again.',
        errorCode: 'EMPTY_RESPONSE',
      }
    }

    let data: N8nApiResponse
    try {
      data = JSON.parse(text)
    } catch {
      return {
        success: false,
        error: 'Invalid server response. Please try again.',
        errorCode: 'INVALID_JSON',
      }
    }

    // n8n workflows use 'success' field
    if (!data.success && !data.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        errorCode: data.error_code || data.code,
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
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  total: number
  customer: Customer
  paymentRef?: string
  proofImageBase64?: string
}

export interface OrderSubmitResponse {
  ok: boolean
  orderId: string
  status: OrderStatus
  total: number
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
    items: OrderItem[]
    subtotal: number
    shippingFee: number
    total: number
    customerName: string
    trackingNumber?: string
    createdAt: string
    updatedAt: string
  }
}

// Response for email+postcode lookup (returns array of orders)
export interface OrderLookupByEmailResponse {
  success: boolean
  orders: Array<{
    order_id: string
    status: OrderStatus
    status_display: string
    items: OrderItem[]
    subtotal: number
    shipping_fee: number
    total: number
    tracking_number: string | null
    courier: string | null
    created_at: string
    updated_at: string
  }>
}

export const orderApi = {
  // Create new order (POST /popshop/order/submit)
  async create(input: CreateOrderInput): Promise<ApiResponse<OrderSubmitResponse>> {
    return publicFetch<OrderSubmitResponse>('/popshop/order/submit', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  // Lookup order by ID (GET /popshop/order/lookup?order_id=)
  async lookup(orderId: string): Promise<ApiResponse<OrderLookupResponse>> {
    try {
      const response = await fetch(`${API_BASE}/popshop/order/lookup?order_id=${encodeURIComponent(orderId)}`)
      const data = await response.json() as N8nApiResponse

      // n8n workflows use 'success' field
      if (!data.success && !data.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Order not found',
          errorCode: data.error_code || data.code,
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

  // Lookup orders by email + postcode (GET /popshop/order/lookup?email=&postcode=)
  async lookupByEmail(email: string, postcode: string): Promise<ApiResponse<OrderLookupByEmailResponse>> {
    try {
      const params = new URLSearchParams({
        email: email.toLowerCase().trim(),
        postcode: postcode.trim(),
      })
      const response = await fetch(`${API_BASE}/popshop/order/lookup?${params}`)
      const data = await response.json() as N8nApiResponse

      // n8n workflows use 'success' field
      if (!data.success) {
        return {
          success: false,
          error: data.error || data.message || 'No orders found',
          errorCode: data.error_code || data.code,
        }
      }

      return {
        success: true,
        data: data as unknown as OrderLookupByEmailResponse,
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
  items: string // JSON string of OrderItem[]
  subtotal: number
  shipping_fee: number
  total: number
  customer_name: string
  customer_phone: string
  customer_email: string
  shipping_address: string // JSON string
  payment_ref: string | null
  has_proof_image: boolean
  status: OrderStatus
  tracking_number: string | null
  admin_note: string | null
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
      totalShipped: number
      totalCancelled: number
      totalRevenueMYR: number
    }
    today: {
      orders: number
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
  trackingNumber?: string
  updatedAt: string
}

export const adminApi = {
  // List all orders (GET /popshop/admin/orders)
  async getOrders(params?: {
    status?: OrderStatus
    limit?: number
    offset?: number
  }): Promise<ApiResponse<AdminOrdersResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))

    const query = searchParams.toString()
    return adminFetch<AdminOrdersResponse>(`/popshop/admin/orders${query ? `?${query}` : ''}`)
  },

  // Get dashboard stats (GET /popshop/admin/stats)
  async getStats(): Promise<ApiResponse<AdminStatsResponse>> {
    return adminFetch<AdminStatsResponse>('/popshop/admin/stats')
  },

  // Update order status (POST /popshop/order/status)
  // Valid statuses: pending, confirmed, processing, shipped, delivered, cancelled, refunded
  async updateStatus(
    orderId: string,
    status: OrderStatus,
    data?: { trackingNumber?: string; courier?: string; adminNotes?: string }
  ): Promise<ApiResponse<StatusUpdateResponse>> {
    return adminFetch<StatusUpdateResponse>('/popshop/order/status', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        status,
        tracking_number: data?.trackingNumber,
        courier: data?.courier,
        admin_notes: data?.adminNotes,
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
    items: JSON.parse(adminOrder.items) as OrderItem[],
    subtotal: Number(adminOrder.subtotal),
    shippingFee: Number(adminOrder.shipping_fee),
    total: Number(adminOrder.total),
    customer: {
      name: adminOrder.customer_name,
      phone: adminOrder.customer_phone,
      email: adminOrder.customer_email,
      address: JSON.parse(adminOrder.shipping_address),
    },
    paymentRef: adminOrder.payment_ref || undefined,
    hasProofImage: adminOrder.has_proof_image,
    status: adminOrder.status,
    trackingNumber: adminOrder.tracking_number || undefined,
    adminNote: adminOrder.admin_note || undefined,
    createdAt: new Date(adminOrder.created_at).getTime(),
    updatedAt: new Date(adminOrder.updated_at).getTime(),
  }
}

// Check if API is configured and reachable
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/popshop/admin/stats`, {
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
