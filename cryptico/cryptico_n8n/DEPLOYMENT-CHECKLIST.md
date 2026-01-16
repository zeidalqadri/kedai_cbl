# Cryptico ATM - Deployment Checklist

## Pre-Deployment

### 1. Supabase Setup
- [ ] Create Supabase project at supabase.com
- [ ] Note down Project URL: `https://xxxxx.supabase.co`
- [ ] Note down `anon` public key
- [ ] Note down `service_role` secret key
- [ ] Run `database-schema.sql` in SQL Editor
- [ ] Verify tables created: `crypto_prices`, `orders`, `audit_log`, `error_log`

### 2. Telegram Bot Setup
- [ ] Open Telegram, search for `@BotFather`
- [ ] Send `/newbot` and follow prompts
- [ ] Note down bot token: `123456789:ABC...`
- [ ] Search for `@userinfobot`, send `/start`
- [ ] Note down your chat ID: `123456789`
- [ ] Test bot: `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>&text=test`

### 3. Generate Security Keys
```bash
# Generate API secret key
openssl rand -hex 32
# Result: cryptico_sk_live_xxxx...

# Generate Admin key
openssl rand -hex 32  
# Result: admin_xxxx...

# Generate Idempotency salt
openssl rand -hex 16
# Result: cryptico_idem_xxxx...
```

---

## n8n Deployment

### 4. Configure Environment Variables
- [ ] Copy `.env.template` to your n8n environment
- [ ] Fill in all required values:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `TELEGRAM_CHAT_ID`
  - [ ] `TELEGRAM_ADMIN_CHAT_ID`
  - [ ] `API_SECRET_KEY`
  - [ ] `ADMIN_API_KEY`
  - [ ] `BUSINESS_NAME`
  - [ ] Network fees (adjust as needed)

### 5. Create n8n Credentials
- [ ] **Supabase API credential:**
  - Name: `Supabase API`
  - Host: Your Supabase URL
  - Service Role Key: Your service role key
  - Note credential ID: `__________`

### 6. Import Workflows (in this order)
- [ ] Import `wf-07-error-handler.json` (First - other workflows reference it)
- [ ] Import `wf-01-price-feed.json`
- [ ] Import `wf-02-order-submit.json`
- [ ] Import `wf-03-status-update.json`
- [ ] Import `wf-04-order-lookup.json`
- [ ] Import `wf-05-admin-orders.json`
- [ ] Import `wf-06-admin-stats.json`

### 7. Update Credential References
For each imported workflow:
- [ ] Open workflow settings
- [ ] Find Supabase nodes
- [ ] Update credential ID from `SUPABASE_CREDENTIAL_ID` to your actual ID
- [ ] Save workflow

### 8. Activate Workflows
- [ ] Activate WF-07 (Error Handler)
- [ ] Activate WF-01 (Price Feed) - Will start running every 5 min
- [ ] Activate WF-02 (Order Submit)
- [ ] Activate WF-03 (Status Update)
- [ ] Activate WF-04 (Order Lookup)
- [ ] Activate WF-05 (Admin Orders)
- [ ] Activate WF-06 (Admin Stats)

---

## Webhook URLs

After activation, note your webhook URLs:

| Endpoint | URL |
|----------|-----|
| Order Submit | `https://your-n8n.com/webhook/order/submit` |
| Status Update | `https://your-n8n.com/webhook/order/status` |
| Order Lookup | `https://your-n8n.com/webhook/order/lookup/:id` |
| Admin Orders | `https://your-n8n.com/webhook/admin/orders` |
| Admin Stats | `https://your-n8n.com/webhook/admin/stats` |

---

## Testing

### 9. Run Test Suite
```bash
# Update test-suite.sh with your values
chmod +x test-suite.sh
./test-suite.sh
```

### 10. Manual Verification
- [ ] Check crypto_prices table has data
- [ ] Submit test order via curl
- [ ] Verify Telegram notification received
- [ ] Verify order in database
- [ ] Test order lookup
- [ ] Test admin approve flow
- [ ] Verify status update notification
- [ ] Test complete with TX hash

---

## Frontend Integration

### 11. Configure React App
Add to React app `.env`:
```
REACT_APP_API_URL=https://your-n8n.com/webhook
REACT_APP_API_KEY=your_api_secret_key
REACT_APP_ADMIN_KEY=your_admin_key
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 12. Integrate API Client
- [ ] Copy `frontend-api-client.js` to React project
- [ ] Replace browser storage calls with API calls
- [ ] Update price fetching to use API
- [ ] Update order submission to use API
- [ ] Update admin dashboard to use API

---

## Go Live

### 13. Production Checklist
- [ ] Change default admin password
- [ ] Verify all environment variables are production values
- [ ] Enable n8n queue mode for scalability
- [ ] Set up monitoring/alerting
- [ ] Test full end-to-end flow
- [ ] Document runbook for ops team

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Prices not updating | Check CoinGecko API, verify WF-01 is active |
| Telegram not sending | Verify bot token and chat ID |
| Order fails | Check execution logs, verify Supabase connection |
| 401 on admin endpoints | Verify ADMIN_API_KEY matches |
| Rate lock expired | Increase RATE_LOCK_DURATION_SECONDS |

### Support Commands
```bash
# Check recent executions
curl -s "https://your-n8n.com/api/v1/executions"

# Check Supabase connection
curl "https://xxxxx.supabase.co/rest/v1/crypto_prices" \
  -H "apikey: YOUR_ANON_KEY"

# Test Telegram
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

---

*Deployment checklist v1.0.0 - Cryptico ATM*
