import React, { useState } from 'react'
import { X, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { signUp, signIn } from '../lib/auth'
import { validateEmail } from '../lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { theme } = useTheme()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    // Confirm password validation (signup only)
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
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
      if (mode === 'signup') {
        await signUp(formData.email.trim(), formData.password)
        setSuccess('Account created successfully! Please check your email to verify your account.')
        setFormData({ email: '', password: '', confirmPassword: '' })
      } else {
        await signIn(formData.email.trim(), formData.password)
        setSuccess('Signed in successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
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

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setSuccess('')
    setFormData({ email: '', password: '', confirmPassword: '' })
    setFormErrors({})
  }

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '', confirmPassword: '' })
      setFormErrors({})
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(20px)' }}
    >
      <div 
        className="p-6 sm:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto rounded-2xl border"
        style={{
          backgroundColor: theme.cardBackground,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: theme.cardBorder,
          boxShadow: `${theme.cardShadow}, 0 0 0 1px rgba(255, 255, 255, 0.05)`
        }}
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="typography-h4" style={{ color: theme.textPrimary }}>
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
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

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  backgroundColor: theme.cardBackground,
                  backdropFilter: 'blur(10px)',
                  borderColor: formErrors.email ? '#dc2626' : theme.cardBorder,
                  color: theme.textPrimary
                }}
                placeholder="Enter your email"
              />
            </div>
            {formErrors.email && (
              <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.email}</p>
            )}
          </div>

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
                  backgroundColor: theme.cardBackground,
                  backdropFilter: 'blur(10px)',
                  borderColor: formErrors.password ? '#dc2626' : theme.cardBorder,
                  color: theme.textPrimary
                }}
                placeholder="Enter your password"
              />
            </div>
            {formErrors.password && (
              <p className="mt-1 typography-small" style={{ color: '#dc2626' }}>{formErrors.password}</p>
            )}
          </div>

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
                    backgroundColor: theme.cardBackground,
                    backdropFilter: 'blur(10px)',
                    borderColor: formErrors.confirmPassword ? '#dc2626' : theme.cardBorder,
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
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="typography-small sm:typography-body" style={{ color: theme.textSecondary }}>
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={toggleMode}
              className="ml-2 typography-ui font-semibold transition-colors hover:opacity-80"
              style={{ color: theme.accent }}
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {mode === 'signup' && (
          <div 
            className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl border"
            style={{
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder
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