import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  CryptoSymbol,
  NetworkType,
  KioskScreen,
  PriceMap,
  UserDetails,
  Order,
} from '../types'
import { config } from '../config'
import { CRYPTO_ASSETS } from '../lib/constants'
import { fetchPrices, PRICE_REFRESH_INTERVAL, calculateCryptoAmount } from '../lib/prices'
import { orderApi } from '../lib/api'
import { validateWalletAddress } from '../lib/utils'

interface UseKioskReturn {
  // Screen state
  screen: KioskScreen
  setScreen: (screen: KioskScreen) => void

  // Selection state
  selectedCrypto: CryptoSymbol | null
  selectedNetwork: NetworkType | null
  amount: string
  setAmount: (amount: string) => void

  // Prices
  prices: PriceMap
  pricesLoading: boolean

  // Rate lock
  rateLockTime: number | null
  rateLockRemaining: number

  // User details
  userDetails: UserDetails
  setUserDetails: (details: UserDetails) => void

  // Order
  orderId: string
  currentOrder: Order | null

  // Payment
  paymentProof: string | null
  setPaymentProof: (proof: string | null) => void
  paymentRef: string
  setPaymentRef: (ref: string) => void

  // Lookup
  lookupOrderId: string
  setLookupOrderId: (id: string) => void
  lookupResult: Order | null
  lookupLoading: boolean

  // Error
  error: string
  setError: (error: string) => void

  // Computed
  networkFee: number
  cryptoAmount: number

  // Actions
  selectCrypto: (crypto: CryptoSymbol) => void
  selectNetwork: (network: NetworkType) => void
  submitAmount: () => void
  submitDetails: () => void
  submitPaymentProof: () => Promise<void>
  lookupOrder: () => Promise<void>
  resetFlow: () => void
}

const initialUserDetails: UserDetails = {
  name: '',
  contactType: 'telegram',
  contact: '',
  walletAddress: '',
}

