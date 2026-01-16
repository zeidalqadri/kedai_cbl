import { CRYPTO_ASSETS, NETWORKS } from '../../../lib/constants'
import { formatMYR, formatCrypto, validateWalletAddress } from '../../../lib/utils'
import { ui, cx, text, ratePill, validationStyles } from '../../../lib/ui-primitives'
import { BackIcon } from '../../icons'
import type { useKiosk } from '../../../hooks/useKiosk'

interface DetailsScreenProps {
  kiosk: ReturnType<typeof useKiosk>
}

export function DetailsScreen({ kiosk }: DetailsScreenProps) {
  const {
    selectedCrypto,
    selectedNetwork,
    amount,
    cryptoAmount,
    rateLockRemaining,
    userDetails,
    setUserDetails,
    error,
    submitDetails,
    setScreen,
  } = kiosk

  if (!selectedCrypto || !selectedNetwork) return null

  const asset = CRYPTO_ASSETS[selectedCrypto]
  const network = NETWORKS[selectedNetwork]
  const addressValidation = validateWalletAddress(userDetails.walletAddress, selectedNetwork)

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('amount')}
          className={cx(ui.btnBase, ui.btnQuiet, "px-0 py-0 hover:text-white")}
        >
          <span className={cx("flex items-center gap-2", text.secondary, "hover:text-white transition-colors")}>
            <BackIcon /> Back
          </span>
        </button>
        {rateLockRemaining > 0 && (
          <div className={cx(ratePill.base, ratePill.active)}>
            <span aria-hidden>⏱</span>
            <span>
              Rate locked: {Math.floor(rateLockRemaining / 60)}:
              {(rateLockRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Your Details</h2>
        <p className={cx("text-sm mt-1", text.secondary)}>We'll contact you for verification</p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div>
            <label className={cx("text-sm mb-2 block", text.secondary)}>Full Name *</label>
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              placeholder="Ahmad bin Abdullah"
              className={ui.input}
            />
          </div>

          <div>
            <label className={cx("text-sm mb-2 block", text.secondary)}>Contact Method *</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() =>
                  setUserDetails({ ...userDetails, contactType: 'telegram', contact: '' })
                }
                className={cx(
                  ui.btnBase,
                  "py-3",
                  userDetails.contactType === 'telegram'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : cx(ui.btnGhost, text.secondary)
                )}
              >
                📱 Telegram
              </button>
              <button
                onClick={() =>
                  setUserDetails({ ...userDetails, contactType: 'email', contact: '' })
                }
                className={cx(
                  ui.btnBase,
                  "py-3",
                  userDetails.contactType === 'email'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : cx(ui.btnGhost, text.secondary)
                )}
              >
                ✉️ Email
              </button>
            </div>
            <input
              type={userDetails.contactType === 'email' ? 'email' : 'text'}
              value={userDetails.contact}
              onChange={(e) => setUserDetails({ ...userDetails, contact: e.target.value })}
              placeholder={
                userDetails.contactType === 'telegram' ? '@your_username' : 'you@email.com'
              }
              className={ui.input}
            />
          </div>

          <div>
            <label className={cx("text-sm mb-2 block", text.secondary)}>
              {selectedCrypto} Wallet Address ({selectedNetwork}) *
            </label>
            <textarea
              value={userDetails.walletAddress}
              onChange={(e) =>
                setUserDetails({ ...userDetails, walletAddress: e.target.value.trim() })
              }
              placeholder={`${network.addressPrefix}...`}
              rows={2}
              className={cx(ui.textarea, "font-mono text-sm")}
            />
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cx(
                  "w-2 h-2 rounded-full",
                  addressValidation.valid
                    ? validationStyles.valid
                    : userDetails.walletAddress
                      ? validationStyles.invalid
                      : validationStyles.empty
                )}
                aria-hidden
              />
              <span className={cx("text-xs", text.tertiary)}>{network.name} address</span>
            </div>
          </div>

          {error && (
            <div className={ui.error} role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className={cx(ui.cardSoft, "p-4")}>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className={text.secondary}>Amount</span>
                <span className="text-white">{formatMYR(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className={text.secondary}>You receive</span>
                <span className="font-mono" style={{ color: asset.color }}>
                  {formatCrypto(cryptoAmount, 4)} {selectedCrypto}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={submitDetails}
            className={cx(ui.btnBase, ui.btnPrimary, "w-full py-4 font-bold text-lg")}
            style={{ backgroundColor: asset.color, color: 'white' }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  )
}
