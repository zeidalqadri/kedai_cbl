import { useState } from 'react'
import { config } from '../../config'
import { AdminDashboard } from './AdminDashboard'

interface AdminModeProps {
  onExitAdmin: () => void
}

export function AdminMode({ onExitAdmin }: AdminModeProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (password === config.adminPassword) {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <p className="text-gray-400 text-sm mt-1">Enter password to continue</p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white mb-4 focus:border-cbl-orange focus:outline-none transition-colors"
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-cbl-orange hover:bg-cbl-orange-dark text-white font-medium transition-colors mb-4"
          >
            Login
          </button>

          <button
            onClick={onExitAdmin}
            className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboard onExit={onExitAdmin} />
}
