# Cryptico ATM - n8n Workflow Backbone

Complete backend orchestration system for the Cryptico ATM crypto kiosk platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Workflows](#workflows)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Deployment](#deployment)
6. [Testing & Debugging](#testing--debugging)
7. [API Reference](#api-reference)
8. [Error Handling](#error-handling)
9. [Scaling & Performance](#scaling--performance)
10. [Common Edge Cases](#common-edge-cases)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CRYPTICO ATM BACKEND                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │  Frontend   │                                                            │
│  │  (React)    │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         n8n WORKFLOWS                                │   │
│  │                                                                       │   │
│  │  WF-01: Price Feed ────── (5min cron)                                │   │
│  │  WF-02: Order Submit ──── POST /order/submit                         │   │
│  │  WF-03: Status Update ─── POST /order/status                         │   │
│  │  WF-04: Order Lookup ──── GET  /order/lookup/:id                     │   │
│  │  WF-05: Admin Orders ──── GET  /admin/orders                         │   │
│  │  WF-06: Admin Stats ───── GET  /admin/stats                          │   │
│  │  WF-07: Error Handler ─── (Error Trigger)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SUPABASE (PostgreSQL)                           │   │
│  │                                                                       │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │ crypto_prices │  │    orders     │  │   audit_log   │            │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │   │
│  │                                                                       │   │
│  │  ┌───────────────┐  ┌───────────────┐                                │   │
│  │  │   error_log   │  │    kiosks     │                                │   │
│  │  └───────────────┘  └───────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │  TELEGRAM BOT   │ ◄── Notifications & Alerts                             │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Workflows

### WF-01: Price Feed Service
**Trigger:** Scheduled (every 5 minutes)  
**Purpose:** Fetch crypto prices from CoinGecko, apply markup, store in database

**Flow:**
```
Cron → Fetch CoinGecko → Apply Markup → Upsert Supabase → [Error?] → Alert
```

**Key Features:**
- Fallback prices if API fails
- Configurable markup percentage
- Error alerting via Telegram

---

### WF-02: Order Submission
**Trigger:** Webhook `POST /order/submit`  
**Purpose:** Process new customer orders

**Input Schema:**
```json
{
  "crypto": "USDT",
  "network": "TRC-20",
  "amountMYR": 500,
  "customerName": "Ahmad Ali",
  "contactType": "telegram",
  "contact": "@ahmadali",
  "walletAddress": "TQn7...",
  "rateLockTimestamp": 1705312800000,
  "paymentRef": "2025011512345678",
  "proofImageBase64": "data:image/png;base64,..."
}
```

**Output Schema:**
```json
{
  "ok": true,
  "orderId": "CK1234ABCD",
  "status": "pending",
  "crypto": "USDT",
  "network": "TRC-20",
  "amountMYR": 500,
  "amountCrypto": 111.2358,
  "rate": 4.49,
  "networkFee": 1.00,
  "message": "Order submitted successfully",
  "trackingUrl": "/order/lookup/CK1234ABCD"
}
```

---

### WF-03: Status Update
**Trigger:** Webhook `POST /order/status`  
**Purpose:** Admin actions (approve/reject/complete/cancel)

**Input Schema:**
```json
{
  "orderId": "CK1234ABCD",
  "action": "approve",
  "txHash": "abc123...",
  "note": "Payment verified"
}
```

**Valid Transitions:**
| Current Status | Allowed Actions |
|----------------|-----------------|
| pending | approve, reject, cancel |
| approved | complete, cancel |
| completed | — |
| rejected | — |
| cancelled | — |

---

### WF-04: Order Lookup
**Trigger:** Webhook `GET /order/lookup/:orderId`  
**Purpose:** Customer order tracking (public endpoint)

**Sanitized Response:**
- Hides sensitive customer details
- Shows truncated wallet address
- Includes status display info

---

### WF-05: Admin Orders List
**Trigger:** Webhook `GET /admin/orders`  
**Purpose:** Paginated order listing with filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| crypto | string | Filter by crypto |
| dateFrom | ISO date | Start date |
| dateTo | ISO date | End date |
| kioskId | string | Filter by kiosk |
| limit | number | Max 100 |
| offset | number | Pagination offset |

---

### WF-06: Admin Stats Dashboard
**Trigger:** Webhook `GET /admin/stats`  
**Purpose:** Dashboard statistics

**Response includes:**
- Today's orders and volume
- This week's metrics
- This month's metrics
- All-time breakdowns by status/crypto
- Recent pending orders

---

### WF-07: Error Handler
**Trigger:** Error Trigger (catches all workflow errors)  
**Purpose:** Central error logging and alerting

**Actions:**
1. Format error details
2. Store in `error_log` table
3. Send Telegram alert to admin

---

## Environment Setup

### Required Environment Variables

```bash
# ============================================================================
# n8n Environment Variables for Cryptico ATM
# ============================================================================

# Database (Supabase)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjkl...
TELEGRAM_CHAT_ID=123456789
TELEGRAM_ADMIN_CHAT_ID=123456789

# API Security
API_SECRET_KEY=cryptico_sk_live_xxxxx
ADMIN_API_KEY=admin_xxxxx

# Business Configuration
BUSINESS_NAME=CryptoKiosk
RATE_MARKUP_PERCENT=2
RATE_LOCK_DURATION_SECONDS=300
MIN_AMOUNT_MYR=50
MAX_AMOUNT_MYR=10000

# Network Fees (MYR)
FEE_TRC20=1.00
FEE_BEP20=2.50
FEE_ERC20=15.00
FEE_POLYGON=0.50

# External APIs
COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

### n8n Credentials to Create

1. **Supabase API** - Create credential with:
   - Host: Your Supabase URL
   - Service Role Key: Your service role key

2. **Header Auth** - For webhook authentication:
   - Name: `X-API-Key`
   - Value: Reference `API_SECRET_KEY` environment variable

---

## Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the URL and keys

2. **Run Schema Migration**
   ```bash
   # Using Supabase CLI
   supabase db push --db-url postgresql://...

   # Or copy/paste database-schema.sql into SQL editor
   ```

3. **Enable Row Level Security** (already in schema)

4. **Test Connection**
   ```sql
   SELECT * FROM crypto_prices;
   ```

---

## Deployment

### Import Workflows

1. **Import Order:**
   - WF-07 (Error Handler) - First, as other workflows reference it
   - WF-01 (Price Feed)
   - WF-02 (Order Submit)
   - WF-03 (Status Update)
   - WF-04 (Order Lookup)
   - WF-05 (Admin Orders)
   - WF-06 (Admin Stats)

2. **Update Credential IDs:**
   - Replace `SUPABASE_CREDENTIAL_ID` with your actual credential ID
   - Update webhook IDs if needed

3. **Activate Workflows:**
   - Enable each workflow in n8n
   - WF-01 will start executing on schedule

### Webhook URLs

After activation, your endpoints will be:

| Endpoint | URL |
|----------|-----|
| Order Submit | `https://your-n8n.com/webhook/order/submit` |
| Status Update | `https://your-n8n.com/webhook/order/status` |
| Order Lookup | `https://your-n8n.com/webhook/order/lookup/:orderId` |
| Admin Orders | `https://your-n8n.com/webhook/admin/orders` |
| Admin Stats | `https://your-n8n.com/webhook/admin/stats` |

---

## Testing & Debugging

### Sample Test Payloads

**Order Submission:**
```bash
curl -X POST https://your-n8n.com/webhook/order/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "crypto": "USDT",
    "network": "TRC-20",
    "amountMYR": 100,
    "customerName": "Test User",
    "contactType": "telegram",
    "contact": "@testuser",
    "walletAddress": "TQn7...(valid 34-char address)",
    "rateLockTimestamp": '$(date +%s000)',
    "paymentRef": "TEST123456"
  }'
```

**Status Update:**
```bash
curl -X POST https://your-n8n.com/webhook/order/status \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_admin_key" \
  -d '{
    "orderId": "CK1234ABCD",
    "action": "approve"
  }'
```

**Order Lookup:**
```bash
curl https://your-n8n.com/webhook/order/lookup/CK1234ABCD
```

### Testing Checklist

- [ ] **WF-01:** Verify prices update every 5 minutes
- [ ] **WF-01:** Test fallback when CoinGecko is down
- [ ] **WF-02:** Valid order submission returns 201
- [ ] **WF-02:** Invalid wallet address returns 400
- [ ] **WF-02:** Expired rate lock returns 409
- [ ] **WF-02:** Telegram notification received
- [ ] **WF-03:** Approve pending order works
- [ ] **WF-03:** Invalid transition returns 409
- [ ] **WF-03:** Complete with TX hash works
- [ ] **WF-04:** Lookup returns sanitized data
- [ ] **WF-04:** Invalid ID returns 400
- [ ] **WF-05:** Admin auth required
- [ ] **WF-05:** Filters work correctly
- [ ] **WF-06:** Stats calculate correctly
- [ ] **WF-07:** Errors logged and alerted

### Debugging Tips

1. **Check Execution Logs:** n8n UI → Executions
2. **View Error Details:** Check `error_log` table
3. **Test Individual Nodes:** Use n8n's "Execute Node" feature
4. **Verify Environment Variables:** Settings → Environment Variables

---

## API Reference

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| INVALID_ID | 400 | Invalid order ID format |
| UNAUTHORIZED | 401 | Invalid or missing API key |
| NOT_FOUND | 404 | Order not found |
| INVALID_TRANSITION | 409 | Status change not allowed |
| RATE_LOCK_EXPIRED | 409 | Rate lock expired |
| INTERNAL_ERROR | 500 | Server error |

### Error Response Format

```json
{
  "ok": false,
  "error_code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": ["Missing required field: crypto"],
  "context": {
    "node": "05-validate-input",
    "receivedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## Error Handling

### Retry Policy

| Error Type | Retries | Backoff |
|------------|---------|---------|
| 429 (Rate Limit) | 3 | Exponential (2s, 5s, 15s) |
| 5xx (Server) | 3 | Exponential |
| 4xx (Client) | 0 | — |
| Timeout | 2 | Fixed (5s) |

### Dead Letter Handling

Failed orders after retries are:
1. Logged to `error_log` table
2. Alert sent via Telegram
3. Order marked for manual review

### Fallback Strategies

- **Price Feed:** Uses cached fallback rates
- **Telegram:** Errors logged, workflow continues
- **Database:** Errors trigger full workflow error

---

## Scaling & Performance

### Concurrency Settings

```yaml
# n8n configuration
EXECUTIONS_MODE: queue
EXECUTIONS_PROCESS: own
EXECUTIONS_CONCURRENCY: 10
```

### Batching Recommendations

- Order queries: Max 100 per request
- Price updates: All 4 coins in single request
- Telegram messages: Not batched (real-time)

### Caching Strategy

- **Prices:** 5-minute refresh, 1-minute cache header
- **Stats:** 60-second cache header
- **Orders:** No cache (always fresh)

### Performance Targets

| Metric | Target |
|--------|--------|
| Order submission | < 3s |
| Order lookup | < 500ms |
| Admin list | < 2s |
| Price update | < 5s |

---

## Common Edge Cases

### Handled Scenarios

1. **Rate Lock Expiry Mid-Flow**
   - Checked before order creation
   - Returns 409 with clear message

2. **Duplicate Order Submission**
   - Idempotency key prevents duplicates
   - Same key returns existing order

3. **Invalid Wallet Address**
   - Validated by network type
   - Specific error message returned

4. **CoinGecko Rate Limit**
   - Fallback to cached prices
   - Admin alerted via Telegram

5. **Telegram API Down**
   - Order still processed
   - Error logged silently

6. **Invalid Status Transition**
   - State machine validation
   - Returns current status and allowed actions

### Known Limitations

1. **No Real-Time Updates**
   - Customers poll for status
   - Consider WebSocket for future

2. **Single Admin Chat**
   - All notifications to one chat
   - Multi-chat requires workflow modification

3. **No Automatic Refunds**
   - Rejections require manual refund
   - Could integrate with payment provider

---

## Files Included

```
cryptico-atm-workflows/
├── wf-01-price-feed.json      # Price feed service
├── wf-02-order-submit.json    # Order submission handler
├── wf-03-status-update.json   # Admin status updates
├── wf-04-order-lookup.json    # Customer order lookup
├── wf-05-admin-orders.json    # Admin orders list
├── wf-06-admin-stats.json     # Admin dashboard stats
├── wf-07-error-handler.json   # Central error handling
├── database-schema.sql        # Supabase schema
└── README.md                  # This file
```

---

## Support

For issues or questions:
- Review execution logs in n8n
- Check error_log table in Supabase
- Verify environment variables are set

---

*Built for Cryptico ATM - ZetVest Regional Expansion*
