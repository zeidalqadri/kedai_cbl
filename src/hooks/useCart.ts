import { useState, useCallback, useMemo, useEffect } from 'react'
import type { CartItem, Cart } from '../types'
import { config } from '../config'
import { getProductPrice, getProductById } from '../lib/constants'
import { saveSession, loadSession } from '../lib/session'

interface UseCartReturn {
  // Cart state
  cart: Cart
  items: CartItem[]
  itemCount: number
  isEmpty: boolean

  // Actions
  addItem: (productId: string, size: string, quantity?: number) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  removeItem: (productId: string, size: string) => void
  clearCart: () => void

  // Computed
  getItemQuantity: (productId: string, size: string) => number

  // For session restore
  restoreItems: (items: CartItem[]) => void
}

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initialize from session if available
    const session = loadSession()
    return session?.cartItems ?? []
  })

  // Save cart to session whenever it changes
  useEffect(() => {
    saveSession({ cartItems: items })
  }, [items])

  // Add item to cart
  const addItem = useCallback((productId: string, size: string, quantity: number = 1) => {
    const product = getProductById(productId)
    if (!product) return

    const price = getProductPrice(productId, size)

    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === productId && item.size === size
      )

      if (existingIndex >= 0) {
        // Update existing item quantity
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      // Add new item
      return [...prev, { productId, size, quantity, price }]
    })
  }, [])

  // Update item quantity
  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size)
      return
    }

    setItems(prev =>
      prev.map(item =>
        item.productId === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    )
  }, [])

  // Remove item from cart
  const removeItem = useCallback((productId: string, size: string) => {
    setItems(prev =>
      prev.filter(item => !(item.productId === productId && item.size === size))
    )
  }, [])

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Restore items from session (used by useShop)
  const restoreItems = useCallback((restoredItems: CartItem[]) => {
    setItems(restoredItems)
  }, [])

  // Get quantity for a specific item
  const getItemQuantity = useCallback((productId: string, size: string): number => {
    const item = items.find(i => i.productId === productId && i.size === size)
    return item?.quantity ?? 0
  }, [items])

  // Calculate totals
  const cart = useMemo<Cart>(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    // Free shipping above threshold
    const shippingFee = subtotal >= config.freeShippingThreshold ? 0 : config.standardShippingFee

    return {
      items,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
    }
  }, [items])

  // Total item count
  const itemCount = useMemo(() =>
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  return {
    cart,
    items,
    itemCount,
    isEmpty: items.length === 0,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
    restoreItems,
  }
}
