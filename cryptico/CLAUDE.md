# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Maintenance:** Run `/dev-docs-update` to update this file with current progress and changes.

---

## Project Overview

CryptoKiosk is a browser-based crypto ATM/kiosk application for selling cryptocurrencies (USDT, USDC, BTC, ETH, SOL, ICP) via DuitNow QR payments in Malaysia.

## Build Commands

```bash
npm run dev        # Start development server (port 3000)
npm run build      # TypeScript compile + Vite production build
npm run lint       # Run ESLint
npm run lint:fix   # Run ESLint with auto-fix
npm run typecheck  # TypeScript type checking only
npm run preview    # Preview production build locally
```

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminMode.tsx        # Admin login gate
│   │   └── AdminDashboard.tsx   # Order management dashboard
│   ├── icons/
│   │   └── index.tsx            # SVG icon components
│   └── kiosk/
│       ├── KioskMode.tsx        # Main kiosk container
│       └── screens/
│           ├── WelcomeScreen.tsx
│           ├── NetworkScreen.tsx
│           ├── AmountScreen.tsx
│           ├── DetailsScreen.tsx
│           ├── PaymentScreen.tsx
│           ├── ConfirmScreen.tsx
│           ├── ProcessingScreen.tsx
│           └── LookupScreen.tsx
├── config/
│   └── index.ts                 # Environment-based config
├── hooks/
│   └── useKiosk.ts              # Main kiosk state/logic hook
├── lib/
│   ├── constants.ts             # CRYPTO_ASSETS, NETWORKS, STORAGE_KEYS
│   ├── prices.ts                # CoinGecko price fetching
│   ├── storage.ts               # LocalStorage abstraction (swap for API)
│   ├── telegram.ts              # Telegram Bot API integration
│   └── utils.ts                 # Formatting, validation, helpers
├── types/
│   └── index.ts                 # TypeScript interfaces
├── App.tsx                      # Root component (kiosk/admin mode switch)
├── main.tsx                     # React entry point
└── index.css                    # Tailwind + custom styles
```

## Key Architectural Patterns

- **useKiosk hook**: All kiosk state and business logic lives in `src/hooks/useKiosk.ts`. Screens are pure presentation.
- **Config from env**: All secrets/settings in `src/config/index.ts` read from `VITE_*` environment variables.
- **Storage abstraction**: `src/lib/storage.ts` abstracts storage; currently localStorage, designed for easy swap to API.
- **Screen-based routing**: Kiosk uses internal screen state (`KioskScreen` type), not URL routing.

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `VITE_TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `VITE_TELEGRAM_CHAT_ID` | Your Telegram chat ID for notifications |
| `VITE_BUSINESS_NAME` | Display name (default: CryptoKiosk) |
| `VITE_DUITNOW_QR_IMAGE` | QR code URL or base64 |
| `VITE_ADMIN_PASSWORD` | Admin dashboard password |
| `VITE_MIN_AMOUNT` / `VITE_MAX_AMOUNT` | Transaction limits (MYR) |
| `VITE_RATE_MARKUP` | Percentage markup on market rate |

## Order Flow

1. Customer selects crypto → network → enters MYR amount
2. Rate locked for 5 minutes during transaction
3. Customer enters contact details + wallet address (validated per network)
4. DuitNow QR payment displayed
5. Customer provides payment proof (reference or screenshot)
6. Order saved, Telegram notification sent
7. Admin verifies payment, approves/rejects
8. Admin marks complete with TX hash

## Admin Access

- Long-press logo (3+ seconds) on welcome screen
- Password from `VITE_ADMIN_PASSWORD` env var

## Wallet Validation Rules

| Network | Prefix | Length |
|---------|--------|--------|
| TRC-20  | T      | 34     |
| ERC-20  | 0x     | 42     |
| BTC     | 1, 3, bc1 | 26-62 |
| ETH     | 0x     | 42     |
| SOL     | (base58) | 32-44 |
| ICP     | (principal) | 27-63 |

