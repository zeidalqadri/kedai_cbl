import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const CryptoSymbolSchema = z.enum(['USDT', 'USDC', 'BNB', 'MATIC'])
export const NetworkTypeSchema = z.enum(['TRC20', 'BEP20', 'ERC20', 'POLYGON'])
export const OrderStatusSchema = z.enum(['pending', 'approved', 'completed', 'rejected'])
export const ContactTypeSchema = z.enum(['telegram', 'email'])

// ============================================================================
// WALLET VALIDATION
// ============================================================================

const TRC20_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/
const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/

export function validateWalletAddress(address: string, network: string): boolean {
  switch (network) {
    case 'TRC20':
      return TRC20_REGEX.test(address)
    case 'BEP20':
    case 'ERC20':
    case 'POLYGON':
      return EVM_REGEX.test(address)
    default:
      return false
  }
}

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const CreateOrderSchema = z.object({
  crypto: CryptoSymbolSchema,
  network: NetworkTypeSchema,
  amountMYR: z.number().positive().min(50).max(5000),
  amountCrypto: z.number().positive(),
  networkFee: z.number().nonnegative(),
  rate: z.number().positive(),
  customerName: z.string().min(2).max(100),
  walletAddress: z.string().min(20).max(100),
  contactType: ContactTypeSchema,
  contactValue: z.string().min(3).max(100),
}).refine(
  (data) => validateWalletAddress(data.walletAddress, data.network),
  { message: 'Invalid wallet address for selected network', path: ['walletAddress'] }
)

export const UpdateOrderSchema = z.object({
  paymentRef: z.string().min(1).max(100).optional(),
  hasProofImage: z.boolean().optional(),
  proofImageUrl: z.string().url().optional(),
})

export const ApproveOrderSchema = z.object({
  orderId: z.string().cuid(),
})

export const RejectOrderSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().max(500).optional(),
})

export const CompleteOrderSchema = z.object({
  orderId: z.string().cuid(),
  txHash: z.string().min(10).max(100),
})

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
})

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const OrderQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'amountMYR']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const OrderLookupSchema = z.object({
  orderId: z.string().cuid(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>
