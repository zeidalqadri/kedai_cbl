# CBL Popshop Session Handoff - January 19, 2026

**Last Updated:** 2026-01-19 5:35 PM MYT

## Current State

### What's Working
- ✅ Frontend fully built and compiles (`npm run build` passes)
- ✅ Dev server runs at `http://localhost:3001`
- ✅ Database table `popshop_orders` created on VPS PostgreSQL
- ✅ Permissions granted to `alumist` user
- ✅ Telegram bot created and tested (@CBLPopshopBot)
- ✅ n8n workflows imported (5 workflows)
- ✅ Admin credential configured with X-Admin-Key header

### Current Blocker: n8n Workflows Return Empty
**Symptom:** All webhook endpoints return HTTP 200 but empty body

**Investigation Done:**
1. Auth passes (no "Authorization wrong" error)
2. Database table exists with correct schema
3. Permission error was found and fixed (GRANT ALL to alumist)
4. Still returning empty after permission fix

**Next Step:** Check n8n execution logs for new error after permission fix

## Infrastructure Details

### VPS Access
```bash
ssh root@45.159.230.42 -p 1511
```

### PostgreSQL on VPS
- Host: localhost
- Database: cryptico_kiosk
- User: alumist
- Table: popshop_orders

To run queries:
```bash
ssh root@45.159.230.42 -p 1511 "sudo -u postgres psql -d cryptico_kiosk -c 'YOUR QUERY HERE'"
```

### n8n Instance
- URL: https://alumist.alumga.com
- Workflows: CBL-Popshop-01 through 05

### Telegram Bot
- Bot: @CBLPopshopBot
- Token: TELEGRAM_BOT_TOKEN_REDACTED
- Chat ID: 5426763403
- n8n env vars needed:
  - POPSHOP_TELEGRAM_BOT_TOKEN
  - POPSHOP_TELEGRAM_CHAT_ID

### API Keys (in .env)
- VITE_API_KEY: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e
- VITE_ADMIN_API_KEY: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d

### n8n Credentials Used
- PostgreSQL: "Cryptico PostgreSQL" (ID: XBVFwEM8RKk32yyj)
- Admin Auth: "Cryptico Admin Key" (ID: L7j6V9fwqAW2mVNn) - Header: X-Admin-Key
- API Auth: "Cryptico API Key" (ID: B9IPRA0h6bahkCwZ) - Header: X-Api-Key

## Endpoint Testing Commands

```bash
# Order lookup (public)
curl -s "https://alumist.alumga.com/webhook/popshop/order/lookup?order_id=PS1A2B3C"

# Admin stats
curl -s "https://alumist.alumga.com/webhook/popshop/admin/stats" -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d"

# Admin orders
curl -s "https://alumist.alumga.com/webhook/popshop/admin/orders" -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d"

# Order submit
curl -s -X POST "https://alumist.alumga.com/webhook/popshop/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e" \
  -d '{"items":[{"productId":"cbl-jingga-tshirt","productName":"CBL Jingga T-Shirt","size":"L","quantity":1,"price":89}],"subtotal":89,"shippingFee":0,"total":89,"customer":{"name":"Test","phone":"0123456789","email":"test@test.com","address":{"line1":"123 St","city":"KL","state":"Kuala Lumpur","postcode":"50000"}},"paymentRef":"TEST1"}'
```

## Key Files Modified This Session

### Workflow JSONs (popshop_n8n/)
- wf-01-order-submit.json - Changed to POPSHOP_TELEGRAM_* env vars, PS order prefix
- wf-02-order-lookup.json - Simplified query, fixed column names
- wf-03-status-update.json - Updated credential ID to L7j6V9fwqAW2mVNn
- wf-04-admin-orders.json - Updated credential ID, simplified query
- wf-05-admin-stats.json - Updated credential ID, fixed column names

### Frontend Files
- src/types/index.ts - OrderStatus updated: confirmed/delivered instead of paid/completed
- src/lib/api.ts - Updated response handling for n8n success field
- src/lib/utils.ts - Order ID prefix changed to PS
- src/components/admin/AdminDashboard.tsx - Added courier selection, updated status flow

## Immediate Next Steps

1. **Check n8n execution logs** - User needs to check for new error after permission fix
2. **If still failing** - May need to check:
   - Are workflows activated (green toggle)?
   - Do workflows need to be re-imported after credential changes?
   - Is there a different node failing now?

3. **Once endpoints work** - Test complete flow:
   - Submit test order
   - Verify Telegram notification
   - Test admin dashboard
   - Test order lookup

## Dev Server Status
Background task bf07bf1 running `npm run dev` - server at localhost:3001

## Uncommitted Changes
All changes are uncommitted. Run `git status` to see full list.
Key directories with changes:
- src/ (all frontend code)
- popshop_n8n/ (workflow JSONs)
- public/ (images, favicon)
- Config files (package.json, vite.config.ts, etc.)
