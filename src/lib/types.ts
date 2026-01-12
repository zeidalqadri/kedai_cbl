export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  sizes: string[]
  category: 'basketball' | 'apparel'
}

export interface CartItem {
  product: Product
  size: string
  quantity: number
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
}
