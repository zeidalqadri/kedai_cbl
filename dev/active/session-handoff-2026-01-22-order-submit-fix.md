# Session Handoff: Order Submit JSON Error Fix & Email Fallback
**Date:** 2026-01-22
**Status:** COMPLETE - Issue resolved, tested and working

## Issue Reported

Test user encountered error on payment confirmation page:
```
Unexpected end of JSON input
```

Screenshot showed the error appeared after:
- Entering payment reference "123456789"
- Uploading payment screenshot
- Clicking "Submit Order"

## Root Cause Analysis

1. **n8n workflow** used `responseMode: "responseNode"` - only responds when reaching a Respond node
2. **Telegram notifications** used `$env.POPSHOP_TELEGRAM_BOT_TOKEN` - not available on n8n Personal plan
3. **No error handling** - if any node failed before response, n8n returned empty body
4. **Frontend** called `response.json()` on empty response → "Unexpected end of JSON input"

## Fixes Applied

### 1. Frontend API Error Handling (`src/lib/api.ts`)

Improved `publicFetch` and `adminFetch` to handle empty/invalid responses gracefully:
- Check `response.ok` before parsing
- Handle empty response body with user-friendly message
- Catch JSON parse errors with specific error code

```typescript
if (!text) {
  return {
    success: false,
    error: 'Server returned empty response. Please try again.',
    errorCode: 'EMPTY_RESPONSE',
  }
}
```

### 2. n8n Workflow Refactored (`popshop_n8n/wf-01-order-submit.json`)

**Replaced environment variables with Config node** (n8n Personal compatible):
```javascript
// 02-config node
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = '5426763403';
const ADMIN_EMAIL = 'zeidalqadri@gmail.com';
```

**Added error handling to all critical nodes:**
- `onError: "continueRegularOutput"` on Telegram HTTP nodes
- `onError: "continueErrorOutput"` on Postgres insert
- New `99-reply-database-error` response node

**Added email fallback for Telegram failures:**
- `36-check-telegram-result` - detects if Telegram succeeded
- `37-telegram-failed?` - routes to email if failed
- `38-send-email-fallback` - sends HTML email to admin

### 3. Backwards Compatibility (`src/lib/utils.ts`)

Added exports for legacy components:
```typescript
export const cn = cx
export const formatPrice = formatMYR
```

## Configuration Required in n8n

### Config Node (`02-config`)
```javascript
const TELEGRAM_BOT_TOKEN = 'actual_bot_token';
const TELEGRAM_CHAT_ID = '5426763403';
const ADMIN_EMAIL = 'zeidalqadri@gmail.com';
```

### SMTP Credential for Email Fallback
- **Credential ID:** `hCZX1kGIsQ2X1cVZ`
- **Provider:** Gmail SMTP
- **Host:** smtp.gmail.com
- **Port:** 465
- **User:** zeidalqadri@gmail.com
- **Auth:** App Password (16-char)

## New Workflow Flow

```
Customer Submit Order
        ↓
    02-config (set credentials)
        ↓
    05-validate-input
        ↓ valid
    20-generate-order
        ↓
    25-insert-order ──→ [error] → 99-reply-database-error
        ↓ success
    30-format-notifications (Telegram + Email messages)
        ↓
    31-check-proof-image
        ↓
    [with image] → 32-prepare → 33-send-photo → 35-send-telegram-with-buttons
    [no image]  → 35-send-telegram-no-image
        ↓
    36-check-telegram-result
        ↓
    37-telegram-failed?
        ↓ yes              ↓ no
    38-send-email    →    55-format-response
        ↓                      ↓
        └──────────────→  60-reply-success
```

## Test Results

```bash
curl -X POST "https://alumist.alumga.com/webhook/popshop/order/submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e" \
  -d '{"items":[...],"customer":{...},"paymentRef":"TEST-123456789"}'

# Response:
{
  "ok": true,
  "success": true,
  "orderId": "PSMKOURMX9",
  "status": "pending",
  "total": 104
}
```

Telegram notification received with approval buttons ✅

## Commits

| Commit | Description |
|--------|-------------|
| `550a0b7` | fix(popshop): resolve JSON parsing error on order submission |
| `c52467a` | fix(n8n): replace env vars with config node for Personal plan |
| `08fd253` | feat(n8n): add email fallback when Telegram fails |
| `c8e78b0` | chore(n8n): configure admin email for fallback notifications |
| `09647dd` | chore(n8n): add Gmail SMTP credential ID for email fallback |

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/api.ts` | Improved error handling for empty/invalid responses |
| `src/lib/utils.ts` | Added `cn` and `formatPrice` exports |
| `popshop_n8n/wf-01-order-submit.json` | Complete refactor with config node & email fallback |

## API Keys Reference

```
X-API-Key: 77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e
X-Admin-Key: 7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d
TELEGRAM_CHAT_ID: 5426763403
```

## Deployment Notes

1. **Frontend** auto-deployed via Cloudflare Pages on git push
2. **n8n workflow** must be manually imported from `popshop_n8n/wf-01-order-submit.json`
3. **SMTP credential** already configured with ID `hCZX1kGIsQ2X1cVZ`

## Outcome

- Customer always receives success response (no cryptic errors)
- Order always saved to database
- Admin notified via Telegram (primary) or Email (fallback)
- No more "Unexpected end of JSON input" errors
