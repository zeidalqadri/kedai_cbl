import { useState } from 'react'
import { ShopMode } from './components/shop/ShopMode'
import { AdminMode } from './components/admin/AdminMode'

type AppMode = 'shop' | 'admin'

export default function App() {
  const [mode, setMode] = useState<AppMode>('shop')

  return (
    <>
      {mode === 'shop' && <ShopMode onAdminClick={() => setMode('admin')} />}
      {mode === 'admin' && <AdminMode onExitAdmin={() => setMode('shop')} />}
    </>
  )
}
