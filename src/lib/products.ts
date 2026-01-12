import type { Product } from './types'

export const products: Product[] = [
  {
    id: 'cbl-basketball',
    name: 'CBL Basketball',
    description: 'Official CBL game ball. Premium composite leather for indoor and outdoor play. Superior grip and durability.',
    price: 129.00,
    image: '/basketball-placeholder.svg',
    sizes: ['5', '6', '7'],
    category: 'basketball',
  },
  {
    id: 'cbl-jingga-tshirt',
    name: 'CBL Jingga T-Shirt',
    description: 'Premium cotton blend t-shirt in signature Jingga orange. Breathable fabric with embroidered CBL logo.',
    price: 79.00,
    image: '/tshirt-placeholder.svg',
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    category: 'apparel',
  },
]
