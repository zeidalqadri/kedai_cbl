// UI Primitives - Centralized design tokens for glassmorphic aesthetic
// Based on cryptokedai.jsx reference design

// Utility function for combining class names
export const cx = (...classes: (string | boolean | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ')

// ============================================================================
// UI PRIMITIVES OBJECT
// ============================================================================

export const ui = {
  // Base page and layout
  page: 'min-h-screen bg-[#07070A] text-white selection:bg-white/20 selection:text-white',
  backdrop:
    'min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.10),_transparent_60%)]',
  kioskShell:
    'w-full max-w-md h-[750px] rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col',

  // Header
  header: 'flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20 backdrop-blur',
  subheaderMono: 'text-white/50 text-xs font-mono',

  // Cards
  card: 'rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm',
  cardSoft: 'rounded-2xl border border-white/10 bg-white/[0.03]',
  cardHover: 'hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200',

  // Pills and badges
  pill: 'inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04]',
  badge: 'px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/[0.04]',

  // Inputs
  input:
    'w-full bg-black/20 border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all',
  textarea:
    'w-full bg-black/20 border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 resize-none transition-all',

  // Buttons
  btnBase:
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-white/15',
  btnGhost: 'bg-white/[0.04] hover:bg-white/[0.06] text-white/80 border border-white/10',
  btnQuiet: 'bg-transparent hover:bg-white/[0.03] text-white/70 border border-transparent',
  btnPrimary: 'hover:scale-[1.01] active:scale-[0.98]',

  // Error states
  error: 'bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center',

  // Selection cards (crypto/network selection)
  selectionCard:
    'w-full p-5 rounded-2xl border-2 border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]',
}

// ============================================================================
// TYPOGRAPHY SCALE (white opacity)
// ============================================================================

export const text = {
  primary: 'text-white',
  secondary: 'text-white/55',
  tertiary: 'text-white/45',
  disabled: 'text-white/30',
  subtle: 'text-white/35',
}

// ============================================================================
// STATUS CHIP STYLES
// ============================================================================

export const statusStyles = {
  pending: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/25',
  approved: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/25',
  completed: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-200 border-red-500/25',
  cancelled: 'bg-gray-500/15 text-gray-200 border-gray-500/25',
}

// ============================================================================
// VALIDATION INDICATOR STYLES
// ============================================================================

export const validationStyles = {
  valid: 'bg-emerald-400',
  invalid: 'bg-rose-400',
  empty: 'bg-white/20',
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

export const spinner = {
  base: 'rounded-full animate-spin',
  default: 'border-4 border-white/15 border-t-indigo-400',
  small: 'w-5 h-5 border-2 border-white/15 border-t-indigo-400',
  medium: 'w-8 h-8 border-2 border-white/15 border-t-indigo-400',
  large: 'w-20 h-20 border-4 border-white/15 border-t-indigo-400',
}

// ============================================================================
// RATE PILL STYLES
// ============================================================================

export const ratePill = {
  base: 'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
  active: 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/20',
  expired: 'bg-red-500/10 text-red-200 border border-red-500/20',
}
