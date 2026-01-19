// Utility functions for CBL Popshop

// Format Malaysian Ringgit
export function formatMYR(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return 'RM 0.00'
  return `RM ${num.toFixed(2)}`
}

// Generate order ID (PS prefix for PopShop)
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PS${timestamp}${random}`.substring(0, 10)
}

// Validate Malaysian phone number
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // Malaysian mobile: 01X-XXX XXXX (10-11 digits)
  // Format: +60 or 60 or 0 followed by 1X...
  const mobileRegex = /^(\+?6?0?)1[0-9]{8,9}$/

  if (!mobileRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'Please enter a valid Malaysian mobile number (e.g., 012-345 6789)'
    }
  }

  return { valid: true }
}

// Validate email
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  return { valid: true }
}

// Validate postcode (Malaysian: 5 digits)
export function validatePostcode(postcode: string): { valid: boolean; error?: string } {
  const postcodeRegex = /^\d{5}$/

  if (!postcodeRegex.test(postcode)) {
    return { valid: false, error: 'Please enter a valid 5-digit postcode' }
  }

  return { valid: true }
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // Format: 012-345 6789
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  }

  return phone
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Class name combiner (re-exported from ui-primitives for convenience)
export const cx = (...classes: (string | boolean | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ')
