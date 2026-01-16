import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { NetworkType, ValidationResult } from '../types'
import { NETWORKS } from './constants'

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format MYR currency
export function formatMYR(amount: number | string): string {
  return `RM ${Number(amount).toFixed(2)}`
}

// Format crypto amount
export function formatCrypto(amount: number, decimals = 6): string {
  return Number(amount).toFixed(decimals)
}

// Generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `CK${timestamp}${random}`
}

// Format date for display
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// Validate wallet address based on network
export function validateWalletAddress(
  address: string,
  network: NetworkType
): ValidationResult {
  const networkConfig = NETWORKS[network]
  if (!networkConfig) {
    return { valid: false, error: 'Invalid network' }
  }

  const trimmedAddress = address.trim()

  if (networkConfig.addressPrefix === 'T') {
    // TRC-20 validation
    if (!trimmedAddress.startsWith('T')) {
      return { valid: false, error: 'TRC-20 address must start with T' }
    }
    if (trimmedAddress.length !== 34) {
      return { valid: false, error: 'TRC-20 address must be 34 characters' }
    }
  } else if (networkConfig.addressPrefix === '0x') {
    // EVM-based validation (BEP-20, ERC-20, Polygon)
    if (!trimmedAddress.startsWith('0x')) {
      return { valid: false, error: `${network} address must start with 0x` }
    }
    if (trimmedAddress.length !== 42) {
      return { valid: false, error: `${network} address must be 42 characters` }
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      return { valid: false, error: 'Invalid address format' }
    }
  }

  return { valid: true }
}

// Truncate address for display
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) {
    return address
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
