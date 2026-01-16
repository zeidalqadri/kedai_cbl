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
import { orderStorage } from '../lib/storage'
import { notifyNewOrder } from '../lib/telegram'
import { generateOrderId, validateWalletAddress } from '../lib/utils'

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
    const newOrderId = generateOrderId()
    setOrderId(newOrderId)
    setScreen('payment')
  }, [userDetails, selectedNetwork])

  const submitPaymentProof = useCallback(async () => {
    if (!paymentRef.trim() && !paymentProof) {
      setError('Please provide payment reference or upload screenshot')
      return
    }
    if (!selectedCrypto || !selectedNetwork) return

    setError('')

    const order: Order = {
      id: orderId,
      crypto: selectedCrypto,
      network: selectedNetwork,
      amountMYR: parseFloat(amount),
      amountCrypto: cryptoAmount,
      networkFee: networkFee,
      rate: prices[selectedCrypto]!,
      customer: { ...userDetails },
      paymentRef: paymentRef,
      hasProofImage: !!paymentProof,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setCurrentOrder(order)
    await orderStorage.add(order)
    await notifyNewOrder(order, paymentProof || undefined)
    setScreen('processing')
  }, [
    paymentRef,
    paymentProof,
    selectedCrypto,
    selectedNetwork,
    orderId,
    amount,
    cryptoAmount,
    networkFee,
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

    const order = await orderStorage.getById(lookupOrderId.trim().toUpperCase())
    setLookupResult(order)
    setLookupLoading(false)

    if (!order) {
      setError('Order not found')
    }
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
