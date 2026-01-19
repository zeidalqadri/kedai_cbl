// Product Types
export interface ProductSize {
  id: string
  label: string
  available: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number // MYR
  images: string[]
  sizes: ProductSize[]
  category: 'apparel' | 'equipment'
}

// Cart Types
export interface CartItem {
  productId: string
  size: string
  quantity: number
  price: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  shippingFee: number
  total: number
}

// Customer Types
export interface Customer {
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

// Order Types
// Status flow: pending → confirmed → processing → shipped → delivered
// Can also be cancelled or refunded at various stages
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface OrderItem {
  productId: string
  productName: string
  size: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  total: number
  customer: Customer
  paymentRef?: string
  hasProofImage: boolean
  status: OrderStatus
  trackingNumber?: string
  adminNote?: string
  createdAt: number
  updatedAt: number
}

// Shop Screen Types
export type ShopScreen =
  | 'catalog'
  | 'product'
  | 'cart'
  | 'customer'
  | 'payment'
  | 'confirm'
  | 'processing'
  | 'lookup'

// Malaysian States
export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
] as const

export type MalaysianState = typeof MALAYSIAN_STATES[number]
