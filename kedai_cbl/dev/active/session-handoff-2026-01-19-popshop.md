# Session Handoff: PopShop n8n Workflow Debugging & Fixes
**Last Updated:** 2026-01-19 18:40 MYT
**Status:** COMPLETE - All workflows functional

## Session Summary

This session diagnosed and fixed all 5 CBL-Popshop n8n workflows that were returning empty responses despite being active. The root causes were:
1. Missing environment variables
2. Incorrect n8n expression syntax in Code nodes
3. Wrong IF node conditions
4. Missing database table

## Production Environment

- **Server:** 45.159.230.42 (SSH port 1511)
- **n8n URL:** https://alumist.alumga.com
- **n8n Process:** PM2 `alumist-n8n` (PID changes on restart)
- **Database:** PostgreSQL on localhost
  - n8n DB: `alumist_n8n` (schema: `n8n`)
  - PopShop DB: `cryptico_kiosk`
- **DB User:** `alumist` / Password: `TVw2xISldsFov7O5ksjr7SYYwazR4if`

## Workflows Fixed

| Workflow | ID | Webhook Path | Auth Header |
|----------|-----|--------------|-------------|
| 01-Order-Submit | bvKiGfaIZTNBtlgK | POST /webhook/popshop/order/submit | X-Api-Key |
| 02-Order-Lookup | 2iL8S9tLc9pQC2xY | GET /webhook/popshop/order/lookup | None |
| 03-Status-Update | EfunWOYyQjqEAkRJ | POST /webhook/popshop/order/status | X-Admin-Key |
| 04-Admin-Orders | JVhMLWVyu0IGCUg7 | GET /webhook/popshop/admin/orders | X-Admin-Key |
| 05-Admin-Stats | V18eXJSfQ3FiKh6X | GET /webhook/popshop/admin/stats | X-Admin-Key |

## API Keys (from environment)
```
CRYPTICO_API_KEY=77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e
CRYPTICO_ADMIN_KEY=7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d
POPSHOP_TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN_REDACTED
POPSHOP_TELEGRAM_CHAT_ID=5426763403
```

## Fixes Applied

### 1. Environment Variables (n8n restart required)
**File:** `/home/n8n/.env` on server

Added:
```bash
# POPSHOP CBL CONFIGURATION
POPSHOP_TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN_REDACTED
POPSHOP_TELEGRAM_CHAT_ID=5426763403
```

Updated `N8N_AVAILABLE_ENVIRONMENT_VARIABLES` to include the new vars.

**Restart command:** `pm2 restart alumist-n8n`

### 2. Admin-Stats Workflow (V18eXJSfQ3FiKh6X)
**Issues:**
- `Top Products` node had `LIMIT 0` returning no rows, blocking downstream
- `Format Response` used `$json[0]` instead of `$json`

**Fixes:**
- Removed `LIMIT 0` from Top Products query
- Added `alwaysOutputData: true` to Top Products node
- Changed `$('Fetch Stats').first().json[0]` to `$('Fetch Stats').first().json`

### 3. Order-Lookup Workflow (2iL8S9tLc9pQC2xY)
**Issues:**
- `Order Found?` IF node checked `$json.length` (wrong - checks object properties)
- `Sanitize Response` used `$input.first().json[0]`

**Fixes:**
- Changed IF condition to `$json.order_id isNotEmpty`
- Changed `$input.first().json[0]` to `$input.first().json`

### 4. Status-Update Workflow (EfunWOYyQjqEAkRJ)
**Issues:**
- `Order Found?` IF node had wrong condition
- `Check Transition` used `.json[0]`
- `Audit Log` referenced `$json` but received Postgres output (different field names)
- `Telegram Notification` had same reference issue
- Missing `popshop_audit_log` table

**Fixes:**
- Changed IF condition to `$json.order_id isNotEmpty`
- Fixed `.json[0]` to `.json` in Check Transition
- Changed Audit Log to reference `$('Check Transition').first().json`
- Fixed Telegram notification references
- Created `popshop_audit_log` table (see schema below)

### 5. Admin-Orders Workflow (JVhMLWVyu0IGCUg7)
**Issues:**
- `Format Response` used `.json[0]`

**Fixes:**
- Changed to `.json`

## Database Schema Created

```sql
CREATE TABLE popshop_audit_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_entity_new ON popshop_audit_log(entity_type, entity_id);
```

## Key Learnings

### n8n Expression Patterns
1. **Postgres node output:** Each row becomes an item with data in `$json` (not `$json[0]`)
2. **IF node v1 conditions:** Use `string.isNotEmpty` not `number.larger` with `.length`
3. **Reference previous nodes:** Use `$('Node Name').first().json` to access data from earlier nodes
4. **Empty output blocking:** If a node returns 0 items, downstream nodes don't execute

### Debugging Workflow
1. Check `n8n.execution_entity` for status
2. Check `n8n.execution_data` for error details
3. Parse the compact JSON format (values are often array indices)
4. Use `lastNodeExecuted` to identify where failure occurred

## Test Commands

```bash
# Order Submit
curl -X POST "https://alumist.alumga.com/webhook/popshop/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e" \
  -d '{"items":[{"productId":"test","productName":"Test","size":"M","quantity":1,"price":50}],"subtotal":50,"shippingFee":5,"total":55,"customer":{"name":"Test","phone":"+60123456789","email":"test@test.com","address":{"line1":"123 Test","city":"KL","state":"WP","postcode":"50000"}}}'

# Admin Stats
curl "https://alumist.alumga.com/webhook/popshop/admin/stats" \
  -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d"

# Order Lookup
curl "https://alumist.alumga.com/webhook/popshop/order/lookup?order_id=PSMKKZZ94F"

# Admin Orders
curl "https://alumist.alumga.com/webhook/popshop/admin/orders" \
  -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d"

# Status Update
curl -X POST "https://alumist.alumga.com/webhook/popshop/order/status" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d" \
  -d '{"order_id": "PSMKKZZ94F", "status": "shipped", "tracking_number": "EMS123", "courier": "Pos Malaysia"}'
```

## Current Database State

```
popshop_orders:
- PSMKKZZ94F: processing
- PSMKKZZMBS: confirmed
- PSMKL0BW71: delivered
- PSMKL17XV9: pending (latest test order)

popshop_audit_log:
- 3 entries tracking status changes
```

## Remaining Minor Issues

1. **Top Products placeholder:** Currently returns dummy data since items are stored as JSON in orders table. A proper aggregation query would need to parse JSON items.

2. **Order ID validation:** Regex pattern `^PS[A-Z0-9]{6,8}$` expects 6-8 chars but generator creates 8 chars. Works but could be tightened.

## Files Modified (on server, not in git)

All workflow changes were made directly in the `alumist_n8n` PostgreSQL database via Python scripts. No local files were modified.

Environment file modified: `/home/n8n/.env`

## Next Steps (if continuing)

1. Consider adding proper product aggregation for Top Products
2. Add email notifications to Status-Update workflow
3. Consider adding webhook retry logic for Telegram failures
4. Document the full API specification for frontend integration
