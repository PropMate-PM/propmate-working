import React, { useState } from 'react'
import { ExternalLink, Gift, Star, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { PropFirm } from '../lib/supabase'

interface PropFirmsProps {
  propFirms: PropFirm[]
  onClaimCashback: (propFirm: PropFirm) => void
}

export default function PropFirms({ propFirms, onClaimCashback }: PropFirmsProps) {
  const { theme } = useTheme()
  const [showFirstTimeOnly, setShowFirstTimeOnly] = useState(true)

  // Filter firms based on first-time customer toggle
  const filteredFirms = showFirstTimeOnly 
    ? propFirms.filter(firm => firm.is_first_time_offer)
    : propFirms.filter(firm => !firm.is_first_time_offer)

  // Categorize filtered firms
  const forexFirms = filteredFirms.filter(firm => firm.category === 'forex')
  const futuresFirms = filteredFirms.filter(firm => firm.category === 'futures')

  const handleAffiliateClick = (affiliateLink: string, firmName: string) => {
    // Basic link validation
    try {
      new URL(affiliateLink)
      window.open(affiliateLink, '_blank', 'noopener,noreferrer')
    } catch (error) {
      alert(`Sorry, the link for ${firmName} appears to be broken. Please try again later or contact support.`)
    }
  }

  const renderFirmCard = (firm: PropFirm) => (
    <div
      key={firm.id}
      className="p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:scale-105 group relative"
      style={{
        backgroundColor: theme.cardBackground,
        backdropFilter: theme.backdropFilter,
        borderColor: theme.cardBorder,
        boxShadow: theme.cardShadow
      }}
    >
      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6 sm:mb-8">
        <div className="relative flex-shrink-0">
          <img
            src={firm.logo_url}
            alt={`${firm.name} logo`}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border"
            style={{ borderColor: theme.cardBorder }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="typography-h4 mb-2 sm:mb-3" style={{ color: theme.textPrimary }}>{firm.name}</h4>
          <p className="typography-small sm:typography-body leading-relaxed" style={{ color: theme.textSecondary }}>
            Get the highest discount from the website + cashback by purchasing from us.
          </p>
        </div>
      </div>

      <div 
        className="text-center mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border"
        style={{
          backgroundColor: `${theme.cardBackground}80`,
          backdropFilter: 'blur(10px)',
          borderColor: theme.cardBorder
        }}
      >
        <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: theme.accent }}>
          {firm.cashback_percentage}%
        </div>
        <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>Cashback</div>
      </div>

      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
        <button
          onClick={() => handleAffiliateClick(firm.affiliate_link, firm.name)}
          className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold text-center transition-all duration-200 flex items-center justify-center group-hover:scale-105 hover:brightness-110"
          style={{
            backgroundColor: theme.cta,
            color: theme.ctaText,
            boxShadow: `0 4px 16px ${theme.cta}40`
          }}
        >
          <span>Get Cashback</span>
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
        </button>
        <button
          onClick={() => onClaimCashback(firm)}
          className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold border transition-all duration-200 flex items-center justify-center group-hover:scale-105 hover:bg-opacity-80"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            color: theme.textSecondary
          }}
        >
          <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span>Claim Cashback</span>
        </button>
      </div>
    </div>
  )

  const renderFirmSection = (title: string, firms: PropFirm[], icon: React.ReactNode) => {
    if (firms.length === 0) return null

    return (
      <div className="mb-12 sm:mb-16">
        <div 
          className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12 p-4 sm:p-6 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <div 
            className="p-2.5 sm:p-3 rounded-2xl"
            style={{ backgroundColor: `${theme.accent}20` }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              className: "h-5 w-5 sm:h-6 sm:w-6", 
              style: { color: theme.accent } 
            })}
          </div>
          <h3 className="typography-h4 sm:typography-h3 text-center sm:text-left" style={{ color: theme.textPrimary }}>
            {title}
          </h3>
          <div 
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full typography-small font-semibold"
            style={{
              backgroundColor: `${theme.accent}20`,
              color: theme.accent
            }}
          >
            {firms.length} {firms.length === 1 ? 'Firm' : 'Firms'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {firms.map(renderFirmCard)}
        </div>
      </div>
    )
  }

  return (
    <section id="firms" className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="text-center mb-16 sm:mb-20 p-6 sm:p-8 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <h2 className="typography-h3 sm:typography-h2 mb-4 sm:mb-6" style={{ color: theme.textPrimary }}>
            Featured Prop Firms
          </h2>
          <p className="typography-body sm:typography-body-large max-w-2xl mx-auto mb-6 sm:mb-8" style={{ color: theme.textSecondary }}>
            Choose from our carefully selected prop firms and start earning cashback.
          </p>

          {/* First-Time Customer Filter Toggle */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 rounded-2xl border max-w-md mx-auto"
            style={{
              backgroundColor: `${theme.cardBackground}80`,
              backdropFilter: 'blur(10px)',
              borderColor: theme.cardBorder
            }}
          >
            <span className="typography-small font-semibold text-center sm:text-left" style={{ color: theme.textSecondary }}>
              First Time Only
            </span>
            <button
              onClick={() => setShowFirstTimeOnly(!showFirstTimeOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
              style={{
                backgroundColor: showFirstTimeOnly ? theme.accent : `${theme.textSecondary}40`,
                focusRingColor: theme.accent
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showFirstTimeOnly ? 'translate-x-6' : 'translate-x-1'
                }`}
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
            </button>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4" style={{ color: theme.accent }} />
              <span className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
                {showFirstTimeOnly ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <div 
            className="mt-4 p-3 rounded-2xl border"
            style={{
              backgroundColor: `${theme.accent}10`,
              borderColor: `${theme.accent}30`
            }}
          >
            <p className="typography-small font-semibold" style={{ color: theme.accent }}>
              Enable this option if you are making your first purchase with a prop firm.
            </p>
          </div>
        </div>

        {/* Futures Prop Firms Section */}
        {renderFirmSection("Futures Prop Firms", futuresFirms, <BarChart3 />)}

        {/* Forex Prop Firms Section */}
        {renderFirmSection("Forex Prop Firms", forexFirms, <TrendingUp />)}

        {/* No results message */}
        {filteredFirms.length === 0 && (
          <div 
            className="text-center py-12 sm:py-16 p-6 sm:p-8 rounded-2xl border"
            style={{
              backgroundColor: theme.cardBackground,
              backdropFilter: theme.backdropFilter,
              borderColor: theme.cardBorder,
              boxShadow: theme.cardShadow
            }}
          >
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
              style={{ backgroundColor: `${theme.accent}20` }}
            >
              <Star className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.accent }} />
            </div>
            <h3 className="typography-h4 mb-3 sm:mb-4" style={{ color: theme.textPrimary }}>
              {showFirstTimeOnly ? 'No First-Time Offers Available' : 'No Recurring Offers Available'}
            </h3>
            <p className="typography-body mb-4 sm:mb-6 px-4" style={{ color: theme.textSecondary }}>
              {showFirstTimeOnly 
                ? 'There are currently no prop firms offering first-time customer cashback. Toggle off to see recurring offers.'
                : 'There are currently no prop firms offering recurring customer cashback. Toggle on to see first-time offers.'
              }
            </p>
            <button
              onClick={() => setShowFirstTimeOnly(!showFirstTimeOnly)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                backgroundColor: theme.cta,
                color: theme.ctaText,
                boxShadow: `0 4px 16px ${theme.cta}40`
              }}
            >
              {showFirstTimeOnly ? 'Show Recurring Offers' : 'Show First-Time Offers'}
            </button>
          </div>
        )}

        {/* Error handling notice */}
        {propFirms.length === 0 && (
          <div 
            className="text-center py-12 sm:py-16 p-6 sm:p-8 rounded-2xl border"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.2)'
            }}
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-red-100">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <h3 className="typography-h4 mb-3 sm:mb-4 text-red-800">
              Unable to Load Prop Firms
            </h3>
            <p className="typography-body mb-4 sm:mb-6 px-4 text-red-700">
              We're having trouble loading the prop firms. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:brightness-110 bg-red-600 text-white"
            >
              Refresh Page
            </button>
          </div>
        )}

        <div 
          className="text-center mt-12 sm:mt-16 p-4 sm:p-6 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <p className="typography-body mb-3 sm:mb-4" style={{ color: theme.textSecondary }}>Don't see your prop firm?</p>
          <a 
            href="https://discord.gg/proptrading" 
            target="_blank" 
            rel="noopener noreferrer"
            className="typography-ui font-semibold transition-colors hover:opacity-80"
            style={{ color: theme.accent }}
          >
            Request it on Discord →
          </a>
        </div>
      </div>
    </section>
  )
}