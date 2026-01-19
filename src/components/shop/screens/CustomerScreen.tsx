import { layout, ui, cx, text } from '../../../lib/ui-primitives'
import { BackIcon } from '../../icons'
import { MALAYSIAN_STATES } from '../../../types'
import { validatePhone, validateEmail, validatePostcode } from '../../../lib/utils'
import type { useShop } from '../../../hooks/useShop'

interface CustomerScreenProps {
  shop: ReturnType<typeof useShop>
}

export function CustomerScreen({ shop }: CustomerScreenProps) {
  const { setScreen, customer, setCustomer, error, setError } = shop

  const updateField = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setCustomer({
        ...customer,
        address: { ...customer.address, [addressField]: value },
      })
    } else {
      setCustomer({ ...customer, [field]: value })
    }
  }

  const handleContinue = () => {
    // Validation
    if (!customer.name.trim()) {
      setError('Please enter your name')
      return
    }

    const phoneValidation = validatePhone(customer.phone)
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Invalid phone number')
      return
    }

    const emailValidation = validateEmail(customer.email)
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Invalid email')
      return
    }

    if (!customer.address.line1.trim()) {
      setError('Please enter your street address')
      return
    }

    if (!customer.address.city.trim()) {
      setError('Please enter your city')
      return
    }

    if (!customer.address.state) {
      setError('Please select your state')
      return
    }

    const postcodeValidation = validatePostcode(customer.address.postcode)
    if (!postcodeValidation.valid) {
      setError(postcodeValidation.error || 'Invalid postcode')
      return
    }

    setError('')
    setScreen('payment')
  }

  return (
    <div className={layout.screenContent}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('cart')}
          className={ui.backBtn}
          aria-label="Back to cart"
        >
          <BackIcon aria-hidden="true" /> <span>Back</span>
        </button>
        <h2 className={text.h3}>Your Details</h2>
        <div className="w-16" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto -mx-4 px-4">
        <div className="space-y-4">
          {/* Contact Info */}
          <div>
            <h3 className={cx('text-sm font-medium mb-3', text.secondary)}>
              Contact Information
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={customer.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Full Name"
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Phone Number (e.g., 012-345 6789)"
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Email Address"
                  className={ui.input}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className={cx('text-sm font-medium mb-3', text.secondary)}>
              Shipping Address
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="line1" className="sr-only">Street Address</label>
                <input
                  id="line1"
                  type="text"
                  value={customer.address.line1}
                  onChange={(e) => updateField('address.line1', e.target.value)}
                  placeholder="Street Address"
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="line2" className="sr-only">Unit/Apartment (optional)</label>
                <input
                  id="line2"
                  type="text"
                  value={customer.address.line2 || ''}
                  onChange={(e) => updateField('address.line2', e.target.value)}
                  placeholder="Unit / Apartment (optional)"
                  className={ui.input}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="sr-only">City</label>
                  <input
                    id="city"
                    type="text"
                    value={customer.address.city}
                    onChange={(e) => updateField('address.city', e.target.value)}
                    placeholder="City"
                    className={ui.input}
                  />
                </div>
                <div>
                  <label htmlFor="postcode" className="sr-only">Postcode</label>
                  <input
                    id="postcode"
                    type="text"
                    value={customer.address.postcode}
                    onChange={(e) => updateField('address.postcode', e.target.value)}
                    placeholder="Postcode"
                    maxLength={5}
                    className={ui.input}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="state" className="sr-only">State</label>
                <select
                  id="state"
                  value={customer.address.state}
                  onChange={(e) => updateField('address.state', e.target.value)}
                  className={cx(ui.select, !customer.address.state && 'text-white/30')}
                >
                  <option value="" disabled>Select State</option>
                  {MALAYSIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={cx(ui.error, 'mt-4')} role="alert">
            {error}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <button
          onClick={handleContinue}
          className={cx(ui.btnBase, ui.btnPrimary, 'w-full py-4 font-bold text-lg')}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}
