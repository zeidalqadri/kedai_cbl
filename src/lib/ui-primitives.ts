// UI Primitives - Centralized design tokens for glassmorphic aesthetic
// CBL Popshop - Adapted from cryptico with CBL orange theme

// ============================================================================
// UTILITY: Class name combiner (replaces clsx + tailwind-merge for simplicity)
// ============================================================================

export const cx = (...classes: (string | boolean | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ')

// ============================================================================
// LAYOUT PRIMITIVES - Mobile-first with safe areas
// ============================================================================

export const layout = {
  // Use h-dvh instead of h-screen for proper mobile viewport
  page: 'h-dvh bg-[#07070A] text-white selection:bg-cbl-orange/20 selection:text-white',

  // Safe area padding for iOS notch and home bar
  safeTop: 'pt-[env(safe-area-inset-top,0px)]',
  safeBottom: 'pb-[env(safe-area-inset-bottom,0px)]',
  safeLeft: 'pl-[env(safe-area-inset-left,0px)]',
  safeRight: 'pr-[env(safe-area-inset-right,0px)]',
  safeAll: 'pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]',

  // Centered backdrop with gradient (CBL orange tint)
  backdrop: 'h-dvh flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,107,53,0.05),_transparent_60%)]',

  // Shop shell - responsive sizing
  // Mobile: full width card, Desktop: expands to fill available space
  shopShell: cx(
    'w-full rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col',
    // Mobile: use available height with safe areas
    'h-[calc(100dvh-2rem)]',
    // Tablet: moderate height constraint
    'sm:h-[min(900px,calc(100dvh-4rem))]',
    // Desktop+: expand to fill width (with max for readability)
    'lg:max-w-5xl',      // 1024px
    'xl:max-w-6xl',      // 1152px
    '2xl:max-w-7xl'      // 1280px
  ),

  // Screen content wrapper with responsive padding
  screenContent: cx(
    'flex flex-col h-full',
    'px-4 py-5',       // Mobile
    'sm:px-6 sm:py-8', // Tablet
    'lg:px-8 lg:py-8'  // Desktop: more horizontal room
  ),
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

export const ui = {
  // Header bar
  header: 'flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm',
  subheaderMono: 'text-white/50 text-xs font-mono',

  // Cards - glassmorphic style
  card: 'rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm',
  cardSoft: 'rounded-2xl border border-white/10 bg-white/[0.03]',
  cardHover: 'hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200',
  cardInteractive: cx(
    'rounded-2xl border border-white/10 bg-white/[0.03]',
    'hover:border-white/20 hover:bg-white/[0.05]',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cbl-orange/20'
  ),

  // Product card with image
  productCard: cx(
    'rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden',
    'hover:border-cbl-orange/30 hover:bg-white/[0.05]',
    'active:scale-[0.98]',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cbl-orange/20'
  ),

  // Pills and badges
  pill: 'inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04]',
  badge: 'px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/[0.04]',
  badgeOrange: 'px-3 py-1 rounded-full text-xs font-medium border border-cbl-orange/30 bg-cbl-orange/10 text-cbl-orange',

  // Inputs - with proper focus states and touch targets
  input: cx(
    'w-full bg-black/20 border-2 border-white/10 rounded-xl',
    'px-4 py-3 min-h-[48px]', // ≥48px touch target
    'text-white placeholder:text-white/30',
    'focus:outline-none focus:border-cbl-orange focus:ring-4 focus:ring-cbl-orange/20',
    'transition-all'
  ),
  textarea: cx(
    'w-full bg-black/20 border-2 border-white/10 rounded-xl',
    'px-4 py-3 min-h-[48px]',
    'text-white placeholder:text-white/30',
    'focus:outline-none focus:border-cbl-orange focus:ring-4 focus:ring-cbl-orange/20',
    'resize-none transition-all'
  ),
  select: cx(
    'w-full bg-black/20 border-2 border-white/10 rounded-xl',
    'px-4 py-3 min-h-[48px]',
    'text-white',
    'focus:outline-none focus:border-cbl-orange focus:ring-4 focus:ring-cbl-orange/20',
    'transition-all appearance-none cursor-pointer'
  ),

  // Buttons - all with ≥48px touch targets
  btnBase: cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
    'min-h-[48px] px-4', // ≥48px touch target
    'transition-all active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-white/15'
  ),
  btnGhost: 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/10',
  btnQuiet: 'bg-transparent hover:bg-white/[0.04] text-white/70 border border-transparent',
  btnPrimary: 'bg-cbl-orange hover:bg-cbl-orange-dark text-white hover:scale-[1.01] active:scale-[0.98]',
  btnDanger: 'bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/25',

  // Back button - specific styling with touch target
  backBtn: cx(
    'inline-flex items-center gap-2 min-h-[44px] min-w-[44px] -ml-2 px-2',
    'text-white/55 hover:text-white rounded-lg',
    'transition-colors',
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-white/15'
  ),

  // Size selector buttons
  sizeBtn: cx(
    'min-w-[48px] min-h-[48px] rounded-xl border-2 border-white/15',
    'text-white font-medium',
    'transition-all duration-200',
    'hover:border-white/30 hover:bg-white/[0.05]',
    'focus:outline-none focus-visible:ring-4 focus-visible:ring-cbl-orange/20'
  ),
  sizeBtnSelected: 'border-cbl-orange bg-cbl-orange/15 text-cbl-orange',
  sizeBtnDisabled: 'opacity-40 cursor-not-allowed line-through',

  // Quantity stepper
  quantityBtn: cx(
    'w-10 h-10 rounded-lg border border-white/15 bg-white/[0.04]',
    'text-white text-lg font-bold',
    'transition-all',
    'hover:bg-white/[0.08] active:scale-95',
    'disabled:opacity-30 disabled:cursor-not-allowed'
  ),

  // Error states
  error: 'bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center',

  // Divider
  divider: 'border-t border-white/10',
  dividerVertical: 'border-l border-white/10',
}

// ============================================================================
// TYPOGRAPHY - with text-balance for headings
// ============================================================================

export const text = {
  // Colors
  primary: 'text-white',
  secondary: 'text-white/55',
  tertiary: 'text-white/45',
  disabled: 'text-white/30',
  subtle: 'text-white/35',
  orange: 'text-cbl-orange',

  // Headings - with text-balance for proper wrapping
  h1: 'text-3xl font-bold text-white tracking-tight text-balance',
  h2: 'text-2xl font-bold text-white tracking-tight text-balance',
  h3: 'text-xl font-semibold text-white tracking-tight text-balance',

  // Body - with text-pretty for optimal line breaks
  body: 'text-base text-white/80 text-pretty',
  bodySmall: 'text-sm text-white/55 text-pretty',

  // Mono for codes/IDs
  mono: 'font-mono',
  monoSmall: 'font-mono text-sm',

  // Numeric (tabular figures)
  numeric: 'tabular-nums',

  // Price styling
  price: 'text-cbl-orange font-bold tabular-nums',
  priceStrike: 'text-white/40 line-through tabular-nums',
}

// ============================================================================
// STATUS STYLES
// ============================================================================

export const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/25',
  confirmed: 'bg-teal-500/15 text-teal-200 border border-teal-500/25',
  processing: 'bg-blue-500/15 text-blue-200 border border-blue-500/25',
  shipped: 'bg-purple-500/15 text-purple-200 border border-purple-500/25',
  delivered: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-200 border border-red-500/25',
  refunded: 'bg-white/10 text-white/50 border border-white/15',
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

export const spinner = {
  base: 'rounded-full animate-spin',
  default: 'border-4 border-white/15 border-t-cbl-orange',
  small: 'size-5 border-2 border-white/15 border-t-cbl-orange',
  medium: 'size-8 border-2 border-white/15 border-t-cbl-orange',
  large: 'size-20 border-4 border-white/15 border-t-cbl-orange',
}

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  modal: 'z-30',
  toast: 'z-40',
  tooltip: 'z-50',
}
