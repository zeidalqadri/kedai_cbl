import type { CryptoAsset, CryptoSymbol, Network, NetworkType } from '../types'

// Supported Cryptocurrencies
export const CRYPTO_ASSETS: Record<CryptoSymbol, CryptoAsset> = {
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    icon: '💵',
    color: '#26A17B',
    coingeckoId: 'tether',
    networks: ['TRC-20', 'BEP-20', 'ERC-20', 'POLYGON'],
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: '🔵',
    color: '#2775CA',
    coingeckoId: 'usd-coin',
    networks: ['TRC-20', 'BEP-20', 'ERC-20', 'POLYGON'],
  },
  BNB: {
    name: 'BNB',
    symbol: 'BNB',
    icon: '🟡',
    color: '#F3BA2F',
    coingeckoId: 'binancecoin',
    networks: ['BEP-20'],
  },
  MATIC: {
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '🟣',
    color: '#8247E5',
    coingeckoId: 'matic-network',
    networks: ['POLYGON', 'ERC-20'],
  },
}

// Blockchain Networks
export const NETWORKS: Record<NetworkType, Network> = {
  'TRC-20': {
    name: 'Tron (TRC-20)',
    icon: '🔴',
    addressPrefix: 'T',
    addressLength: 34,
    explorer: 'https://tronscan.org/#/address/',
    confirmations: '~1 min',
  },
  'BEP-20': {
    name: 'BNB Smart Chain (BEP-20)',
    icon: '🟡',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://bscscan.com/address/',
    confirmations: '~15 sec',
  },
  'ERC-20': {
    name: 'Ethereum (ERC-20)',
    icon: '💎',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://etherscan.io/address/',
    confirmations: '~2 min',
  },
  POLYGON: {
    name: 'Polygon',
    icon: '🟣',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://polygonscan.com/address/',
    confirmations: '~5 sec',
  },
}

// Storage Keys
export const STORAGE_KEYS = {
  ORDERS: 'cryptokiosk:orders',
  SETTINGS: 'cryptokiosk:settings',
  STATS: 'cryptokiosk:stats',
} as const

// Quick amount presets (MYR)
export const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000] as const
