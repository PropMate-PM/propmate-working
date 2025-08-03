import React, { useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase, type PropFirm, validateEmail, validateEthereumAddress, validateUrl, checkDuplicateSubmission } from '../lib/supabase'
import { emailService } from '../lib/emailService'

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
  proofUrl?: string
  walletAddress?: string
  duplicate?: string
}

export default function CashbackModal({ isOpen, onClose, propFirm, user }: CashbackModalProps) {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    purchaseAmount: '',
    proofUrl: '',
    walletAddress: ''
  })
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
        proofUrl: '',
        walletAddress: ''
      })
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

    // Proof URL validation
    if (!formData.proofUrl.trim()) {
      errors.proofUrl = 'Proof of purchase is required'
    } else if (!validateUrl(formData.proofUrl)) {
      errors.proofUrl = 'Please enter a valid URL'
    }

    // Wallet address validation
    if (!formData.walletAddress.trim()) {
      errors.walletAddress = 'Crypto wallet address is required'
    } else if (!validateEthereumAddress(formData.walletAddress)) {
      errors.walletAddress = 'Please enter a valid Ethereum address (0x...)'
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
      // Check for duplicate submissions
      if (user) {
        const isDuplicate = await checkDuplicateSubmission(
          user.id,
          propFirm.id,
          parseFloat(formData.purchaseAmount),
          formData.proofUrl
        )

        if (isDuplicate) {
          setFormErrors({ duplicate: 'You have already submitted a request for this purchase. Please check your dashboard.' })
          return
        }
      }

      const { error: submitError } = await supabase
        .from('cashback_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          prop_firm_id: propFirm.id,
          purchase_amount: parseFloat(formData.purchaseAmount),
          proof_url: formData.proofUrl.trim(),
          wallet_address: formData.walletAddress.trim(),
          user_id: user?.id || null
        })

      if (submitError) throw submitError

      // Send confirmation email
      try {
        await emailService.sendConfirmationEmail(
          formData.email.trim(),
          formData.name.trim(),
          propFirm.name,
          parseFloat(formData.purchaseAmount)
        )
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail the submission if email fails
      }

      setIsSuccess(true)
      setFormData({
        name: '',
        email: user?.email || '',
        purchaseAmount: '',
        proofUrl: '',
        walletAddress: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(20px)' }}
    >
      <div 
        className="p-6 sm:p-8 max-w-2xl w-full max-h-[95vh] overflow-y-auto rounded-2xl border"
        style={{
          backgroundColor: theme.cardBackground,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: theme.cardBorder,
          boxShadow: `${theme.cardShadow}, 0 0 0 1px rgba(255, 255, 255, 0.05)`
        }}
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {propFirm && (
              <img
                src={propFirm.logo_url}
                alt={`${propFirm.name} logo`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border"
                style={{ borderColor: theme.cardBorder }}
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
            style={{ backgroundColor: theme.cardBackground }}
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
          <div className="text-center py-8 sm:py-12">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6" style={{ color: theme.accent }} />
            <h3 className="typography-h4 mb-3 sm:mb-4" style={{ color: theme.textPrimary }}>Submission Received</h3>
            <p className="typography-body mb-6 sm:mb-8 leading-relaxed px-4" style={{ color: theme.textSecondary }}>
              Your cashback request has been submitted successfully. We'll review it and process your payment within 5-7 business days.
              You should receive a confirmation email shortly.
            </p>
            <button
              onClick={onClose}
              className="px-6 sm:px-8 py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                backgroundColor: theme.cta,
                color: theme.ctaText,
                boxShadow: `0 4px 16px ${theme.cta}40`
              }}
            >
              Done
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
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                  style={{
                    backgroundColor: theme.cardBackground,
                    backdropFilter: 'blur(10px)',
                    borderColor: formErrors.name ? '#dc2626' : theme.cardBorder,
                    color: theme.textPrimary
                  }}
                  placeholder="Enter your full name"
                />
                {formErrors.name && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={!!user}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 typography-small sm:typography-body"
                  style={{
                    backgroundColor: theme.cardBackground,
                    backdropFilter: 'blur(10px)',
                    borderColor: formErrors.email ? '#dc2626' : theme.cardBorder,
                    color: theme.textPrimary
                  }}
                  placeholder="Enter your email"
                />
                {formErrors.email && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Purchase Amount (USD) *
              </label>
              <input
                type="number"
                name="purchaseAmount"
                value={formData.purchaseAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                style={{
                  backgroundColor: theme.cardBackground,
                  backdropFilter: 'blur(10px)',
                  borderColor: formErrors.purchaseAmount ? '#dc2626' : theme.cardBorder,
                  color: theme.textPrimary
                }}
                placeholder="Enter the amount you paid"
              />
              {formErrors.purchaseAmount && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.purchaseAmount}</p>
              )}
            </div>

            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Proof of Purchase *
              </label>
              <input
                type="url"
                name="proofUrl"
                value={formData.proofUrl}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                style={{
                  backgroundColor: theme.cardBackground,
                  backdropFilter: 'blur(10px)',
                  borderColor: formErrors.proofUrl ? '#dc2626' : theme.cardBorder,
                  color: theme.textPrimary
                }}
                placeholder="https://example.com/your-receipt"
              />
              {formErrors.proofUrl && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.proofUrl}</p>
              )}
              <p className="typography-small mt-2" style={{ color: theme.textSecondary }}>
                Upload your receipt to Google Drive, Dropbox, or Imgur and paste the link here
              </p>
            </div>

            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Crypto Wallet Address *
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body font-mono"
                style={{
                  backgroundColor: theme.cardBackground,
                  backdropFilter: 'blur(10px)',
                  borderColor: formErrors.walletAddress ? '#dc2626' : theme.cardBorder,
                  color: theme.textPrimary
                }}
                placeholder="0x..."
              />
              {formErrors.walletAddress && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.walletAddress}</p>
              )}
              <p className="typography-small mt-2" style={{ color: theme.textSecondary }}>
                We support USDT and USDC on Ethereum, BSC, and Polygon networks
              </p>
            </div>

            <div 
              className="p-4 sm:p-6 rounded-2xl border"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder
              }}
            >
              <h4 className="typography-ui font-semibold mb-3 sm:mb-4" style={{ color: theme.textPrimary }}>Cashback Summary</h4>
              <div className="space-y-2 typography-small">
                <div className="flex justify-between">
                  <span style={{ color: theme.textSecondary }}>Purchase Amount:</span>
                  <span className="font-semibold" style={{ color: theme.textPrimary }}>${formData.purchaseAmount || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textSecondary }}>Cashback Rate:</span>
                  <span className="font-semibold" style={{ color: theme.textPrimary }}>{propFirm?.cashback_percentage}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold" style={{ borderColor: theme.cardBorder }}>
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

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold border transition-all duration-200 hover:bg-opacity-80"
                style={{
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  color: theme.textSecondary
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center"
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