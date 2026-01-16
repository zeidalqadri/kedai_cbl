import type { CryptoAsset, CryptoSymbol, Network, NetworkType } from '../types'

// Supported Cryptocurrencies
export const CRYPTO_ASSETS: Record<CryptoSymbol, CryptoAsset> = {
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    icon: '💵',
    color: '#26A17B',
    coingeckoId: 'tether',
    networks: ['TRC-20', 'ERC-20'],
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: '🔵',
    color: '#2775CA',
    coingeckoId: 'usd-coin',
    networks: ['TRC-20', 'ERC-20'],
  },
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '🟠',
    color: '#F7931A',
    coingeckoId: 'bitcoin',
    networks: ['BTC'],
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '💎',
    color: '#627EEA',
    coingeckoId: 'ethereum',
    networks: ['ETH'],
  },
  SOL: {
    name: 'Solana',
    symbol: 'SOL',
    icon: '🟣',
    color: '#9945FF',
    coingeckoId: 'solana',
    networks: ['SOL'],
  },
  ICP: {
    name: 'Internet Computer',
    symbol: 'ICP',
    icon: '🔷',
    color: '#29ABE2',
    coingeckoId: 'internet-computer',
    networks: ['ICP'],
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
  'ERC-20': {
    name: 'Ethereum (ERC-20)',
    icon: '💎',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://etherscan.io/address/',
    confirmations: '~2 min',
  },
  BTC: {
    name: 'Bitcoin',
    icon: '🟠',
    addressPrefix: ['1', '3', 'bc1'],
    addressLength: [26, 62],
    explorer: 'https://blockchair.com/bitcoin/address/',
    confirmations: '~10 min',
  },
  ETH: {
    name: 'Ethereum',
    icon: '💎',
    addressPrefix: '0x',
    addressLength: 42,
    explorer: 'https://etherscan.io/address/',
    confirmations: '~2 min',
  },
  SOL: {
    name: 'Solana',
    icon: '🟣',
    addressPrefix: '',
    addressLength: [32, 44],
    explorer: 'https://solscan.io/account/',
    confirmations: '~1 sec',
  },
  ICP: {
    name: 'Internet Computer',
    icon: '🔷',
    addressPrefix: '',
    addressLength: [27, 63],
    explorer: 'https://dashboard.internetcomputer.org/account/',
    confirmations: '~2 sec',
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
