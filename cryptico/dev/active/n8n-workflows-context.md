# N8N Workflows - Context Documentation

**Last Updated:** 2026-01-16 4:45 PM MYT
**Status:** ✅ ALL WORKFLOWS DEPLOYED & TESTED

## Current Implementation State

### Completed ✅
- All 7 Cryptico n8n workflows converted from Supabase to PostgreSQL
- All workflows (wf-01 through wf-06) tested and verified working
- Database schema updated for new coins
- Credential IDs updated in all workflow JSON files

### Workflow Test Results

| Workflow | Test Status | Notes |
|----------|-------------|-------|
| wf-01-price-feed | ✅ Active | Schedule-based, running every 5 min |
| wf-02-order-submit | ✅ Tested | Creates orders, sends Telegram notification |
| wf-03-status-update | ✅ Tested | Approve/reject/complete orders |
| wf-04-order-lookup | ✅ Tested | Uses `?id=ORDERID` (not path params) |
| wf-05-admin-orders | ✅ Tested | Returns paginated order list |
| wf-06-admin-stats | ✅ Tested | Returns dashboard statistics |
| wf-07-error-handler | ⏸️ Inactive | Error workflow (activate when needed) |

## N8N Server Details
- **SSH:** `ssh root@45.159.230.42 -p 1511`
- **PM2 Process:** `alumist-n8n` (id 16)
- **URL:** `https://alumist.alumga.com`
- **Project:** `CcNtl9Ch6q6lBF14`
- **Folder:** `RxsaUrL1CV9ey1qX` (Cryptico)

## API Endpoints

| Endpoint | Method | Auth Header | Description |
|----------|--------|-------------|-------------|
| `/webhook/order/submit` | POST | X-API-Key | Create new order |
| `/webhook/order/status` | POST | X-Admin-Key | Update order status |
| `/webhook/order/lookup?id=` | GET | None | Customer order lookup |
| `/webhook/admin/orders` | GET | X-Admin-Key | List all orders |
| `/webhook/admin/stats` | GET | X-Admin-Key | Dashboard stats |

## Authentication Keys

| Header | Value |
|--------|-------|
| `X-API-Key` | `77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad5c5165d` |
| `X-Admin-Key` | `7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d` |

## N8N Credential IDs

| Credential | ID | Type |
|------------|-----|------|
| Cryptico PostgreSQL | `XBVFwEM8RKk32yyj` | postgres |
| Cryptico API Key | `B9IPRA0h6bahkCwZ` | httpHeaderAuth |
| Cryptico Admin Key | `L7j6V9fwqAW2mVNn` | httpHeaderAuth |

## Database

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | `cryptico_kiosk` |
| User | `alumist` |
| Password | `TVw2xISldsFov7O5ksjr7SYYwazR4if` |
| RLS | Disabled |

### Tables
- `crypto_prices` - Current prices for 6 coins
- `orders` - Customer orders with status tracking

## Key Decisions Made This Session

1. **Path parameters not supported** - n8n deployment doesn't match `:param` style webhooks
   - Fix: wf-04 changed from `/order/lookup/:orderId` to `/order/lookup?id=ORDERID`

2. **PostgreSQL credential missing host** - Credential only had database, user, password
   - Fix: Updated credential data to include `host: localhost`

3. **idempotency_key required** - Orders table has NOT NULL constraint
   - Fix: wf-02 now generates idempotency_key in order generation node

4. **55-format-response node reference** - Was reading from wrong input ($json.order)
   - Fix: Changed to `$('30-format-telegram').first().json.order`

5. **Database CHECK constraints** - Old constraints had BNB/MATIC, not new coins
   - Fix: Updated via postgres superuser to support BTC/ETH/SOL/ICP

## Files Modified This Session

