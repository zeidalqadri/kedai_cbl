/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_TOKEN: string
  readonly VITE_TELEGRAM_CHAT_ID: string
  readonly VITE_BUSINESS_NAME: string
  readonly VITE_BUSINESS_TAGLINE: string
  readonly VITE_SUPPORT_TELEGRAM: string
  readonly VITE_SUPPORT_EMAIL: string
  readonly VITE_DUITNOW_QR_IMAGE: string
  readonly VITE_MIN_AMOUNT: string
  readonly VITE_MAX_AMOUNT: string
  readonly VITE_RATE_MARKUP: string
  readonly VITE_RATE_LOCK_DURATION: string
  readonly VITE_ADMIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
