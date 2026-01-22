# Customer Notification & Session Persistence - Context

**Last Updated:** 2026-01-22 11:30 AM
**Status:** ✅ COMPLETED

## Summary

Implemented two major features for CBL Popshop:
1. Customer email notifications with order confirmation
2. Session persistence for seamless navigation

## Implementation Details

### Feature 1: Customer Email Notification

**Files Modified:**
- `popshop_n8n/wf-01-order-submit.json` - Added customer email nodes

**New Nodes Added:**
- `40-format-customer-email` (Code node) - Formats HTML email with:
  - CBL branding header
  - Prominent order ID display
  - Items list with prices
  - Shipping address
  - "What's next" steps
  - Track order button
  - Payment proof as binary attachment (if uploaded)

- `41-send-customer-email` (Email Send node) - Sends via Gmail SMTP
  - Uses credential ID: `hCZX1kGIsQ2X1cVZ` (Gmail SMTP)
  - Attaches payment proof image when available
  - `onError: continueRegularOutput` to not block order flow

**Workflow Flow:**
```
37-telegram-failed?
  ├─ YES → 38-admin-email → 40-format-customer-email
  └─ NO  → 40-format-customer-email
                    ↓
          41-send-customer-email
                    ↓
          55-format-response → 60-reply-success
```

### Feature 2: Order Status Polling (ProcessingScreen)

**File:** `src/components/shop/screens/ProcessingScreen.tsx`

**Implementation:**
- Uses `useEffect` with `setInterval` polling every 5 seconds
- Calls `orderApi.lookup(orderId)` to check status
- Shows two states:
  1. **Pending**: "Verifying Payment" with spinner, order details, "What's next"
  2. **Confirmed/Other**: "Payment Verified!" or "Order Cancelled" with status details

**Key Code Pattern:**
```typescript
useEffect(() => {
  let alive = true
  const poll = async () => {
    if (!orderId) return
    const result = await orderApi.lookup(orderId)
    if (!alive) return
    if (result.success && result.data?.order) {
      if (apiOrder.status !== 'pending') {
        setPolledOrder(...)
      }
    }
  }
  poll()
  const interval = setInterval(poll, 5000)
  return () => { alive = false; clearInterval(interval) }
}, [orderId])
```

### Feature 3: Session Persistence

**New File:** `src/lib/session.ts`
- SessionStorage-based persistence (clears on tab close)
- 30-minute expiry for inactive sessions
- Functions: `saveSession()`, `loadSession()`, `clearSession()`

**Modified Files:**
- `src/hooks/useCart.ts` - Persists cart items, restores on load
- `src/hooks/useShop.ts` - Persists screen, customer, order state

**What's Persisted:**
- Current screen
- Cart items (products, sizes, quantities)
- Customer details (name, phone, email, address)
- Selected product ID
- Payment reference
- Order ID and details (if submitted)

**NOT Persisted:**
- Payment proof image (too large as base64)

### Feature 4: UI Improvements (ProcessingScreen)

**Added:**
- Email confirmation message: "📧 Confirmation sent to {email}"
- Copy button for order ID with visual feedback
- Updated "What's next" instructions

## Key Decisions Made

1. **sessionStorage over localStorage** - Clears when tab closes, appropriate for shopping sessions
2. **30-minute session expiry** - Balances convenience with stale data concerns
3. **Poll every 5 seconds** - Balance between responsiveness and server load
4. **Don't persist payment proof** - Base64 images too large for sessionStorage
5. **Customer email continues on error** - `onError: continueRegularOutput` ensures order flow completes

## Environment Configuration

**Required `.env` variables:**
```
VITE_API_KEY=77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e
VITE_ADMIN_API_KEY=77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad578be4e
```

**n8n Credentials:**
- Gmail SMTP: `hCZX1kGIsQ2X1cVZ`
- API Key (Header Auth): `B9IPRA0h6bahkCwZ`

## Testing Done

1. **Playwright E2E Test** - Full order submission flow
   - All steps pass up to order creation
   - Order ID generated successfully
   - Email confirmation UI displayed
   - Copy button works

2. **Manual Testing Needed:**
   - Admin approval via Telegram → screen updates
   - Customer email delivery verification
   - Session persistence across page refresh

## Files Changed This Session

| File | Change Type | Description |
|------|-------------|-------------|
| `popshop_n8n/wf-01-order-submit.json` | Modified | Added customer email nodes |
| `src/components/shop/screens/ProcessingScreen.tsx` | Rewritten | Polling + two-state UI |
| `src/lib/session.ts` | New | Session persistence utilities |
| `src/hooks/useCart.ts` | Modified | Session persistence |
| `src/hooks/useShop.ts` | Modified | Session persistence |
| `.env` | New | API key configuration |
| `/tmp/playwright-test-order-submission.js` | New | E2E test script |

## Known Issues

None discovered.

## Next Steps

1. Deploy updated n8n workflow to production
2. Test Telegram approval → ProcessingScreen update flow
3. Verify customer email delivery with real email address
4. Consider adding push notifications for mobile

## Reference: Cryptico Implementation

Session polling was adapted from:
`~/cryptico/src/components/kiosk/screens/ProcessingScreen.tsx`

The cryptico app has similar polling but doesn't persist session state (intentional for kiosk use case).
