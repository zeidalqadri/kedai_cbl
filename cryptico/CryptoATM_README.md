# CryptoKiosk - Complete Crypto ATM System

A browser-based crypto ATM for selling USDT, USDC, BNB, and MATIC via DuitNow QR payment with Telegram notifications and admin dashboard.

## Features

### Customer Kiosk
- **4 Cryptocurrencies**: USDT, USDC, BNB, MATIC
- **4 Networks**: TRC-20, BEP-20 (BSC), ERC-20, Polygon
- **Live Prices**: Real-time rates from CoinGecko with configurable markup
- **Rate Lock**: 5-minute rate guarantee during transaction
- **DuitNow Payment**: Scan QR code with any Malaysian banking app
- **Payment Verification**: Reference number or screenshot upload
- **Order Tracking**: Customers can check their order status anytime

### Admin Dashboard
- **Order Management**: View, approve, reject orders
- **Status Updates**: Mark orders as completed with TX hash
- **Statistics**: Today's volume, pending count, totals
- **Filtering**: Filter by status (pending, approved, completed, rejected)
- **Telegram Notifications**: Automatic alerts for new orders
- **Wallet Copy**: One-click copy of customer wallet addresses

### Technical
- **Persistent Storage**: Orders saved across sessions
- **Wallet Validation**: Validates address format per network
- **Responsive Design**: Works on desktop and mobile
- **No Backend Required**: Runs entirely in browser with Claude's storage API

---

## Quick Setup (3 Steps)

### Step 1: Create Telegram Bot

1. Open Telegram, search for **@BotFather**
2. Send `/newbot` and follow prompts
3. Copy the **API token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID

1. Search for **@userinfobot** on Telegram
2. Send `/start`
3. Copy your **numeric ID** (looks like `123456789`)

### Step 3: Configure the App

Edit the `CONFIG` object at the top of the file:

```javascript
const CONFIG = {
  // Paste your bot token here
  telegramBotToken: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
  
  // Paste your chat ID here
  telegramChatId: '123456789',
  
  // Your DuitNow QR code (base64 string or URL)
  duitNowQrImage: 'https://your-qr-code-url.png',
  // OR paste base64: 'data:image/png;base64,iVBORw0KGgo...'
  
  // Your business info
  businessName: 'YourKiosk',
  supportTelegram: '@your_handle',
  
  // Admin password
  adminPassword: 'your_secure_password',
};
```

---

## How It Works

### Customer Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  1. SELECT  │────▶│  2. CHOOSE  │────▶│  3. ENTER   │
│   CRYPTO    │     │   NETWORK   │     │   AMOUNT    │
│ USDT/USDC/  │     │ TRC-20/BEP  │     │  RM 50-10K  │
│  BNB/MATIC  │     │  ERC/POLY   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
       ┌───────────────────────────────────────┘
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  4. ENTER   │────▶│  5. SCAN    │────▶│  6. SUBMIT  │
│  DETAILS    │     │  DUITNOW    │     │   PROOF     │
│ Name/Contact│     │     QR      │     │  Ref/Image  │
│   Wallet    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  7. WAIT    │
                                        │  APPROVAL   │
                                        └─────────────┘
```

### Admin Flow

1. **Receive Telegram Alert** → New order notification with all details
2. **Check Payment** → Verify in your banking app
3. **Approve/Reject** → Via admin dashboard
4. **Send Crypto** → From your wallet to customer's address
5. **Mark Complete** → Enter TX hash in dashboard

---

## Accessing Admin Dashboard

**Method 1: Long Press**
- On the kiosk welcome screen, press and hold the logo for 3+ seconds

**Method 2: Direct URL**
- The app has two modes, switch via code if needed

**Default Password**: `admin123` (change this!)

---

## Network Fees

| Network | Fee (MYR) | Confirmation |
|---------|-----------|--------------|
| TRC-20  | RM 1.00   | ~1 min       |
| BEP-20  | RM 2.50   | ~15 sec      |
| POLYGON | RM 0.50   | ~5 sec       |
| ERC-20  | RM 15.00  | ~2 min       |

---

## Telegram Notification Format

When a new order comes in:

```
🔔 NEW CRYPTO ORDER

📋 Order ID: CKL4NXYZ123
💰 Amount Paid: RM 500.00
🪙 Crypto: 111.2358 USDT
📍 Network: TRC-20
💸 Network Fee: RM 1.00

👤 Customer:
├ Name: Ahmad Ali
├ Telegram: @ahmadali
└ Wallet: TQn7...x9Kp

💳 Payment Ref: 2025011512345678
📅 Time: 15 Jan 2026, 2:30 PM

⏳ Status: Awaiting verification
```

---

## Configuration Options

```javascript
const CONFIG = {
  // Telegram (required)
  telegramBotToken: 'YOUR_BOT_TOKEN',
  telegramChatId: 'YOUR_CHAT_ID',
  
  // Business
  businessName: 'CryptoKiosk',
  businessTagline: 'Buy crypto instantly with DuitNow',
  supportTelegram: '@your_support',
  supportEmail: 'support@example.com',
  
  // Your QR code
  duitNowQrImage: null, // URL or base64
  
  // Limits
  minAmount: 50,      // Minimum MYR
  maxAmount: 10000,   // Maximum MYR
  
  // Pricing
  rateMarkup: 0.02,         // 2% above market
  rateLockDuration: 300,    // 5 minutes
  
  // Admin
  adminPassword: 'admin123',
};
```

---

## Wallet Address Validation

The system validates wallet addresses based on network:

| Network | Prefix | Length | Example |
|---------|--------|--------|---------|
| TRC-20  | T      | 34     | `TQn7...` |
| BEP-20  | 0x     | 42     | `0x742...` |
| ERC-20  | 0x     | 42     | `0x742...` |
| POLYGON | 0x     | 42     | `0x742...` |

---

## Order Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting admin verification |
| `approved` | Payment verified, crypto being sent |
| `completed` | Crypto sent, TX hash recorded |
| `rejected` | Payment not verified |

---

## Security Notes

1. **Change Admin Password** - Don't use the default
2. **Verify Payments** - Always check your bank before approving
3. **Keep Bot Token Secret** - Don't share your Telegram bot token
4. **Rate Limiting** - CoinGecko API has limits; cached fallback rates used if exceeded

---

## Customization Ideas

- Add more cryptocurrencies (edit `CRYPTO_ASSETS`)
- Adjust network fees (edit `CONFIG.networkFees`)
- Change rate markup (edit `CONFIG.rateMarkup`)
- Add referral system
- Integrate with exchange API for auto-sending
- Add KYC verification step for large amounts

---

## Support

For issues or questions, the support contact configured in the app will be shown to customers.

---

*Built for ZetVest regional expansion project*
