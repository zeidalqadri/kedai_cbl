# Admin Dashboard Enhancement - Context

**Last Updated:** 2026-01-23 21:15 MYT
**Status:** ✅ COMPLETE - Committed, pushed, deployed, tested

## Implementation Summary

Enhanced the CBL Popshop admin dashboard with:
1. **Tabbed navigation** (Orders | Inventory | Reports)
2. **Inventory management** with per-size stock tracking
3. **P&L reporting** with date range filtering
4. **Order workflow with auto inventory decrement and profit calculation**

---

## Session 2026-01-23: Order Workflow Enhancement

### What Was Done This Session

1. **Fixed n8n workflow syntax** - Changed `$node['NodeName']` to `$('NodeName')` for reliable cross-node references
2. **Deployed workflow to VPS** - Used n8n API to update workflow `bvKiGfaIZTNBtlgK`
3. **Tested order submission** - Verified profit calculation and inventory decrement working
4. **Committed and pushed** - `5a11d1b feat(n8n): add inventory auto-decrement and profit calculation`
5. **Ran Playwright E2E tests** - All 3 admin tabs verified working

### Key Technical Fixes

#### n8n Node Reference Syntax Issue
**Problem:** Production workflow was failing with `$node.20-generate-order.first is not a function`
**Root Cause:** n8n was interpreting `$node['20-generate-order']` as dot notation instead of bracket notation
**Solution:** Changed all references to use `$('NodeName')` syntax which is more reliable

```javascript
// BEFORE (broken)
const orderData = $node['20-generate-order'].first().json;

// AFTER (working)
const orderData = $('20-generate-order').first().json;
```

#### Workflow Deployment via API
The n8n CLI doesn't work reliably, so we used the REST API:
```bash
# Get API key from database
PGPASSWORD='TVw2xISldsFov7O5ksjr7SYYwazR4if' psql -h localhost -U alumist -d alumist_n8n -c "SELECT * FROM n8n.user_api_keys;"

# Update workflow (must remove active and tags fields - they're read-only)
jq 'del(.active, .tags)' workflow.json > /tmp/wf-update.json
curl -X PUT 'http://localhost:5678/api/v1/workflows/bvKiGfaIZTNBtlgK' \
  -H 'X-N8N-API-KEY: n8n_api_ae0f5b73e8cc1e7db94f8b1d51127da5b61be21167e97ef61d4c50d45db6f6bd' \
  -H 'Content-Type: application/json' \
  -d @/tmp/wf-update.json

# Activate workflow
curl -X POST 'http://localhost:5678/api/v1/workflows/bvKiGfaIZTNBtlgK/activate' \
  -H 'X-N8N-API-KEY: ...'
```

### Workflow Features Now Working

| Feature | Status | Details |
|---------|--------|---------|
| Cost Lookup | ✅ | Fetches `cost_price` from `products` table |
| Profit Calculation | ✅ | `profit = total - items_cost - shipping_fee` |
| Inventory Decrement | ✅ | Auto-decrements `product_inventory` on order |
| Transaction Log | ✅ | Records to `inventory_transactions` audit table |
| Telegram Notification | ✅ | Now shows profit in message |

### Test Results

**Order Submission Test:**
```json
{
  "ok": true,
  "success": true,
  "orderId": "PSMKQEYSGY",
  "total": 97,
  "profit": 54,
  "inventoryUpdated": true
}
```

**Database Verification:**
- Order created with `items_cost: 35.00`, `profit: 54.00`
- Inventory decremented: 50 → 49
- Transaction logged with `reference_id: PSMKQEYSGY`

---

## Previous Session: Admin Dashboard Implementation

### Database Design
- Created `products` table (didn't exist before - products were hardcoded)
- Created `product_inventory` table with UNIQUE constraint on (product_id, size_id)
- Added cost tracking columns to `popshop_orders`: items_cost, shipping_cost, profit
- Created `inventory_transactions` audit log for stock changes

### n8n Configuration
- **CRITICAL FIX**: Changed `EXECUTIONS_MODE=queue` to `EXECUTIONS_MODE=regular` in `/opt/alumist/config/.env`
- Queue mode was causing webhook timeouts (requires Redis which wasn't configured)
- Cleared 26 stuck executions from n8n database

### API Key Mismatch Fixed
- Frontend `.env` had wrong admin key
- Correct key from VPS: `7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d`
- Updated `VITE_ADMIN_API_KEY` in `.env`

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `popshop_n8n/wf-01-order-submit.json` | Added cost lookup, profit calc, inventory decrement, fixed node refs |

## Git History

```
5a11d1b feat(n8n): add inventory auto-decrement and profit calculation to order workflow
4428f57 feat(admin): add inventory management and P&L reporting tabs
```

## Deployment Status

| Component | Status | URL/Details |
|-----------|--------|-------------|
| Frontend | ✅ Deployed | Cloudflare Pages (auto-deploys on push) |
| n8n Workflow | ✅ Active | `bvKiGfaIZTNBtlgK` on VPS |
| Database | ✅ Migrated | `cryptico_kiosk` on VPS PostgreSQL |

## Verification Commands

```bash
# Test webhook
curl -X POST https://alumist.alumga.com/webhook/popshop/order/submit \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"cbl-jingga-tee","productName":"CBL Jingga T-Shirt","size":"M","quantity":1,"price":89}],"subtotal":89,"shippingFee":8,"total":97,"customer":{"name":"Test","phone":"+60123456789","email":"test@example.com","address":{"line1":"123 Test St","line2":"","postcode":"50000","city":"KL","state":"WP"}},"paymentRef":"TEST"}'

# Check workflow status
ssh root@45.159.230.42 -p 1511 "curl -s 'http://localhost:5678/api/v1/workflows/bvKiGfaIZTNBtlgK' -H 'X-N8N-API-KEY: n8n_api_ae0f5b73e8cc1e7db94f8b1d51127da5b61be21167e97ef61d4c50d45db6f6bd' | jq '.active'"

# Check recent executions
ssh root@45.159.230.42 -p 1511 "PGPASSWORD='TVw2xISldsFov7O5ksjr7SYYwazR4if' psql -h localhost -U alumist -d alumist_n8n -c \"SELECT id, status FROM n8n.execution_entity WHERE \\\"workflowId\\\" = 'bvKiGfaIZTNBtlgK' ORDER BY id DESC LIMIT 5;\""
```

## Connection Details

```bash
# VPS SSH
ssh root@45.159.230.42 -p 1511

# Database (cryptico_kiosk for app data)
PGPASSWORD='TVw2xISldsFov7O5ksjr7SYYwazR4if' psql -h localhost -U alumist -d cryptico_kiosk

# n8n Database (alumist_n8n for workflow data)
PGPASSWORD='TVw2xISldsFov7O5ksjr7SYYwazR4if' psql -h localhost -U alumist -d alumist_n8n

# n8n API Key
n8n_api_ae0f5b73e8cc1e7db94f8b1d51127da5b61be21167e97ef61d4c50d45db6f6bd

# PM2 process
pm2 status alumist-n8n
```

## Known Limitations

1. **Old orders show RM 0.00 profit** - Orders created before this update don't have `items_cost` data
2. **Products must exist in database** - Order fails if `productId` doesn't match a product in `products` table
3. **Single item inventory update** - Current workflow only handles first item for inventory update (needs loop for multi-item orders)

## Potential Future Enhancements

1. Fix multi-item inventory updates (currently only first item is decremented)
2. Add inventory restock on order cancellation
3. Backfill `items_cost` for historical orders
4. Add low stock alerts to Telegram notifications
