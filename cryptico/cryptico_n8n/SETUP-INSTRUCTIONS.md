# Cryptico n8n Setup Instructions

## Current Status
- ✅ n8n server running at https://alumist.alumga.com/
- ✅ PostgreSQL database `cryptico_kiosk` created with all tables
- ✅ 7 Cryptico workflows imported to n8n
- ⚠️ Credentials need to be created in n8n UI
- ⚠️ Workflows need to be activated

## Manual Steps Required

### Step 1: Create PostgreSQL Credential

1. Go to https://alumist.alumga.com/
2. Login with: `admin` / `Ayamgoreng1!`
3. Navigate to **Settings → Credentials**
4. Click **Add Credential**
5. Search for "Postgres" and select it
6. Fill in these details:

   | Field | Value |
   |-------|-------|
   | Credential Name | `Cryptico PostgreSQL` |
   | Host | `localhost` |
   | Database | `cryptico_kiosk` |
   | User | `alumist` |
   | Password | `TVw2xISldsFov7O5ksjr7SYYwazR4if` |
   | Port | `5432` |
   | SSL | `disable` |

7. Click **Test Connection** to verify
8. Click **Save**

### Step 2: Create Header Auth Credential (for webhooks)

1. Click **Add Credential**
2. Search for "Header Auth" and select it
3. Create credential:
   - Name: `Cryptico API Key`
   - Header: `X-API-Key`
   - Value: `77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e`

4. Create another credential:
   - Name: `Cryptico Admin Key`
   - Header: `X-Admin-Key`
   - Value: `7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d`

### Step 3: Update Workflow Credentials

For each Cryptico workflow:

1. Open the workflow from the workflow list
2. For each **Postgres** node:
   - Click on the node
   - In the **Credential** field, select `Cryptico PostgreSQL`
3. For webhook nodes (in WF-02, WF-03, WF-05, WF-06):
   - WF-02 (Order Submit): Use `Cryptico API Key`
   - WF-03, WF-05, WF-06 (Admin): Use `Cryptico Admin Key`
4. Save the workflow

### Step 4: Activate Workflows

Activate in this order:
1. `Cryptico-ATM-07-Error-Handler` (first - others reference it)
2. `Cryptico-ATM-01-Price-Feed` (starts fetching prices)
3. `Cryptico-ATM-02-Order-Submit`
4. `Cryptico-ATM-03-Status-Update`
5. `Cryptico-ATM-04-Order-Lookup`
6. `Cryptico-ATM-05-Admin-Orders`
7. `Cryptico-ATM-06-Admin-Stats`

### Step 5: Test Endpoints

Once activated, test the endpoints:

```bash
# Test order lookup (should return 404 for non-existent order)
curl https://alumist.alumga.com/webhook/order/lookup/CK12345TEST

# Test price feed (check database)
psql -h localhost -U alumist -d cryptico_kiosk -c "SELECT * FROM crypto_prices;"
```

## Workflow IDs (for reference)

| Workflow | ID |
|----------|-----|
| WF-01 Price Feed | hucvpuETRgmhTVpA |
| WF-02 Order Submit | woHyn3gbFETmMbmu |
| WF-03 Status Update | Rwwm8yma9jexODs4 |
| WF-04 Order Lookup | wZJq4ncBPhTQbTsR |
| WF-05 Admin Orders | 20DhLPnGiIc6x1o5 |
| WF-06 Admin Stats | hZt9ZRIXc6RC67yR |
| WF-07 Error Handler | DldiymcBP4AIKf3S |

## Webhook URLs (after activation)

| Endpoint | URL |
|----------|-----|
| Order Submit | `POST https://alumist.alumga.com/webhook/order/submit` |
| Order Status | `POST https://alumist.alumga.com/webhook/order/status` |
| Order Lookup | `GET https://alumist.alumga.com/webhook/order/lookup/:orderId` |
| Admin Orders | `GET https://alumist.alumga.com/webhook/admin/orders` |
| Admin Stats | `GET https://alumist.alumga.com/webhook/admin/stats` |

## Environment Variables (on server)

Located at `/home/n8n/.env`:

```
CRYPTICO_TELEGRAM_BOT_TOKEN=8282150332:AAHabYbhdBA322yYXKt3uKC6cv7VVzFOmGI
CRYPTICO_TELEGRAM_CHAT_ID=<set-your-chat-id>
CRYPTICO_API_KEY=d8f4e2b1a9c7503f6e8d1b4a2c9e7f3d
CRYPTICO_ADMIN_KEY=a3b7c9d1e5f8g2h4i6j0k8l2m4n6o8p0
CRYPTICO_BUSINESS_NAME=CryptoKiosk
CRYPTICO_RATE_MARKUP_PERCENT=2
CRYPTICO_RATE_LOCK_DURATION_SECONDS=300
CRYPTICO_MIN_AMOUNT_MYR=50
CRYPTICO_MAX_AMOUNT_MYR=10000
CRYPTICO_FEE_TRC20=1.00
CRYPTICO_FEE_BEP20=2.50
CRYPTICO_FEE_ERC20=15.00
CRYPTICO_FEE_POLYGON=0.50
```

## Troubleshooting

### Workflow execution errors
1. Check n8n logs: `pm2 logs alumist-n8n`
2. Check error_log table in database
3. Check Telegram notifications

### Database connection issues
1. Verify PostgreSQL is running: `pg_isready`
2. Test connection: `psql -h localhost -U alumist -d cryptico_kiosk -c "SELECT 1;"`

### Webhook not responding
1. Verify workflow is active (toggle should be ON)
2. Check the webhook URL format
3. Verify credential is attached to webhook node
