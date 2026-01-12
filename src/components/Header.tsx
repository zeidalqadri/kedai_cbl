import { ShoppingBag } from 'lucide-react'
import { cn } from '../lib/utils'

interface HeaderProps {
  cartItemCount: number
  onCartClick: () => void
}

export function Header({ cartItemCount, onCartClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-cbl-dark/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-10 sm:size-12 rounded-full bg-cbl-orange flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-white">CBL</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">Kedai CBL</h1>
              <p className="text-xs text-white/60">Official Store</p>
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className={cn(
              'relative p-3 rounded-full transition-all duration-200',
              'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cbl-orange focus:ring-offset-2 focus:ring-offset-cbl-dark',
              cartItemCount > 0 && 'bg-white/5'
            )}
            aria-label={`Shopping cart with ${cartItemCount} items`}
          >
            <ShoppingBag className="size-6 text-white" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-cbl-orange rounded-full flex items-center justify-center text-xs font-bold text-white">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
