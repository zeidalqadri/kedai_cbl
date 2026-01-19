/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_ADMIN_API_KEY: string
  readonly VITE_BUSINESS_NAME: string
  readonly VITE_BUSINESS_TAGLINE: string
  readonly VITE_SUPPORT_TELEGRAM: string
  readonly VITE_SUPPORT_EMAIL: string
  readonly VITE_DUITNOW_QR_IMAGE: string
  readonly VITE_FREE_SHIPPING_THRESHOLD: string
  readonly VITE_ADMIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
