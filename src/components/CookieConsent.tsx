import React from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface CookieConsentProps {
  isVisible: boolean
  onAccept: () => void
  onDecline: () => void
}

export default function CookieConsent({ isVisible, onAccept, onDecline }: CookieConsentProps) {
  const { theme } = useTheme()
  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-4 left-0 right-0 z-50 px-4"
      role="dialog"
      aria-live="polite"
    >
      <div
        className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
        style={{
          background: 'rgba(151, 86, 125, 0.05)',
          border: '1.59809px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(31.9617px)',
          borderRadius: '38.3541px'
        }}
      >
        <div className="flex-1 text-center sm:text-left">
          <p className="typography-ui font-semibold" style={{ color: theme.textPrimary }}>Cookies & Privacy</p>
          <p className="typography-small" style={{ color: theme.textSecondary }}>
            We use cookies to improve your experience and to measure how our site is used. You can accept or decline analytics cookies.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onDecline}
            className="px-4 py-2 rounded-2xl typography-ui font-semibold border transition-all hover:brightness-110"
            style={{
              background: 'rgba(151, 86, 125, 0.05)',
              border: '1.59809px solid rgba(255, 255, 255, 0.1)',
              color: theme.textSecondary
            }}
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 rounded-2xl typography-ui font-semibold transition-all hover:brightness-110"
            style={{
              backgroundColor: theme.cta,
              color: theme.ctaText,
              boxShadow: `0 4px 16px ${theme.cta}40`
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}









