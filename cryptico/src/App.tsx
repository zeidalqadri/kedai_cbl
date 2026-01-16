import { useState } from 'react'
import { KioskMode } from './components/kiosk/KioskMode'
import { AdminMode } from './components/admin/AdminMode'

type AppMode = 'kiosk' | 'admin'

export default function App() {
  const [mode, setMode] = useState<AppMode>('kiosk')
  const [adminAuth, setAdminAuth] = useState(false)

  const handleAdminAccess = () => {
    setMode('admin')
  }

  const handleExitAdmin = () => {
    setMode('kiosk')
    setAdminAuth(false)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {mode === 'kiosk' ? (
        <KioskMode onAdminAccess={handleAdminAccess} />
      ) : (
        <AdminMode
          isAuthenticated={adminAuth}
          onAuthenticate={setAdminAuth}
          onExit={handleExitAdmin}
        />
      )}
    </div>
  )
}
