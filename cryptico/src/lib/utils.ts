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
  const { addressPrefix, addressLength } = networkConfig

  // Check length
  if (Array.isArray(addressLength)) {
    const [minLen, maxLen] = addressLength
    if (trimmedAddress.length < minLen || trimmedAddress.length > maxLen) {
      return { valid: false, error: `${network} address must be ${minLen}-${maxLen} characters` }
    }
  } else if (addressLength && trimmedAddress.length !== addressLength) {
    return { valid: false, error: `${network} address must be ${addressLength} characters` }
  }

  // Check prefix
  if (addressPrefix) {
    if (Array.isArray(addressPrefix)) {
      // Multiple valid prefixes (e.g., BTC: 1, 3, bc1)
      const hasValidPrefix = addressPrefix.some(p => trimmedAddress.startsWith(p))
      if (!hasValidPrefix) {
        return { valid: false, error: `${network} address must start with ${addressPrefix.join(' or ')}` }
      }
    } else if (addressPrefix && !trimmedAddress.startsWith(addressPrefix)) {
      return { valid: false, error: `${network} address must start with ${addressPrefix}` }
    }
  }

  // Additional EVM validation (hex characters)
  if (addressPrefix === '0x') {
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      return { valid: false, error: 'Invalid address format' }
    }
  }

  // SOL validation (base58 characters)
  if (network === 'SOL') {
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmedAddress)) {
      return { valid: false, error: 'Invalid Solana address format (base58 only)' }
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
