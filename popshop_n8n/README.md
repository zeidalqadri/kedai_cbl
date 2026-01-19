# CBL Popshop - n8n Workflows

This directory contains the n8n workflow definitions and database schema for the CBL Popshop backend.

**Infrastructure:** Shares n8n instance and PostgreSQL database with Cryptico at `alumist.alumga.com`

## Quick Start

1. Run `database-schema.sql` on the existing Supabase PostgreSQL
2. Import all `wf-*.json` workflows into n8n
3. Configure Telegram credentials for notifications
4. Test endpoints

## Workflows

| File | Endpoint | Auth | Description |
|------|----------|------|-------------|
| `wf-01-order-submit.json` | POST `/popshop/order/submit` | API Key | Create new orders |
| `wf-02-order-lookup.json` | GET `/popshop/order/lookup` | None | Track order status |
| `wf-03-status-update.json` | POST `/popshop/order/status` | Admin Key | Update order status |
| `wf-04-admin-orders.json` | GET `/popshop/admin/orders` | Admin Key | List all orders |
| `wf-05-admin-stats.json` | GET `/popshop/admin/stats` | Admin Key | Dashboard statistics |

## Order ID Format

Orders use `PS` prefix (e.g., `PS1A2B3C4D`) to distinguish from Cryptico's `CK` prefix.

## Workflow Details

### wf-01: Order Submit
**Endpoint:** `POST /popshop/order/submit`

Creates new product orders:
- Validates order data and customer info
- Generates unique order ID (PS-XXXXXXXX)
- Creates idempotency key from order hash
- Stores order and order_items in database
- Sends Telegram notification to admin
- Returns order confirmation

**Request Body:**
```json
{
  "items": [
    {
      "productId": "cbl-jingga-tshirt",
      "productName": "CBL Jingga T-Shirt",
      "size": "L",
      "quantity": 1,
      "price": 89
    }
  ],
  "subtotal": 89,
  "shippingFee": 0,
  "total": 89,
  "customer": {
    "name": "John Doe",
    "phone": "0123456789",
    "email": "john@example.com",
    "address": {
      "line1": "123 Main St",
      "city": "Kuala Lumpur",
      "state": "Kuala Lumpur",
      "postcode": "50000"
    }
  },
  "paymentRef": "TX123456",
  "proofImageBase64": "data:image/png;base64,..."
}
```

### wf-02: Order Lookup
**Endpoint:** `GET /popshop/order/lookup?order_id=PS1A2B3C4D`

Returns sanitized order status for customer tracking:
- Order status with emoji display
- Order items and totals
- Tracking number and courier (if shipped)
- No sensitive customer data exposed

### wf-03: Status Update
**Endpoint:** `POST /popshop/order/status`

Admin endpoint to update order status with state machine validation:

**Valid Statuses:**
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `processing`, `cancelled`, `refunded`
- `processing` → `shipped`, `cancelled`, `refunded`
- `shipped` → `delivered`, `refunded`
- `delivered` → `refunded`
- `cancelled`, `refunded` → (terminal states)

**Request Body:**
```json
{
  "order_id": "PS1A2B3C4D",
  "status": "shipped",
  "tracking_number": "POS123456789MY",
  "courier": "Pos Laju",
  "admin_notes": "Optional note"
}
```

### wf-04: Admin Orders
**Endpoint:** `GET /popshop/admin/orders`

Returns paginated list of orders with items.

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort_by` - Sort field: `created_at`, `updated_at`, `total_amount`, `order_id`
- `sort_order` - `asc` or `desc`

### wf-05: Admin Stats
**Endpoint:** `GET /popshop/admin/stats`

Returns dashboard statistics:
- Order counts by status
- Total and completed revenue
- 24h and 7d metrics
- Top selling products

## Database Tables

```
popshop_orders        - Main order records
popshop_order_items   - Line items for each order
popshop_audit_log     - Status change history
```

See `database-schema.sql` for full schema.

## Credentials Required

### PostgreSQL
- ID: `XBVFwEM8RKk32yyj` (Supabase Postgres - shared with Cryptico)

### HTTP Header Auth
- ID: `B9IPRA0h6bahkCwZ` (Admin API Key - shared with Cryptico)

### Telegram Bot
- Create new credential `CBL Telegram Bot` or reuse Cryptico's
- Set `POPSHOP_TELEGRAM_CHAT_ID` environment variable in n8n

## Status Flow

```
pending → confirmed → processing → shipped → delivered
   ↓         ↓           ↓           ↓
cancelled cancelled   cancelled   refunded
              ↓           ↓
           refunded    refunded
```

## Testing

Test order submission:
```bash
curl -X POST https://alumist.alumga.com/webhook/popshop/order/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"items":[{"productId":"cbl-jingga-tshirt","productName":"CBL Jingga T-Shirt","size":"L","quantity":1,"price":89}],"subtotal":89,"shippingFee":0,"total":89,"customer":{"name":"Test User","phone":"0123456789","email":"test@example.com","address":{"line1":"123 Test St","city":"KL","state":"Kuala Lumpur","postcode":"50000"}},"paymentRef":"TEST123"}'
```

Test order lookup:
```bash
curl "https://alumist.alumga.com/webhook/popshop/order/lookup?order_id=PS1A2B3C4D"
```
