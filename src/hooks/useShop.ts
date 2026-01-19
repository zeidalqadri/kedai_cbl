import { useState, useCallback } from 'react'
import type { ShopScreen, Customer, Order, OrderItem } from '../types'
import { orderApi } from '../lib/api'
import { getProductById } from '../lib/constants'
import { useCart } from './useCart'

interface UseShopReturn {
  // Screen state
  screen: ShopScreen
  setScreen: (screen: ShopScreen) => void

  // Product selection (for product detail screen)
  selectedProductId: string | null
  selectProduct: (productId: string) => void

  // Cart (delegated to useCart)
  cart: ReturnType<typeof useCart>

  // Customer details
  customer: Customer
  setCustomer: (customer: Customer) => void

  // Order
  orderId: string
  currentOrder: Order | null

  // Payment
  paymentProof: string | null
  setPaymentProof: (proof: string | null) => void
  paymentRef: string
  setPaymentRef: (ref: string) => void

  // Lookup
  lookupOrderId: string
  setLookupOrderId: (id: string) => void
  lookupResult: Order | null
  lookupLoading: boolean

  // Error
  error: string
  setError: (error: string) => void

  // Actions
  submitOrder: () => Promise<void>
  lookupOrder: () => Promise<void>
  resetFlow: () => void
}

const initialCustomer: Customer = {
  name: '',
  phone: '',
  email: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postcode: '',
  },
}

export function useShop(): UseShopReturn {
  // Screen state
  const [screen, setScreen] = useState<ShopScreen>('catalog')

  // Product selection
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Cart
  const cart = useCart()

  // Customer details
  const [customer, setCustomer] = useState<Customer>(initialCustomer)

  // Order
  const [orderId, setOrderId] = useState('')
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  // Payment
  const [paymentProof, setPaymentProof] = useState<string | null>(null)
  const [paymentRef, setPaymentRef] = useState('')

  // Lookup
  const [lookupOrderId, setLookupOrderId] = useState('')
  const [lookupResult, setLookupResult] = useState<Order | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Error
  const [error, setError] = useState('')

  // Select product and navigate to product screen
  const selectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId)
    setScreen('product')
  }, [])

  // Submit order
  const submitOrder = useCallback(async () => {
    if (!paymentRef.trim() && !paymentProof) {
      setError('Please provide payment reference or upload screenshot')
      return
    }

    if (cart.isEmpty) {
      setError('Your cart is empty')
      return
    }

    setError('')

    // Convert cart items to order items
    const orderItems: OrderItem[] = cart.items.map(item => {
      const product = getProductById(item.productId)
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }
    })

    // Submit order via API
    const result = await orderApi.create({
      items: orderItems,
      subtotal: cart.cart.subtotal,
      shippingFee: cart.cart.shippingFee,
      total: cart.cart.total,
      customer,
      paymentRef: paymentRef || undefined,
      proofImageBase64: paymentProof || undefined,
    })

    if (!result.success || !result.data) {
      setError(result.error || 'Failed to submit order')
      return
    }

    // Create local order object for UI
    const order: Order = {
      id: result.data.orderId,
      items: orderItems,
      subtotal: cart.cart.subtotal,
      shippingFee: cart.cart.shippingFee,
      total: cart.cart.total,
      customer: { ...customer },
      paymentRef: paymentRef,
      hasProofImage: !!paymentProof,
      status: result.data.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setOrderId(result.data.orderId)
    setCurrentOrder(order)
    cart.clearCart()
    setScreen('processing')
  }, [paymentRef, paymentProof, cart, customer])

  // Lookup order
  const lookupOrder = useCallback(async () => {
    if (!lookupOrderId.trim()) {
      setError('Please enter an order ID')
      return
    }

    setError('')
    setLookupLoading(true)
    setLookupResult(null)

    const result = await orderApi.lookup(lookupOrderId.trim().toUpperCase())
    setLookupLoading(false)

    if (!result.success || !result.data) {
      setError(result.error || 'Order not found')
      return
    }

    // Convert API response to Order format
    const apiOrder = result.data.order
    const order: Order = {
      id: apiOrder.id,
      items: apiOrder.items,
      subtotal: apiOrder.subtotal,
      shippingFee: apiOrder.shippingFee,
      total: apiOrder.total,
      customer: {
        name: apiOrder.customerName,
        phone: '',
        email: '',
        address: { line1: '', city: '', state: '', postcode: '' },
      },
      paymentRef: '',
      hasProofImage: false,
      status: apiOrder.status,
      trackingNumber: apiOrder.trackingNumber,
      createdAt: new Date(apiOrder.createdAt).getTime(),
      updatedAt: new Date(apiOrder.updatedAt).getTime(),
    }

    setLookupResult(order)
  }, [lookupOrderId])

  // Reset the entire flow
  const resetFlow = useCallback(() => {
    setScreen('catalog')
    setSelectedProductId(null)
    setCustomer(initialCustomer)
    setOrderId('')
    setCurrentOrder(null)
    setPaymentProof(null)
    setPaymentRef('')
    setLookupOrderId('')
    setLookupResult(null)
    setError('')
    // Note: cart is not cleared on reset - user might want to continue shopping
  }, [])

  return {
    screen,
    setScreen,
    selectedProductId,
    selectProduct,
    cart,
    customer,
    setCustomer,
    orderId,
    currentOrder,
    paymentProof,
    setPaymentProof,
    paymentRef,
    setPaymentRef,
    lookupOrderId,
    setLookupOrderId,
    lookupResult,
    lookupLoading,
    error,
    setError,
    submitOrder,
    lookupOrder,
    resetFlow,
  }
}
