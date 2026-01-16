# N8N Workflows - Context Documentation

**Last Updated:** 2026-01-16 5:15 PM MYT
**Status:** ✅ BACKEND DEPLOYED | 🔄 FRONTEND INTEGRATION READY

## Current Implementation State

### Completed ✅
- All 7 Cryptico n8n workflows converted from Supabase to PostgreSQL
- All workflows (wf-01 through wf-06) tested and verified working
- Database schema updated for new coins (BTC, ETH, SOL, ICP, USDT, USDC)
- Credential IDs updated in all workflow JSON files
- **Frontend types/constants updated for new coins**
- **API client rewritten for n8n webhook integration**

### In Progress 🔄
- Frontend needs to be connected to live n8n backend (currently using localStorage)

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

## Frontend Changes (This Session)

### Modified Files

| File | Changes |
|------|---------|
| `src/types/index.ts` | Updated CryptoSymbol (BTC/ETH/SOL/ICP), NetworkType for native chains |
| `src/lib/constants.ts` | New CRYPTO_ASSETS, NETWORKS with multi-prefix address validation |
| `src/config/index.ts` | Added apiUrl, apiKey, adminApiKey for n8n webhooks |
| `src/lib/api.ts` | Complete rewrite for n8n webhook API (X-API-Key/X-Admin-Key auth) |
| `src/lib/utils.ts` | Updated address validation for BTC (26-62 chars), SOL (32-44), ICP |

### Key Type Changes

```typescript
// CryptoSymbol: 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'ICP'
// NetworkType: 'TRC-20' | 'ERC-20' | 'BTC' | 'ETH' | 'SOL' | 'ICP'

// Network.addressPrefix changed: string → string | string[]
// Network.addressLength changed: number → number | [number, number]
```

### Address Validation Rules

| Network | Prefix | Length |
|---------|--------|--------|
| TRC-20 | T | 34 |
| ERC-20 | 0x | 42 |
| BTC | 1, 3, bc1 | 26-62 |
| ETH | 0x | 42 |
| SOL | (base58) | 32-44 |
| ICP | (principal) | 27-63 |

## Key Decisions Made

1. **Path parameters not supported** - n8n deployment doesn't match `:param` style webhooks
   - Fix: wf-04 changed from `/order/lookup/:orderId` to `/order/lookup?id=ORDERID`

2. **Multi-prefix address validation** - Bitcoin addresses can start with 1, 3, or bc1
   - Fix: Changed Network.addressPrefix from string to `string | string[]`

3. **Variable length validation** - BTC, SOL, ICP have range-based lengths
   - Fix: Changed Network.addressLength from number to `number | [number, number]`

4. **API authentication model** - n8n webhooks use header-based auth
   - X-API-Key for public order submissions
   - X-Admin-Key for admin operations
   - No JWT/sessions needed

## Next Steps (Priority Order)

1. **Wire up frontend to API** - Replace localStorage calls in `useKiosk.ts` with API client
2. **Test complete order flow** - Submit order via UI, verify in database
3. **Add loading states** - Show spinners during API calls
4. **Add error handling UI** - User-friendly API error messages
5. **Deploy frontend** - Configure production environment variables

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

# Test order submit
NOW_MS=$(($(date +%s) * 1000)) && curl -s -X POST "https://alumist.alumga.com/webhook/order/submit" \
  -H "X-API-Key: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad5c5165d" \
  -H "Content-Type: application/json" \
  -d '{"crypto":"ETH","network":"ERC-20","amountMYR":100,"customerName":"Test","contactType":"email","contact":"test@test.com","walletAddress":"0x1234567890123456789012345678901234567890","rateLockTimestamp":'$NOW_MS',"currentRate":13711.52,"baseRate":13442.67}' | jq .
```

## Handoff Notes for Next Session

### Current State
- Backend: ✅ Fully deployed and tested
- Frontend: 🔄 Types/constants/API client updated, NOT yet connected

### What Needs Doing
1. Open `src/hooks/useKiosk.ts` - replace `storage.saveOrder()` calls with `api.submitOrder()`
2. Open `src/components/admin/AdminDashboard.tsx` - replace localStorage with API calls
3. Update `src/components/kiosk/screens/LookupScreen.tsx` - use `api.lookupOrder()`

### Files to Focus On
- `src/hooks/useKiosk.ts` - Main state hook, needs API integration
- `src/components/admin/AdminDashboard.tsx` - Admin panel, needs API integration
- `src/lib/storage.ts` - Current localStorage implementation (to be replaced)

### Environment Variables Needed for Production
```bash
VITE_API_URL=https://alumist.alumga.com/webhook
VITE_API_KEY=77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad5c5165d
VITE_ADMIN_API_KEY=7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d
```
