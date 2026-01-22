// Session storage for shop state persistence
// Uses sessionStorage so state clears when browser tab closes

const STORAGE_KEY = 'cbl-popshop:session'

export interface SessionState {
  // Screen state
  screen: string
  selectedProductId: string | null

  // Cart items
  cartItems: Array<{
    productId: string
    size: string
    quantity: number
    price: number
  }>

  // Customer details
  customer: {
    name: string
    phone: string
    email: string
    address: {
      line1: string
      line2?: string
      city: string
      state: string
      postcode: string
    }
  }

  // Payment (not storing proof image - too large)
  paymentRef: string

  // Order (if submitted)
  orderId: string
  currentOrder: {
    id: string
    items: Array<{
      productId: string
      productName: string
      size: string
      quantity: number
      price: number
    }>
    subtotal: number
    shippingFee: number
    total: number
    customer: {
      name: string
      phone: string
      email: string
      address: {
        line1: string
        line2?: string
        city: string
        state: string
        postcode: string
      }
    }
    status: string
  } | null

  // Timestamp for expiry
  savedAt: number
}

// Session expires after 30 minutes of inactivity
const SESSION_EXPIRY_MS = 30 * 60 * 1000

export function saveSession(state: Partial<SessionState>): void {
  try {
    const existing = loadSession()
    const merged: SessionState = {
      screen: state.screen ?? existing?.screen ?? 'catalog',
      selectedProductId: state.selectedProductId ?? existing?.selectedProductId ?? null,
      cartItems: state.cartItems ?? existing?.cartItems ?? [],
      customer: state.customer ?? existing?.customer ?? {
        name: '',
        phone: '',
        email: '',
        address: { line1: '', line2: '', city: '', state: '', postcode: '' },
      },
      paymentRef: state.paymentRef ?? existing?.paymentRef ?? '',
      orderId: state.orderId ?? existing?.orderId ?? '',
      currentOrder: state.currentOrder ?? existing?.currentOrder ?? null,
      savedAt: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // Storage might be full or disabled
  }
}

export function loadSession(): SessionState | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const session = JSON.parse(data) as SessionState

    // Check if session has expired
    if (Date.now() - session.savedAt > SESSION_EXPIRY_MS) {
      clearSession()
      return null
    }

    return session
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}
