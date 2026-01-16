# N8N Workflows - Context Documentation

**Last Updated:** 2026-01-16 10:55 AM MYT

## Current Implementation State

### Completed
- All 7 Cryptico n8n workflows converted from Supabase to PostgreSQL
- Price feed workflow (wf-01) fully functional with:
  - 6 coins: USDT, USDC, BTC, ETH, SOL, ICP
  - CoinGecko API integration with fallback prices
  - Per-coin error detection (not all-or-nothing)
  - Telegram notifications only when errors occur
  - IF node v2 syntax fix (`errorCount > 0` instead of broken boolean)

### N8N Server Details
- **SSH:** `ssh root@45.159.230.42 -p 1511`
- **PM2 Process:** `alumist-n8n` (id 16)
- **URL:** `https://alumist.alumga.com`
- **Project:** `CcNtl9Ch6q6lBF14`
- **Folder:** `RxsaUrL1CV9ey1qX` (Cryptico)

### Database
- **Host:** localhost on VPS
- **Database:** `cryptico_kiosk`
- **User:** `alumist`
- **Password:** `TVw2xISldsFov7O5ksjr7SYYwazR4if`
- **RLS:** Disabled on all tables

### Telegram Bot
- **Bot:** Crypticobotbot
- **Token:** `TELEGRAM_BOT_TOKEN_REDACTED`
- **Chat ID:** `5426763403`

## Key Decisions Made This Session

1. **Changed coins from BNB/MATIC to BTC/ETH/SOL/ICP** - User requested specific coins
2. **Fixed IF node v2 syntax** - Old boolean comparison was broken, now uses `errorCount > 0`
3. **Changed aggregate-check to use `$input.all()`** - `$('nodeName').all()` wasn't working reliably
4. **Check `is_fallback` from DB results** - More reliable than checking `fetch_error` from previous node

## Files Modified

### `cryptico_n8n/postgres/wf-01-price-feed.json`
- Updated coins to USDT, USDC, BTC, ETH, SOL, ICP
- Fixed `16-aggregate-check` node to use `$input.all()`
- Fixed `17-error-gate` IF node to use v2 syntax with `errorCount > 0`
- Added proper PostgreSQL credential ID: `XBVFwEM8RKk32yyj`

## Issues Discovered & Fixed

1. **Empty errorSymbols in notification** - `$('10-apply-markup').all()` returned empty
   - Fix: Use `$input.all()` to get PostgreSQL output directly

2. **IF node always triggering error path** - v1 boolean syntax broken in n8n v2
   - Fix: Use v2 conditions with `errorCount > 0` number comparison

3. **PostgreSQL boolean comparison** - `is_fallback` returns `'t'` not `true`
   - Fix: Check for `true`, `'t'`, and `'true'`

## Next Steps

1. Test remaining workflows (wf-02 through wf-07)
2. Connect frontend to n8n webhooks
3. Update frontend with correct coins (BTC, ETH, SOL, ICP, USDT, USDC)

## Environment Variables on VPS `/home/n8n/.env`

```bash
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
N8N_AVAILABLE_ENVIRONMENT_VARIABLES=CRYPTICO_TELEGRAM_BOT_TOKEN,CRYPTICO_TELEGRAM_CHAT_ID,...
```

## Workflow Status in N8N

| Workflow | Status |
|----------|--------|
| Cryptico-ATM-01-Price-Feed | Active |
| Cryptico-ATM-02-Order-Submit | Active |
| Cryptico-ATM-03-Status-Update | Active |
| Cryptico-ATM-04-Order-Lookup | Active |
| Cryptico-ATM-05-Admin-Orders | Active |
| Cryptico-ATM-06-Admin-Stats | Active |
| Cryptico-ATM-07-Error-Handler | Inactive |