---

# Production Roadmap

## Critical Blockers

1. **Compliance** - Malaysia requires crypto businesses to be registered with Securities Commission (SC). Legal review needed.
2. **Backend** - Current architecture stores everything client-side, unsuitable for production.
3. **Security** - Admin password in env var, Telegram token exposed to client.

---

## Phase 1: Project Setup & Infrastructure ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| Create proper React/Vite project structure | `completed` | Modular TypeScript structure |
| Set up environment variables (.env) | `completed` | All config via VITE_* vars |
| Configure CI/CD pipeline (GitHub Actions) | `completed` | Lint, typecheck, build |
| Configure Tailwind CSS | `completed` | Custom crypto colors |
| Set up ESLint | `completed` | React hooks + TypeScript rules |

---

## Phase 2: Backend Development
| Task | Status | Notes |
|------|--------|-------|
| Create Node.js/Express API server | `pending` | Or Fastify/Hono |
| Set up PostgreSQL database | `pending` | Schema for orders, users, audit logs |
| Implement order CRUD API endpoints | `pending` | RESTful design |
| Replace localStorage with DB | `pending` | Critical for production |
| Add Redis for rate limiting/sessions | `pending` | |

---

## Phase 3: Security Hardening
| Task | Status | Notes |
|------|--------|-------|
| Implement admin auth (JWT + refresh) | `pending` | Replace env password |
| Add rate limiting on all endpoints | `pending` | Prevent abuse |
| Implement CSRF protection | `pending` | |
| Add input validation (Zod schemas) | `pending` | Server + client side |
| Secure Telegram token (server-side) | `pending` | Never expose to client |
| Add admin 2FA or IP whitelist | `pending` | Extra protection |

---

## Phase 4: Payment & Crypto Integration
| Task | Status | Notes |
|------|--------|-------|
| Research DuitNow API options | `pending` | Direct integration vs manual QR |
| Implement payment verification | `pending` | Webhook or polling |
| Add multiple price feed sources | `pending` | CoinGecko + backup (Binance, etc.) |
| Implement wallet balance checks | `pending` | Alert when low |
| Add transaction queue for disbursement | `pending` | Background job processing |

---

## Phase 5: Compliance & Legal (Malaysia)
| Task | Status | Notes |
|------|--------|-------|
| Research BNM/SC Malaysia regulations | `pending` | **BLOCKER** - Legal requirement |
| Implement KYC flow (> threshold) | `pending` | MyKad verification |
| Add transaction limits per user/day | `pending` | Regulatory compliance |
| Create Terms of Service | `pending` | Legal document |
| Create Privacy Policy (PDPA) | `pending` | Malaysian data protection |
| Implement audit logging | `pending` | Full transaction trail |

---

## Phase 6: Monitoring & Operations
| Task | Status | Notes |
|------|--------|-------|
| Set up error tracking (Sentry) | `pending` | |
| Add structured logging (Pino) | `pending` | |
| Create admin analytics dashboard | `pending` | Volume, conversion rates |
| Set up uptime monitoring | `pending` | Alerts on downtime |
| Configure database backups | `pending` | Daily + point-in-time |

---

## Phase 7: Testing
| Task | Status | Notes |
|------|--------|-------|
| Write unit tests (business logic) | `pending` | Vitest |
| Write API integration tests | `pending` | Supertest |
| Write E2E tests (Playwright) | `pending` | Full customer flow |
| Security penetration testing | `pending` | Before launch |
| Load testing | `pending` | Concurrent users |

---

## Phase 8: UI/UX Polish
| Task | Status | Notes |
|------|--------|-------|
| Add loading states and skeletons | `pending` | |
| Implement error handling UI | `pending` | User-friendly messages |
| Add multi-language (EN/BM) | `pending` | i18n setup |
| Accessibility audit (WCAG) | `pending` | |
| Mobile responsiveness testing | `pending` | |

