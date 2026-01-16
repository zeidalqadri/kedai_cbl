import { config } from '../config.js'

interface TelegramResponse {
  ok: boolean
  result?: unknown
  description?: string
}

export async function sendTelegramNotification(message: string): Promise<boolean> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.warn('Telegram credentials not configured, skipping notification')
    return false
  }

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = (await response.json()) as TelegramResponse

    if (!data.ok) {
      console.error('Telegram API error:', data.description)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}

export function formatOrderNotification(order: {
  id: string
  crypto: string
  network: string
  amountMYR: number
  amountCrypto: number
  customerName: string
  walletAddress: string
  contactType: string
  contactValue: string
}): string {
  return `
🔔 <b>New Order Received</b>

📋 Order ID: <code>${order.id}</code>
💰 Amount: RM ${order.amountMYR.toFixed(2)}
🪙 Crypto: ${order.amountCrypto.toFixed(6)} ${order.crypto}
🌐 Network: ${order.network}

👤 Customer: ${order.customerName}
📞 Contact: ${order.contactType === 'telegram' ? '@' : ''}${order.contactValue}
💼 Wallet: <code>${order.walletAddress}</code>

⏳ Status: Pending verification
`.trim()
}

export function formatStatusUpdateNotification(order: {
  id: string
  status: string
  txHash?: string | null
}): string {
  const statusEmoji = {
    approved: '✅',
    completed: '🎉',
    rejected: '❌',
  }[order.status] || '📋'

  let message = `
${statusEmoji} <b>Order ${order.status.toUpperCase()}</b>

📋 Order ID: <code>${order.id}</code>
`.trim()

  if (order.txHash) {
    message += `\n🔗 TX Hash: <code>${order.txHash}</code>`
  }

  return message
}
