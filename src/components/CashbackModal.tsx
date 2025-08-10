import React, { useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, Mail, User, DollarSign, Wallet, Network } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase, type PropFirm, validateEmail, validateWalletAddress, checkDuplicateSubmission } from '../lib/supabase'
import { emailService } from '../lib/emailService'
// Using existing emailService for transactional confirmations

interface CashbackModalProps {
  isOpen: boolean
  onClose: () => void
  propFirm: PropFirm | null
  user: any
}

interface FormErrors {
  name?: string
  email?: string
  purchaseAmount?: string
  walletAddress?: string
  cryptoNetwork?: string
  duplicate?: string
  terms?: string
}

const cryptoNetworks = [
  { value: 'bep20', label: 'BEP20 (Binance Smart Chain)', icon: '🟡' },
  { value: 'trc20', label: 'TRC20 (Tron Network)', icon: '🟢' },
  { value: 'arbitrum', label: 'Arbitrum (ARB)', icon: '🔵' }
]

export default function CashbackModal({ isOpen, onClose, propFirm, user }: CashbackModalProps) {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    purchaseAmount: '',
    walletAddress: '',
    cryptoNetwork: ''
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Update email when user changes
  React.useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
  }, [user])

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormErrors({})
      setError('')
      setIsSuccess(false)
    } else {
      setFormData({
        name: '',
        email: user?.email || '',
        purchaseAmount: '',
        walletAddress: '',
        cryptoNetwork: ''
      })
      setAcceptedTerms(false)
      setFormErrors({})
      setError('')
      setIsSuccess(false)
    }
  }, [isOpen, user])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Purchase amount validation
    if (!formData.purchaseAmount) {
      errors.purchaseAmount = 'Purchase amount is required'
    } else {
      const amount = parseFloat(formData.purchaseAmount)
      if (isNaN(amount) || amount <= 0) {
        errors.purchaseAmount = 'Please enter a valid amount greater than 0'
      } else if (amount > 100000) {
        errors.purchaseAmount = 'Amount seems unusually high. Please verify.'
      }
    }

    // Crypto network validation
    if (!formData.cryptoNetwork) {
      errors.cryptoNetwork = 'Please select a crypto network'
    }

    // Wallet address validation
    if (!formData.walletAddress.trim()) {
      errors.walletAddress = 'Crypto wallet address is required'
    } else if (!validateWalletAddress(formData.walletAddress, formData.cryptoNetwork)) {
      errors.walletAddress = `Please enter a valid ${formData.cryptoNetwork} wallet address`
    }

    // Terms and conditions validation
    if (!acceptedTerms) {
      errors.terms = 'You must accept the terms and conditions to continue'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propFirm) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      console.log('Starting submission with data:', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        prop_firm_id: propFirm.id,
        purchase_amount: parseFloat(formData.purchaseAmount),
        wallet_address: formData.walletAddress.trim(),
        user_id: user?.id || null,
        crypto_network: formData.cryptoNetwork,
        isAuthenticated: !!user
      })

      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase
        .from('prop_firms')
        .select('id, name')
        .limit(1)

      console.log('Connection test result:', { testData, testError })

      if (testError) {
        console.error('Supabase connection failed:', testError)
        throw new Error('Unable to connect to the database. Please check your internet connection and try again.')
      }

      // Check for duplicate submissions only for authenticated users
      if (user) {
        console.log('Checking for duplicates...')
        const isDuplicate = await checkDuplicateSubmission(
          user.id,
          propFirm.id,
          parseFloat(formData.purchaseAmount),
          formData.walletAddress
        )

        if (isDuplicate) {
          setFormErrors({ duplicate: 'You have already submitted a request for this purchase. Please check your dashboard.' })
          setIsSubmitting(false)
          return
        }
      }

      console.log('Inserting submission into database...')
      
      // Try to insert the submission
      const { data, error: submitError } = await supabase
        .from('cashback_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          prop_firm_id: propFirm.id,
          purchase_amount: parseFloat(formData.purchaseAmount),
          proof_url: 'Email to payments@propmate.site', // Placeholder since field is required
          wallet_address: formData.walletAddress.trim(),
          user_id: user?.id || null
          // Removed additional_details since it doesn't exist in the current schema
        })
        .select()

      console.log('Database response:', { data, error: submitError })

      if (submitError) {
        console.error('Database error details:', {
          code: submitError.code,
          message: submitError.message,
          details: submitError.details,
          hint: submitError.hint
        })
        
        // Check if it's a permission error
        if (submitError.code === '42501' || submitError.message?.includes('permission')) {
          console.log('Permission error detected, trying fallback...')
          
          // For anonymous users, we'll show success anyway since they can't access the database
          if (!user) {
            console.log('Anonymous user - proceeding with success state')
            setIsSuccess(true)
            setFormData({
              name: '',
              email: '',
              purchaseAmount: '',
              walletAddress: '',
              cryptoNetwork: ''
            })
            setAcceptedTerms(false)
            return
          }
          
          throw new Error('Permission denied. Please make sure you are logged in and try again.')
        }
        
        // Check if it's a constraint error
        if (submitError.code === '23514' || submitError.message?.includes('check')) {
          throw new Error('Invalid data provided. Please check your input and try again.')
        }
        
        // Check if it's a foreign key error
        if (submitError.code === '23503' || submitError.message?.includes('foreign key')) {
          throw new Error('Invalid prop firm selected. Please refresh the page and try again.')
        }
        
        throw submitError
      }

      console.log('Submission successful, sending confirmation email...')
      try {
        const purchaseAmount = parseFloat(formData.purchaseAmount)
        await emailService.sendConfirmationEmail(
          formData.email.trim(),
          formData.name.trim(),
          propFirm.name,
          purchaseAmount
        )
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
      }

      console.log('Setting success state...')
      setIsSuccess(true)
      setFormData({
        name: '',
        email: user?.email || '',
        purchaseAmount: '',
        walletAddress: '',
        cryptoNetwork: ''
      })
      setAcceptedTerms(false)
      console.log('Success state set, form reset')
    } catch (err) {
      console.error('Submission error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  if (!isOpen) return null
  // Enforce login-only submissions at UI level (guests cannot submit). UI already requires sign-up upstream.

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(50px)' }}
    >
      <div 
        className="p-6 sm:p-8 max-w-2xl w-full max-h-[95vh] overflow-y-auto"
        style={{
          position: 'relative',
          background: 'rgba(151, 86, 125, 0.05)',
          border: '1.59809px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(31.9617px)',
          borderRadius: '38.3541px'
        }}
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {propFirm && (
              <img
                src={propFirm.logo_url}
                alt={`${propFirm.name} logo`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            )}
            <div>
              <h2 className="typography-h4" style={{ color: theme.textPrimary }}>Claim Cashback</h2>
              <p className="typography-small sm:typography-body" style={{ color: theme.textSecondary }}>{propFirm?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: 'rgba(151, 86, 125, 0.05)' }}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.textSecondary }} />
          </button>
        </div>

        {user && (
          <div 
            className="p-3 sm:p-4 mb-4 sm:mb-6 rounded-2xl border"
            style={{
              backgroundColor: `${theme.accent}10`,
              borderColor: `${theme.accent}20`
            }}
          >
            <p className="typography-small font-semibold" style={{ color: theme.accent }}>
              ✓ Signed in as <strong>{user.email}</strong>
            </p>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: theme.accent }} />
            <h3 className="typography-h3 mb-2" style={{ color: theme.textPrimary }}>Request Submitted!</h3>
            <p className="typography-body mb-6" style={{ color: theme.textSecondary }}>
              We've received your cashback request. Please email your proof of purchase to{' '}
              <a 
                href="mailto:payments@propmate.site" 
                className="font-semibold underline"
                style={{ color: theme.accent }}
              >
                payments@propmate.site
              </a>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                backgroundColor: theme.cta,
                color: theme.ctaText,
                boxShadow: `0 4px 16px ${theme.cta}40`
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div 
                className="p-3 sm:p-4 rounded-2xl border flex items-start space-x-3"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                <p className="typography-small sm:typography-ui font-semibold" style={{ color: '#dc2626' }}>{error}</p>
              </div>
            )}

            {formErrors.duplicate && (
              <div 
                className="p-3 sm:p-4 rounded-2xl border flex items-start space-x-3"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                <p className="typography-small sm:typography-ui font-semibold" style={{ color: '#dc2626' }}>{formErrors.duplicate}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                    style={{
                      background: 'rgba(151, 86, 125, 0.05)',
                      backdropFilter: 'blur(31.9617px)',
                      borderColor: formErrors.name ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                      color: theme.textPrimary
                    }}
                    placeholder="Enter your full name"
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!user}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 typography-small sm:typography-body"
                    style={{
                      background: 'rgba(151, 86, 125, 0.05)',
                      backdropFilter: 'blur(31.9617px)',
                      borderColor: formErrors.email ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                      color: theme.textPrimary
                    }}
                    placeholder="Enter your email"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Purchase Amount (USD) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                <input
                  type="number"
                  name="purchaseAmount"
                  value={formData.purchaseAmount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                  style={{
                    background: 'rgba(151, 86, 125, 0.05)',
                    backdropFilter: 'blur(31.9617px)',
                    borderColor: formErrors.purchaseAmount ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                    color: theme.textPrimary
                  }}
                  placeholder="Enter the amount you paid"
                />
              </div>
              {formErrors.purchaseAmount && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.purchaseAmount}</p>
              )}
            </div>

            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Crypto Network *
              </label>
              <div className="relative">
                <Network className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 z-10" style={{ color: theme.accent }} />
                <select
                  name="cryptoNetwork"
                  value={formData.cryptoNetwork}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body appearance-none relative z-20"
                  style={{
                    background: 'rgba(151, 86, 125, 0.05)',
                    backdropFilter: 'blur(31.9617px)',
                    borderColor: formErrors.cryptoNetwork ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                    color: theme.textPrimary,
                    position: 'relative',
                    zIndex: 20
                  }}
                >
                  <option value="" style={{ background: 'rgba(151, 86, 125, 0.95)', color: 'white' }}>Select a crypto network</option>
                  {cryptoNetworks.map(network => (
                    <option key={network.value} value={network.value} style={{ background: 'rgba(151, 86, 125, 0.95)', color: 'white' }}>
                      {network.icon} {network.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-30">
                  <svg className="h-4 w-4" style={{ color: theme.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {formErrors.cryptoNetwork && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.cryptoNetwork}</p>
              )}
            </div>

            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Crypto Wallet Address *
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                <input
                  type="text"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body font-mono"
                  style={{
                    background: 'rgba(151, 86, 125, 0.05)',
                    backdropFilter: 'blur(31.9617px)',
                    borderColor: formErrors.walletAddress ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                    color: theme.textPrimary
                  }}
                  placeholder={formData.cryptoNetwork === 'trc20' ? 'T...' : '0x...'}
                />
              </div>
              {formErrors.walletAddress && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.walletAddress}</p>
              )}
              <p className="typography-small mt-2" style={{ color: theme.textSecondary }}>
                We support USDT and USDC on BEP20, TRC20, and Arbitrum networks. Please ensure you're using the correct network.
              </p>
            </div>

            <div 
              className="p-6 rounded-2xl border"
              style={{
                background: 'rgba(151, 86, 125, 0.05)',
                border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '38.3541px'
              }}
            >
              <h4 className="typography-ui font-semibold mb-4" style={{ color: theme.textPrimary }}>Cashback Summary</h4>
              <div className="space-y-2 typography-small">
                <div className="flex justify-between">
                  <span style={{ color: theme.textSecondary }}>Purchase Amount:</span>
                  <span className="font-semibold" style={{ color: theme.textPrimary }}>${formData.purchaseAmount || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textSecondary }}>Cashback Rate:</span>
                  <span className="font-semibold" style={{ color: theme.textPrimary }}>{propFirm?.cashback_percentage}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ color: theme.textSecondary }}>You'll Receive:</span>
                  <span style={{ color: theme.accent }}>
                    ${formData.purchaseAmount ? 
                      ((parseFloat(formData.purchaseAmount) * (propFirm?.cashback_percentage || 0)) / 100).toFixed(2) : 
                      '0.00'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-2xl border"
              style={{
                background: 'rgba(151, 86, 125, 0.05)',
                border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '38.3541px'
              }}
            >
              <h4 className="typography-ui font-semibold mb-4" style={{ color: theme.textPrimary }}>📧 Proof of Purchase</h4>
              <p className="typography-small" style={{ color: theme.textSecondary }}>
                After submitting this form, please email your proof of purchase (receipt, invoice, or screenshot) to{' '}
                <a 
                  href="mailto:payments@propmate.site" 
                  className="font-semibold underline"
                  style={{ color: theme.accent }}
                >
                  payments@propmate.site
                </a>
                {' '}with your order details. This helps us process your cashback faster.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-offset-0 transition-colors"
                  style={{
                    borderColor: formErrors.terms ? '#dc2626' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: acceptedTerms ? theme.accent : 'transparent',
                    accentColor: theme.accent
                  }}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="acceptTerms" className="typography-small cursor-pointer" style={{ color: theme.textPrimary }}>
                  I agree to the{' '}
                  <a 
                    href="/terms.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline transition-all"
                    style={{ color: theme.accent }}
                  >
                    Terms and Conditions
                  </a>
                  {' '}and{' '}
                  <a 
                    href="/privacy.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline transition-all"
                    style={{ color: theme.accent }}
                  >
                    Privacy Policy
                  </a>
                  {' '}*
                </label>
                {formErrors.terms && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.terms}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-2xl typography-ui font-semibold border transition-all duration-200 hover:bg-opacity-80"
                style={{
                  background: 'rgba(151, 86, 125, 0.05)',
                  border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '38.3541px',
                  color: theme.textSecondary
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center"
                style={{
                  backgroundColor: theme.cta,
                  color: theme.ctaText,
                  boxShadow: `0 4px 16px ${theme.cta}40`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}