---

## Phase 9: Launch Preparation
| Task | Status | Notes |
|------|--------|-------|
| Create operational runbook | `pending` | Incident response |
| Document API | `pending` | OpenAPI/Swagger |
| Set up customer support channel | `pending` | Telegram group or helpdesk |
| Beta test with limited users | `pending` | Soft launch |
| Production deployment | `pending` | DNS cutover |

---

## N8N Workflows (Backend) ✅ DEPLOYED & TESTED

The backend is powered by n8n workflows on `alumist-n8n` VPS (`ssh root@45.159.230.42 -p 1511`).

| Workflow | ID | Endpoint | Status |
|----------|-----|----------|--------|
| wf-01-price-feed | IVUYUXry0mrZa4IX | Schedule (5 min) | ✅ Active |
| wf-02-order-submit | 6Hqe4GtzyFjt3Ohx | `POST /webhook/order/submit` | ✅ Tested |
| wf-03-status-update | KlFiRgwBWe4El78q | `POST /webhook/order/status` | ✅ Tested |
| wf-04-order-lookup | JiG4zLRi1kBYKpYP | `GET /webhook/order/lookup?id=ORDERID` | ✅ Tested |
| wf-05-admin-orders | uNwjBIjVYGXh46nL | `GET /webhook/admin/orders` | ✅ Tested |
| wf-06-admin-stats | GniwbrtaChMXcSaE | `GET /webhook/admin/stats` | ✅ Tested |
| wf-07-error-handler | owoBS0uJhf8JPcaP | Error workflow | ⏸️ Inactive |

### API Authentication

| Header | Value | Used By |
|--------|-------|---------|
| `X-API-Key` | `77768a4aa5da6d70a1cd5e5adc7e28ef59858a320b1a0b5133fc5f1ad5c5165d` | wf-02 |
| `X-Admin-Key` | `7749a10b62c81a4c9b8f429b80fc9b797997506345a26ca802857b7049c5165d` | wf-03, wf-05, wf-06 |

### Database Credentials

| Database | Host | User | Password |
|----------|------|------|----------|
| `cryptico_kiosk` | localhost | alumist | `TVw2xISldsFov7O5ksjr7SYYwazR4if` |
| `alumist_n8n` | localhost | alumist | (same) |

### N8N Credential IDs

| Credential | ID | Type |
|------------|-----|------|
| Cryptico PostgreSQL | `XBVFwEM8RKk32yyj` | postgres |
| Cryptico API Key | `B9IPRA0h6bahkCwZ` | httpHeaderAuth |
| Cryptico Admin Key | `L7j6V9fwqAW2mVNn` | httpHeaderAuth |

**N8N Access:** `https://alumist.alumga.com/projects/CcNtl9Ch6q6lBF14/folders/RxsaUrL1CV9ey1qX/workflows`

### Known Limitations

- **Path parameters not supported**: n8n deployment doesn't match `:param` style paths. Use query params instead.
- **wf-04 uses `?id=` not `/lookup/:orderId`**: Changed due to webhook routing limitation.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-15 | Initial CLAUDE.md created with production roadmap |
| 2026-01-15 | **Phase 1 Complete**: Migrated to modular Vite/React/TS structure, env vars, ESLint, CI/CD |
| 2026-01-16 | **N8N Backend**: All 7 workflows converted from Supabase to PostgreSQL |
| 2026-01-16 | **Coins Updated**: Changed from BNB/MATIC to BTC/ETH/SOL/ICP |
| 2026-01-16 | **Price Feed**: Fixed IF node v2 syntax, per-coin error detection, Telegram alerts |
| 2026-01-16 | **All Workflows Tested**: wf-02 through wf-06 deployed and verified working |
| 2026-01-16 | **wf-04 Fix**: Changed from path params to query params due to n8n limitation |
| 2026-01-16 | **DB Schema Fix**: Updated orders table CHECK constraints for new coins |