export function useKiosk(): UseKioskReturn {
  // Screen state
  const [screen, setScreen] = useState<KioskScreen>('welcome')

  // Selection state
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoSymbol | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType | null>(null)
  const [amount, setAmount] = useState('')

  // Prices
  const [prices, setPrices] = useState<PriceMap>({})
  const [pricesLoading, setPricesLoading] = useState(true)

  // Rate lock
  const [rateLockTime, setRateLockTime] = useState<number | null>(null)

  // User details
  const [userDetails, setUserDetails] = useState<UserDetails>(initialUserDetails)

  // Order
  const [orderId, setOrderId] = useState('')
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)

  // Payment
  const [paymentProof, setPaymentProof] = useState<string | null>(null)
  const [paymentRef, setPaymentRef] = useState('')

  // Lookup
  const [lookupOrderId, setLookupOrderId] = useState('')
  const [lookupResult, setLookupResult] = useState<Order | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Error
  const [error, setError] = useState('')

  // Fetch prices
  useEffect(() => {
    const loadPrices = async () => {
      setPricesLoading(true)
      const p = await fetchPrices()
      setPrices(p)
      setPricesLoading(false)
    }
    loadPrices()
    const interval = setInterval(loadPrices, PRICE_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Rate lock countdown
  const rateLockRemaining = useMemo(() => {
    if (!rateLockTime) return 0
    return Math.max(0, Math.floor((rateLockTime - Date.now()) / 1000))
  }, [rateLockTime])

  useEffect(() => {
    if (!rateLockTime) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, rateLockTime - Date.now())
      if (remaining === 0) {
        setRateLockTime(null)
        if (screen !== 'welcome' && screen !== 'lookup') {
          setError('Rate lock expired. Please restart.')
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [rateLockTime, screen])

  // Computed values
  const networkFee = selectedNetwork ? config.networkFees[selectedNetwork] || 0 : 0

  const cryptoAmount = useMemo(() => {
    if (!selectedCrypto || !amount || !prices[selectedCrypto]) return 0
    return calculateCryptoAmount(parseFloat(amount), networkFee, prices[selectedCrypto]!)
  }, [selectedCrypto, amount, prices, networkFee])

  // Actions
  const resetFlow = useCallback(() => {
    setScreen('welcome')
    setSelectedCrypto(null)
    setSelectedNetwork(null)
    setAmount('')
    setUserDetails(initialUserDetails)
    setOrderId('')
    setCurrentOrder(null)
    setPaymentProof(null)
    setPaymentRef('')
    setError('')
    setRateLockTime(null)
  }, [])

  const selectCrypto = useCallback((crypto: CryptoSymbol) => {
    setSelectedCrypto(crypto)
    const networks = CRYPTO_ASSETS[crypto].networks
    if (networks.length === 1) {
      setSelectedNetwork(networks[0])
      setScreen('amount')
    } else {
      setScreen('network')
    }
  }, [])

  const selectNetwork = useCallback((network: NetworkType) => {
    setSelectedNetwork(network)
    setScreen('amount')
  }, [])

  const submitAmount = useCallback(() => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < config.minAmount) {
      setError(`Minimum amount is RM ${config.minAmount}`)
      return
    }
    if (numAmount > config.maxAmount) {
      setError(`Maximum amount is RM ${config.maxAmount}`)
      return
    }
    if (numAmount <= networkFee) {
      setError(`Amount must be greater than network fee (RM ${networkFee})`)
      return
    }
    setError('')
    setRateLockTime(Date.now() + config.rateLockDuration * 1000)
    setScreen('details')
  }, [amount, networkFee])

  const submitDetails = useCallback(() => {
    if (!userDetails.name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!userDetails.contact.trim()) {
      setError('Please enter your contact')
      return
    }
    if (!userDetails.walletAddress.trim()) {
      setError('Please enter your wallet address')
      return
    }
    if (!selectedNetwork) return

    const validation = validateWalletAddress(userDetails.walletAddress, selectedNetwork)
    if (!validation.valid) {
      setError(validation.error || 'Invalid wallet address')
      return
    }

    setError('')
    setScreen('payment')
  }, [userDetails, selectedNetwork])

  const submitPaymentProof = useCallback(async () => {
    if (!paymentRef.trim() && !paymentProof) {
      setError('Please provide payment reference or upload screenshot')
      return
    }
    if (!selectedCrypto || !selectedNetwork || !rateLockTime) return

    setError('')

    // Calculate base rate (before markup)
    const currentRate = prices[selectedCrypto]!
    const baseRate = currentRate / (1 + config.rateMarkup / 100)

    // Submit order via API
    const result = await orderApi.create({
      crypto: selectedCrypto,
      network: selectedNetwork,
      amountMYR: parseFloat(amount),
      customerName: userDetails.name,
      contactType: userDetails.contactType,
      contact: userDetails.contact,
      walletAddress: userDetails.walletAddress,
      rateLockTimestamp: rateLockTime,
      currentRate: currentRate,
      baseRate: baseRate,
      paymentRef: paymentRef || undefined,
      proofImageBase64: paymentProof || undefined,
    })

    if (!result.success || !result.data) {
      setError(result.error || 'Failed to submit order')
      return
    }

    // Create local order object for UI
    const order: Order = {
      id: result.data.orderId,
      crypto: selectedCrypto,
      network: selectedNetwork,
      amountMYR: result.data.amountMYR,
      amountCrypto: result.data.amountCrypto,
      networkFee: result.data.networkFee,
      rate: result.data.rate,
      customer: { ...userDetails },
      paymentRef: paymentRef,
      hasProofImage: !!paymentProof,
      status: result.data.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setOrderId(result.data.orderId)
    setCurrentOrder(order)
    setScreen('processing')
  }, [
    paymentRef,
    paymentProof,
    selectedCrypto,
    selectedNetwork,
    rateLockTime,
    amount,
    prices,
    userDetails,
  ])

  const lookupOrder = useCallback(async () => {
    if (!lookupOrderId.trim()) {
      setError('Please enter an order ID')
      return
    }
    setError('')
    setLookupLoading(true)
    setLookupResult(null)

    const result = await orderApi.lookup(lookupOrderId.trim().toUpperCase())
    setLookupLoading(false)

    if (!result.success || !result.data) {
      setError(result.error || 'Order not found')
      return
    }

    // Convert API response to Order format
    const apiOrder = result.data.order
    const order: Order = {
      id: apiOrder.id,
      crypto: apiOrder.crypto,
      network: apiOrder.network,
      amountMYR: apiOrder.amountMYR,
      amountCrypto: apiOrder.amountCrypto,
      networkFee: apiOrder.networkFee,
      rate: apiOrder.rate,
      customer: {
        name: apiOrder.customerName,
        contactType: 'telegram', // Not returned from lookup
        contact: '', // Not returned from lookup
        walletAddress: apiOrder.walletAddress,
      },
      paymentRef: '',
      hasProofImage: false,
      status: apiOrder.status,
      txHash: apiOrder.txHash,
      createdAt: new Date(apiOrder.createdAt).getTime(),
      updatedAt: new Date(apiOrder.updatedAt).getTime(),
    }

    setLookupResult(order)
  }, [lookupOrderId])

  return {
    screen,
    setScreen,
    selectedCrypto,
    selectedNetwork,
    amount,
    setAmount,
    prices,
    pricesLoading,
    rateLockTime,
    rateLockRemaining,
    userDetails,
    setUserDetails,
    orderId,
    currentOrder,
    paymentProof,
    setPaymentProof,
    paymentRef,
    setPaymentRef,
    lookupOrderId,
    setLookupOrderId,
    lookupResult,
    lookupLoading,
    error,
    setError,
    networkFee,
    cryptoAmount,
    selectCrypto,
    selectNetwork,
    submitAmount,
    submitDetails,
    submitPaymentProof,
    lookupOrder,
    resetFlow,
  }
}
