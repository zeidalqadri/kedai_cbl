import { useState } from 'react'
import { useKiosk } from '../../hooks/useKiosk'
import { config } from '../../config'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { NetworkScreen } from './screens/NetworkScreen'
import { AmountScreen } from './screens/AmountScreen'
import { DetailsScreen } from './screens/DetailsScreen'
import { PaymentScreen } from './screens/PaymentScreen'
import { ConfirmScreen } from './screens/ConfirmScreen'
import { ProcessingScreen } from './screens/ProcessingScreen'
import { LookupScreen } from './screens/LookupScreen'

interface KioskModeProps {
  onAdminAccess: () => void
}

export function KioskMode({ onAdminAccess }: KioskModeProps) {
  const kiosk = useKiosk()
  const [adminPressStart, setAdminPressStart] = useState<number | null>(null)

  // Handle long press for admin access
  const handleLogoPress = () => setAdminPressStart(Date.now())
  const handleLogoRelease = () => {
    if (adminPressStart && Date.now() - adminPressStart > 3000) {
      onAdminAccess()
    }
    setAdminPressStart(null)
  }

  const renderScreen = () => {
    switch (kiosk.screen) {
      case 'welcome':
        return (
          <WelcomeScreen
            kiosk={kiosk}
            onLogoPress={handleLogoPress}
            onLogoRelease={handleLogoRelease}
            onLogoLeave={() => setAdminPressStart(null)}
          />
        )
      case 'network':
        return <NetworkScreen kiosk={kiosk} />
      case 'amount':
        return <AmountScreen kiosk={kiosk} />
      case 'details':
        return <DetailsScreen kiosk={kiosk} />
      case 'payment':
        return <PaymentScreen kiosk={kiosk} />
      case 'confirm':
        return <ConfirmScreen kiosk={kiosk} />
      case 'processing':
        return <ProcessingScreen kiosk={kiosk} />
      case 'lookup':
        return <LookupScreen kiosk={kiosk} />
      default:
        return <WelcomeScreen kiosk={kiosk} onLogoPress={handleLogoPress} onLogoRelease={handleLogoRelease} onLogoLeave={() => setAdminPressStart(null)} />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md h-[750px] bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/80">
          <span className="text-gray-500 text-xs font-mono">{config.businessName}</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-500 text-xs">Live</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderScreen()}</div>
      </div>
    </div>
  )
}