| File | Changes |
|------|---------|
| `wf-02-order-submit.json` | Added idempotency_key, fixed response node reference, updated credentials |
| `wf-03-status-update.json` | Fixed IF v2 syntax, updated credentials, fixed network explorers |
| `wf-04-order-lookup.json` | Changed from path params to query params |
| `wf-05-admin-orders.json` | Updated credentials |
| `wf-06-admin-stats.json` | Updated credentials |
| `wf-07-error-handler.json` | Updated credentials |

## Issues Discovered & Fixed

1. **wf-04 webhook 404** - Parameterized paths not matching
   - Root cause: n8n webhook router doesn't match `:orderId` style paths
   - Fix: Changed to query parameter `?id=`

2. **wf-02 returning empty response** - `55-format-response` reading wrong data
   - Root cause: After Telegram node, `$json` contains Telegram API response
   - Fix: Explicitly reference `$('30-format-telegram').first().json.order`

3. **wf-06 returning empty** - PostgreSQL node query working but no orders
   - Root cause: Database had 0 orders initially
   - Fix: Inserted test order, now returns data correctly

4. **PostgreSQL credential "Database not ready"** - Missing host in credential
   - Root cause: n8n encrypted credential didn't include host field
   - Fix: Re-encrypted credential with all fields (host, database, user, password)

## Next Steps

1. **Connect frontend to n8n webhooks** - Update React app API calls
2. **Update frontend coins** - Ensure UI shows BTC, ETH, SOL, ICP, USDT, USDC
3. **Add error handling to frontend** - Handle API errors gracefully
4. **Test complete user flow** - Order submission through completion

## Test Commands

```bash
# Test order lookup
curl -s "https://alumist.alumga.com/webhook/order/lookup?id=CKMKGM9FF1THJ" | jq .

# Test admin stats
curl -s "https://alumist.alumga.com/webhook/admin/stats" \
  -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d" | jq .

# Test admin orders
curl -s "https://alumist.alumga.com/webhook/admin/orders" \
  -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d" | jq .

# Test order submit (with current timestamp)
NOW_MS=$(($(date +%s) * 1000)) && curl -s -X POST "https://alumist.alumga.com/webhook/order/submit" \
  -H "X-API-Key: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad5c5165d" \
  -H "Content-Type: application/json" \
  -d '{"crypto":"ETH","network":"ERC-20","amountMYR":100,"customerName":"Test","contactType":"email","contact":"test@test.com","walletAddress":"0x1234567890123456789012345678901234567890","rateLockTimestamp":'$NOW_MS',"currentRate":13711.52,"baseRate":13442.67}' | jq .
```

## VPS Environment Variables

```bash
# /home/n8n/.env (relevant entries)
CRYPTICO_DB_HOST=localhost
CRYPTICO_DB_PORT=5432
CRYPTICO_DB_NAME=cryptico_kiosk
CRYPTICO_DB_USER=alumist
CRYPTICO_DB_PASSWORD=TVw2xISldsFov7O5ksjr7SYYwazR4if
CRYPTICO_TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN_REDACTED
CRYPTICO_TELEGRAM_CHAT_ID=5426763403
CRYPTICO_API_KEY=77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e
CRYPTICO_ADMIN_KEY=7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d
CRYPTICO_RATE_MARKUP_PERCENT=2
```

## Updating Workflows via Python

When shell escaping issues occur, use Python to update workflows:

```python
# On VPS: ssh root@45.159.230.42 -p 1511
python3 << PYTHON
import json
import psycopg2

with open("/tmp/wf-XX-workflow.json", "r") as f:
    wf = json.load(f)

conn = psycopg2.connect(
    host="localhost",
    database="alumist_n8n",
    user="alumist",
    password="TVw2xISldsFov7O5ksjr7SYYwazR4if"
)
cur = conn.cursor()

cur.execute("""
    UPDATE n8n.workflow_entity
    SET nodes = %s::jsonb, connections = %s::jsonb
    WHERE id = %s
""", (json.dumps(wf["nodes"]), json.dumps(wf["connections"]), "WORKFLOW_ID"))

conn.commit()
print(f"Updated {cur.rowcount} rows")
PYTHON

# Then restart n8n
pm2 restart 16
```
