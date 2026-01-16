import type { Order, OrderStatus, TelegramResponse } from '../types'
import { config, isTelegramConfigured } from '../config'
import { NETWORKS } from './constants'
import { formatMYR, formatCrypto, formatDate } from './utils'

// Telegram Bot API integration
// In production, this should be moved to backend to protect bot token

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

// Send text message
export async function sendTelegramMessage(
  message: string,
  replyMarkup?: object
): Promise<TelegramResponse> {
  if (!isTelegramConfigured()) {
    console.log('📱 Telegram (demo):', message)
    return { ok: true, demo: true }
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: config.telegramChatId,
      text: message,
      parse_mode: 'HTML',
    }
    if (replyMarkup) {
      payload.reply_markup = JSON.stringify(replyMarkup)
    }

    const response = await fetch(
      `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    return await response.json()
  } catch (error) {
    console.error('Telegram error:', error)
    return { ok: false, error }
  }
}

// Send photo with caption
export async function sendTelegramPhoto(
  photoBase64: string,
  caption: string
): Promise<TelegramResponse> {
  if (!isTelegramConfigured()) {
    console.log('📷 Telegram photo (demo):', caption)
    return { ok: true, demo: true }
  }

  try {
    const formData = new FormData()
    const blob = await fetch(photoBase64).then((r) => r.blob())
    formData.append('chat_id', config.telegramChatId)
    formData.append('photo', blob, 'payment_proof.jpg')
    formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')

    const response = await fetch(
      `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendPhoto`,
      { method: 'POST', body: formData }
    )
    return await response.json()
  } catch (error) {
    console.error('Telegram photo error:', error)
    return { ok: false, error }
  }
}

// Format order notification message
export function formatOrderNotification(order: Order): string {
  return `
🔔 <b>NEW CRYPTO ORDER</b>

📋 <b>Order ID:</b> <code>${order.id}</code>
💰 <b>Amount Paid:</b> ${formatMYR(order.amountMYR)}
🪙 <b>Crypto:</b> ${formatCrypto(order.amountCrypto, 4)} ${order.crypto}
📍 <b>Network:</b> ${order.network}
💸 <b>Network Fee:</b> ${formatMYR(order.networkFee)}

👤 <b>Customer:</b>
├ Name: ${order.customer.name}
├ ${order.customer.contactType === 'telegram' ? 'Telegram' : 'Email'}: ${order.customer.contact}
└ Wallet: <code>${order.customer.walletAddress}</code>

💳 <b>Payment Ref:</b> ${order.paymentRef || 'Screenshot attached'}
📅 <b>Time:</b> ${formatDate(order.createdAt)}

⏳ <b>Status:</b> Awaiting verification
`.trim()
}

// Format status update message
export function formatStatusUpdate(
  order: Order,
  status: OrderStatus,
  txHash?: string
): string {
  const statusEmoji: Record<OrderStatus, string> = {
    approved: '✅',
    rejected: '❌',
    pending: '⏳',
    completed: '🎉',
  }

  let message = `
${statusEmoji[status] || '📋'} <b>ORDER ${status.toUpperCase()}</b>

📋 Order: <code>${order.id}</code>
👤 Customer: ${order.customer.name}
🪙 Amount: ${formatCrypto(order.amountCrypto, 4)} ${order.crypto}
`.trim()

  if (txHash) {
    const explorer = NETWORKS[order.network]?.explorer || ''
    message += `\n\n🔗 <b>TX Hash:</b> <a href="${explorer}${txHash}">${txHash.slice(0, 16)}...</a>`
  }

  return message
}

// Send new order notification
export async function notifyNewOrder(order: Order, paymentProof?: string): Promise<void> {
  const message = formatOrderNotification(order)
  await sendTelegramMessage(message)

  if (paymentProof) {
    await sendTelegramPhoto(paymentProof, `📋 Payment proof for order ${order.id}`)
  }
}

// Send status update notification
export async function notifyStatusUpdate(
  order: Order,
  status: OrderStatus,
  txHash?: string
): Promise<void> {
  const message = formatStatusUpdate(order, status, txHash)
  await sendTelegramMessage(message)
}
