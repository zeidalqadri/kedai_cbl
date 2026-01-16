import type { Order } from '../types'
import { STORAGE_KEYS } from './constants'

// Storage interface - abstracts storage backend
// Currently uses localStorage, can be swapped for API calls in production

interface StorageBackend {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<boolean>
}

// LocalStorage implementation
const localStorageBackend: StorageBackend = {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  async set(key: string, value: string): Promise<boolean> {
    try {
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
}

// Use localStorage for now, will be replaced with API in Phase 2
const backend = localStorageBackend

// Order Storage Operations
export const orderStorage = {
  async getAll(): Promise<Order[]> {
    try {
      const result = await backend.get(STORAGE_KEYS.ORDERS)
      return result ? JSON.parse(result) : []
    } catch {
      return []
    }
  },

  async save(orders: Order[]): Promise<boolean> {
    try {
      await backend.set(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
      return true
    } catch {
      return false
    }
  },

  async add(order: Order): Promise<boolean> {
    const orders = await this.getAll()
    orders.unshift(order)
    // Keep last 1000 orders
    if (orders.length > 1000) {
      orders.length = 1000
    }
    return await this.save(orders)
  },

  async update(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    const orders = await this.getAll()
    const index = orders.findIndex((o) => o.id === orderId)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates, updatedAt: Date.now() }
      await this.save(orders)
      return orders[index]
    }
    return null
  },

  async getById(orderId: string): Promise<Order | null> {
    const orders = await this.getAll()
    return orders.find((o) => o.id === orderId) || null
  },

  async getByStatus(status: Order['status']): Promise<Order[]> {
    const orders = await this.getAll()
    return orders.filter((o) => o.status === status)
  },

  async getStats(): Promise<{
    total: number
    pending: number
    approved: number
    completed: number
    rejected: number
    todayCount: number
    todayVolume: number
  }> {
    const orders = await this.getAll()
    const today = new Date().setHours(0, 0, 0, 0)
    const todayOrders = orders.filter((o) => o.createdAt >= today)

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      approved: orders.filter((o) => o.status === 'approved').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
      todayCount: todayOrders.length,
      todayVolume: todayOrders.reduce((sum, o) => sum + o.amountMYR, 0),
    }
  },
}
