import type { Product } from '../types'

// CBL Brand Color
export const CBL_ORANGE = '#FF6B35'

// Product Catalog
export const PRODUCTS: Record<string, Product> = {
  'cbl-jingga-tshirt': {
    id: 'cbl-jingga-tshirt',
    slug: 'cbl-jingga-tshirt',
    name: 'CBL Jingga T-Shirt',
    description: 'Official CBL jersey in vibrant Jingga (orange) - the signature color of CBL.',
    price: 89, // MYR - placeholder price
    images: [
      '/products/tshirt/CBL_jingga_HR.png',
      '/products/tshirt/CBL_jingga_back_HR.png',
      '/products/tshirt/CBL_jingga_left_HR.png',
      '/products/tshirt/CBL_jingga_right_HR.png',
    ],
    sizes: [
      { id: 'S', label: 'S', available: true },
      { id: 'M', label: 'M', available: true },
      { id: 'L', label: 'L', available: true },
      { id: 'XL', label: 'XL', available: true },
      { id: '2XL', label: '2XL', available: true },
    ],
    category: 'apparel',
  },
  'cbl-basketball': {
    id: 'cbl-basketball',
    slug: 'cbl-basketball',
    name: 'CBL Basketball',
    description: 'Official CBL game ball. Available in sizes 5, 6, and 7.',
    price: 129, // MYR - placeholder price (size 5)
    images: [
      '/products/basketball/CBL_Basketball_3stacked.png',    // Hero/main - all 3 sizes
      '/products/basketball/CBL_Basketball_relative.png',   // Size comparison
      '/products/basketball/CBL_Basketball_5.png',          // Size 5
      '/products/basketball/CBL_Basketball_6.png',          // Size 6
      '/products/basketball/CBL_Basketball_7.png',          // Size 7
    ],
    sizes: [
      { id: '5', label: 'Size 5 (Youth)', available: true },
      { id: '6', label: 'Size 6 (Women)', available: true },
      { id: '7', label: 'Size 7 (Men)', available: true },
    ],
    category: 'equipment',
  },
}

// Basketball size-specific pricing
export const BASKETBALL_PRICES: Record<string, number> = {
  '5': 129, // MYR
  '6': 139, // MYR
  '7': 149, // MYR
}

// Get product list as array
export const PRODUCT_LIST = Object.values(PRODUCTS)

// Helper to get product by ID
export function getProductById(id: string): Product | undefined {
  return PRODUCTS[id]
}

// Helper to get product price (handles basketball size-specific pricing)
export function getProductPrice(productId: string, size: string): number {
  const product = PRODUCTS[productId]
  if (!product) return 0

  if (productId === 'cbl-basketball' && BASKETBALL_PRICES[size]) {
    return BASKETBALL_PRICES[size]
  }

  return product.price
}
