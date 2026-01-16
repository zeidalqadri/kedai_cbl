// API Client for CryptoKiosk Backend
// Handles all HTTP requests to the server

import type { Order, OrderStatus, CryptoSymbol, NetworkType, ContactType } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Auth token management
let authToken: string | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
  if (token) {
    localStorage.setItem('admin_token', token)
  } else {
    localStorage.removeItem('admin_token')
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('admin_token')
  }
  return authToken
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// ============================================================================
// ORDER API
// ============================================================================

export interface CreateOrderInput {
  crypto: CryptoSymbol
  network: NetworkType
  amountMYR: number
  amountCrypto: number
  networkFee: number
  rate: number
  customerName: string
  walletAddress: string
  contactType: ContactType
  contactValue: string
}

export const orderApi = {
  // Create new order (public)
  async create(input: CreateOrderInput): Promise<ApiResponse<{ id: string; status: OrderStatus; createdAt: string }>> {
    return apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  // Lookup order by ID (public)
  async lookup(orderId: string): Promise<ApiResponse<Order>> {
    return apiFetch(`/orders/lookup/${orderId}`)
  },

  // Update payment info (public)
  async updatePayment(
    orderId: string,
    data: { paymentRef?: string; hasProofImage?: boolean; proofImageUrl?: string }
  ): Promise<ApiResponse<{ id: string; status: OrderStatus }>> {
    return apiFetch(`/orders/${orderId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // List all orders (admin)
  async list(params?: {
    status?: OrderStatus
    limit?: number
    offset?: number
    sortBy?: 'createdAt' | 'updatedAt' | 'amountMYR'
    sortOrder?: 'asc' | 'desc'
  }): Promise<ApiResponse<Order[]>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const query = searchParams.toString()
    return apiFetch(`/orders${query ? `?${query}` : ''}`)
  },

  // Get single order (admin)
  async get(orderId: string): Promise<ApiResponse<Order>> {
    return apiFetch(`/orders/${orderId}`)
  },

  // Approve order (admin)
  async approve(orderId: string): Promise<ApiResponse<{ id: string; status: OrderStatus }>> {
    return apiFetch('/orders/approve', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    })
  },

  // Reject order (admin)
  async reject(orderId: string, reason?: string): Promise<ApiResponse<{ id: string; status: OrderStatus }>> {
    return apiFetch('/orders/reject', {
      method: 'POST',
      body: JSON.stringify({ orderId, reason }),
    })
  },

  // Complete order (admin)
  async complete(
    orderId: string,
    txHash: string
  ): Promise<ApiResponse<{ id: string; status: OrderStatus; txHash: string }>> {
    return apiFetch('/orders/complete', {
      method: 'POST',
      body: JSON.stringify({ orderId, txHash }),
    })
  },

  // Get statistics (admin)
  async getStats(): Promise<
    ApiResponse<{
      counts: { pending: number; approved: number; completed: number; rejected: number }
      totalVolumeMYR: number
    }>
  > {
    return apiFetch('/orders/stats/summary')
  },
}

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; admin: { id: string; username: string } }>> {
    const response = await apiFetch<{ token: string; admin: { id: string; username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (response.success && response.data?.token) {
      setAuthToken(response.data.token)
    }

    return response
  },

  async me(): Promise<ApiResponse<{ id: string; username: string; lastLoginAt: string }>> {
    return apiFetch('/auth/me')
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiFetch<{ message: string }>('/auth/logout', { method: 'POST' })
    setAuthToken(null)
    return response
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
}

// ============================================================================
// SETTINGS API
// ============================================================================

export interface PublicSettings {
  businessName: string
  businessTagline: string
  supportTelegram: string
  supportEmail: string
  minAmount: number
  maxAmount: number
  rateLockDuration: number
  networkFees: Record<NetworkType, number>
}

export const settingsApi = {
  async getPublic(): Promise<ApiResponse<PublicSettings>> {
    return apiFetch('/settings/public')
  },

  async getAll(): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch('/settings')
  },

  async update(settings: Partial<Record<string, unknown>>): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    })
  },
}

// ============================================================================
// PRICES API
// ============================================================================

export interface PricesResponse {
  prices: Record<CryptoSymbol, number>
  basePrices: Record<CryptoSymbol, number>
  markup: number
  updatedAt: string
}

export const pricesApi = {
  async get(): Promise<ApiResponse<PricesResponse>> {
    return apiFetch('/prices')
  },
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return response.ok
  } catch {
    return false
  }
}
