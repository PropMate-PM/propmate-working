import React, { useState } from 'react'
import { X, Mail, Lock, CheckCircle, AlertCircle, Loader2, User, KeyRound } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { signUp, signIn, resetPassword } from '../lib/auth'
import { emailService } from '../lib/emailService'
import { validateEmail } from '../lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { theme } = useTheme()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(initialMode)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // First/Last Name validation (signup only)
    if (mode === 'signup') {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required'
      }
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required'
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Password validation (not needed for forgot password)
    if (mode !== 'forgot-password') {
      if (!formData.password) {
        errors.password = 'Password is required'
      } else {
        const hasMin = formData.password.length >= 8
        const hasUpper = /[A-Z]/.test(formData.password)
        const hasLower = /[a-z]/.test(formData.password)
        const hasNum = /\d/.test(formData.password)
        const hasSym = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(formData.password)
        if (!(hasMin && hasUpper && hasLower && hasNum && hasSym)) {
          errors.password = 'Use 8+ chars with uppercase, lowercase, number, and symbol'
        }
      }
    }

    // Confirm password validation (signup only)
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }

      // Terms and conditions validation (signup only)
      if (!acceptedTerms) {
        errors.terms = 'You must accept the terms and conditions to continue'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Starting authentication in React...')
      const startTime = Date.now()
      
      let result
      if (mode === 'signup') {
        result = await signUp(formData.email.trim(), formData.password)
        console.log(`Signup took: ${Date.now() - startTime}ms`)
        setSuccess('Account created successfully! Please check your email to verify your account.')
        // Trigger welcome email (non-blocking)
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
        try {
          await emailService.sendEnhancedWelcomeEmail(
            formData.email.trim(),
            fullName || formData.email.trim()
          )
        } catch (e) {
          console.warn('Welcome email failed (ignored):', e)
        }
        setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
      } else if (mode === 'forgot-password') {
        result = await resetPassword(formData.email.trim())
        console.log(`Password reset took: ${Date.now() - startTime}ms`)
        setSuccess('Password reset email sent! Please check your inbox and follow the instructions.')
        setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
        // Switch back to signin mode after a delay
        setTimeout(() => {
          setMode('signin')
          setSuccess('')
        }, 3000)
      } else {
        result = await signIn(formData.email.trim(), formData.password)
        console.log(`Signin took: ${Date.now() - startTime}ms`)
        console.log('Signin result:', result)
        setSuccess('Signed in successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err) {
      console.error('Authentication error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      // Reset loading state immediately on error
      setIsLoading(false)
      return
    } finally {
      // Ensure loading state is reset
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleMode = (newMode?: 'signin' | 'signup' | 'forgot-password') => {
    if (newMode) {
      setMode(newMode)
    } else {
      setMode(mode === 'signin' ? 'signup' : 'signin')
    }
    setError('')
    setSuccess('')
    setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
    setFormErrors({})
    setAcceptedTerms(false)
  }

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
      setFormErrors({})
      setError('')
      setSuccess('')
      setAcceptedTerms(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(50px)' }}
    >
      <div 
        className="p-6 sm:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto"
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
          <h2 className="typography-h4" style={{ color: theme.textPrimary }}>
            {mode === 'signup' ? 'Create Account' : mode === 'forgot-password' ? 'Reset Password' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.textSecondary }} />
          </button>
        </div>

        {error && (
          <div 
            className="p-3 sm:p-4 rounded-2xl border flex items-start space-x-3 mb-4 sm:mb-6"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="typography-small font-semibold" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {success && (
          <div 
            className="p-3 sm:p-4 rounded-2xl border flex items-start space-x-3 mb-4 sm:mb-6"
            style={{
              backgroundColor: `${theme.accent}10`,
              borderColor: `${theme.accent}20`
            }}
          >
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.accent }} />
            <p className="typography-small font-semibold" style={{ color: theme.accent }}>{success}</p>
          </div>
        )}

        {mode === 'forgot-password' && (
          <div 
            className="p-4 rounded-2xl border mb-4 sm:mb-6"
            style={{
              backgroundColor: `${theme.accent}10`,
              borderColor: `${theme.accent}20`
            }}
          >
            <div className="flex items-start space-x-3">
              <KeyRound className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.accent }} />
              <div>
                <p className="typography-small font-semibold mb-1" style={{ color: theme.accent }}>Password Reset</p>
                <p className="typography-small" style={{ color: theme.textSecondary }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                    style={{
                      background: 'rgba(151, 86, 125, 0.05)',
                      backdropFilter: 'blur(31.9617px)',
                      borderColor: formErrors.firstName ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                      color: theme.textPrimary
                    }}
                    placeholder="Enter your first name"
                  />
                </div>
                {formErrors.firstName && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                    style={{
                      background: 'rgba(151, 86, 125, 0.05)',
                      backdropFilter: 'blur(31.9617px)',
                      borderColor: formErrors.lastName ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                      color: theme.textPrimary
                    }}
                    placeholder="Enter your last name"
                  />
                </div>
                {formErrors.lastName && (
                  <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.lastName}</p>
                )}
              </div>
            </>
          )}
          <div>
            <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
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

          {mode !== 'forgot-password' && (
            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                  style={{
                    background: 'rgba(151, 86, 125, 0.05)',
                    backdropFilter: 'blur(31.9617px)',
                    borderColor: formErrors.password ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                    color: theme.textPrimary
                  }}
                  placeholder="Enter your password"
                />
              </div>
              {formErrors.password && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.password}</p>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-2xl border focus:ring-2 focus:border-transparent transition-all typography-small sm:typography-body"
                  style={{
                    background: 'rgba(151, 86, 125, 0.05)',
                    backdropFilter: 'blur(31.9617px)',
                    borderColor: formErrors.confirmPassword ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                    color: theme.textPrimary
                  }}
                  placeholder="Confirm your password"
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {mode === 'signup' && (
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
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center"
            style={{
              backgroundColor: theme.cta,
              color: theme.ctaText,
              boxShadow: `0 4px 16px ${theme.cta}40`
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              mode === 'signup' ? 'Create Account' : mode === 'forgot-password' ? 'Send Reset Email' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center space-y-2">
          {mode === 'signin' && (
            <p className="typography-small">
              <button
                type="button"
                onClick={() => toggleMode('forgot-password')}
                className="typography-ui font-semibold transition-colors hover:opacity-80"
                style={{ color: theme.accent }}
              >
                Forgot your password?
              </button>
            </p>
          )}
          
          <p className="typography-small sm:typography-body" style={{ color: theme.textSecondary }}>
            {mode === 'signup' ? 'Already have an account?' : 
             mode === 'forgot-password' ? 'Remember your password?' : 
             "Don't have an account?"}
            <button
              type="button"
              onClick={() => toggleMode(mode === 'forgot-password' ? 'signin' : mode === 'signin' ? 'signup' : 'signin')}
              className="ml-2 typography-ui font-semibold transition-colors hover:opacity-80"
              style={{ color: theme.accent }}
            >
              {mode === 'signup' ? 'Sign In' : 
               mode === 'forgot-password' ? 'Back to Sign In' : 
               'Sign Up'}
            </button>
          </p>
        </div>

        {mode === 'signup' && (
          <div 
            className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl border"
            style={{
              background: 'rgba(151, 86, 125, 0.05)',
              border: '1.59809px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '38.3541px'
            }}
          >
            <h4 className="typography-ui font-semibold mb-3" style={{ color: theme.textPrimary }}>Why create an account?</h4>
            <ul className="typography-small space-y-2" style={{ color: theme.textSecondary }}>
              <li>• Track your cashback submissions</li>
              <li>• Get notified when payments are processed</li>
              <li>• Access exclusive member discounts</li>
              <li>• Join our trader community</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}