import React, { useState } from 'react'
import { ExternalLink, Gift, Star, TrendingUp, BarChart3, AlertTriangle, Search, ArrowUp, ArrowDown, RotateCcw, Copy, Check } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { PropFirm } from '../lib/supabase'

interface PropFirmsProps {
  propFirms: PropFirm[]
  onClaimCashback: (propFirm: PropFirm) => void
}

type SortState = 'default' | 'highest' | 'lowest'

export default function PropFirms({ propFirms, onClaimCashback }: PropFirmsProps) {
  const { theme } = useTheme()
  const [showFirstTimeOnly, setShowFirstTimeOnly] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortState, setSortState] = useState<SortState>('default')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Handle sort toggle cycling
  const handleSortToggle = () => {
    setSortState(prev => {
      switch (prev) {
        case 'default':
          return 'highest'
        case 'highest':
          return 'lowest'
        case 'lowest':
          return 'default'
        default:
          return 'default'
      }
    })
  }

  // Get sort display info
  const getSortDisplay = () => {
    switch (sortState) {
      case 'highest':
        return {
          icon: <ArrowDown className="h-4 w-4" style={{ color: theme.accent }} />,
          text: 'High to Low',
          description: 'Sorted by highest cashback first'
        }
      case 'lowest':
        return {
          icon: <ArrowUp className="h-4 w-4" style={{ color: theme.accent }} />,
          text: 'Low to High', 
          description: 'Sorted by lowest cashback first'
        }
      case 'default':
      default:
        return {
          icon: <RotateCcw className="h-4 w-4" style={{ color: theme.textSecondary }} />,
          text: 'Sort by Cashback',
          description: 'No sorting applied'
        }
    }
  }

  // Apply all filters: first-time toggle, search, and sorting
  const filteredFirms = React.useMemo(() => {
    let filtered = showFirstTimeOnly 
      ? propFirms.filter(firm => firm.is_first_time_offer)
      : propFirms.filter(firm => !firm.is_first_time_offer)

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(firm => 
        firm.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    }

    // Apply sorting
    if (sortState === 'highest') {
      filtered = [...filtered].sort((a, b) => b.cashback_percentage - a.cashback_percentage)
    } else if (sortState === 'lowest') {
      filtered = [...filtered].sort((a, b) => a.cashback_percentage - b.cashback_percentage)
    }
    // Default state keeps original order (no sorting)

    return filtered
  }, [propFirms, showFirstTimeOnly, searchQuery, sortState])

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

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  const renderFirmCard = (firm: PropFirm) => (
    <div
      key={firm.id}
      className="group relative transition-all duration-300 hover:scale-105 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-5 md:gap-9 p-5 md:p-8"
      style={{
        position: 'relative',
        minHeight: '200px',
        background: 'rgba(151, 86, 125, 0.05)',
        border: '1.59809px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(31.9617px)',
        borderRadius: '38.3541px'
      }}
    >
      <div className="flex-shrink-0">
        <img
          src={firm.logo_url}
          alt={`${firm.name} logo`}
          className="w-16 h-16 rounded-2xl object-cover border"
          style={{ borderColor: theme.cardBorder }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-xl font-bold mb-2" style={{ color: theme.textPrimary }}>{firm.name}</h4>
        <p className="text-sm leading-relaxed mb-4" style={{ color: theme.textSecondary }}>
          Get the highest discount from the website + cashback by purchasing from us.
        </p>
        
        {/* Cashback and Exclusive Discount Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Cashback Badge */}
          <div 
            className="inline-block px-3 py-1 rounded-full font-bold text-xs sm:text-sm"
            style={{ 
              backgroundColor: '#ef4444',
              color: 'white'
            }}
          >
            {firm.cashback_percentage}% Cashback
          </div>

          {/* Exclusive Discount Badge - only show if both fields are present */}
          {firm.exclusive_discount_percent && firm.exclusive_coupon_code && (
            <div 
              className="inline-block px-3 py-1 rounded-full font-bold text-xs sm:text-sm"
              style={{ 
                backgroundColor: '#10b981',
                color: 'white'
              }}
            >
              Exclusive Discount: {firm.exclusive_discount_percent}%
            </div>
          )}

          {/* Coupon Code Badge - only show if both fields are present */}
          {firm.exclusive_discount_percent && firm.exclusive_coupon_code && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold cursor-pointer transition-all duration-200 hover:scale-105 min-w-0 text-xs sm:text-sm"
              style={{ 
                backgroundColor: '#f59e0b',
                color: 'white'
              }}
              onClick={() => handleCopyCode(firm.exclusive_coupon_code!)}
              title="Click to copy coupon code"
            >
              <span className="truncate">Coupon Code: {firm.exclusive_coupon_code}</span>
              {copiedCode === firm.exclusive_coupon_code ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-col space-y-3 w-full md:w-auto">
        <button
          onClick={() => handleAffiliateClick(firm.affiliate_link, firm.name)}
          className="px-6 py-3 rounded-2xl font-semibold text-center transition-all duration-200 flex items-center justify-center group-hover:scale-105 hover:brightness-110"
          style={{
            backgroundColor: theme.cta,
            color: theme.ctaText,
            boxShadow: `0 4px 16px ${theme.cta}40`
          }}
        >
          <span>Purchase</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </button>
        <button
          onClick={() => onClaimCashback(firm)}
          className="px-6 py-3 rounded-2xl font-semibold border transition-all duration-200 flex items-center justify-center group-hover:scale-105 hover:bg-opacity-80"
          style={{
            backgroundColor: 'transparent',
            borderColor: theme.cardBorder,
            color: theme.textSecondary
          }}
        >
          <Gift className="h-4 w-4 mr-2" />
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
          className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12 w-full max-w-5xl mx-auto p-6 md:p-8"
          style={{
            position: 'relative',
            minHeight: '121px',
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px'
          }}
        >
          <div 
            className="p-3 rounded-2xl"
            style={{ backgroundColor: `${theme.accent}20` }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              className: "h-6 w-6", 
              style: { color: theme.accent } 
            })}
          </div>
          <h3 className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
            {title}
          </h3>
          <div 
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: `${theme.accent}20`,
              color: theme.accent
            }}
          >
            {firms.length} {firms.length === 1 ? 'Firm' : 'Firms'}
          </div>
        </div>

        <div className="space-y-6">
          {firms.map(renderFirmCard)}
        </div>
      </div>
    )
  }

  return (
    <section id="firms" className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Prop Firms Section */}
        <div 
          className="text-center mb-16 sm:mb-20 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 md:p-8 gap-6"
          style={{
            position: 'relative',
            minHeight: '250px',
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px'
          }}
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: theme.textPrimary }}>
            Featured Prop Firms
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-6" style={{ color: theme.textSecondary }}>
            Choose from your favorite Prop Firms and start earning cashbacks.
          </p>

          {/* Custom Toggle Button */}
          <div className="relative flex items-center justify-center">
            <span className="text-sm font-semibold mr-4" style={{ color: theme.textSecondary }}>
              Toggle this on to see first purchase offers
            </span>
            <button
              onClick={() => setShowFirstTimeOnly(!showFirstTimeOnly)}
              className="relative transition-all duration-300 hover:scale-105"
              style={{
                position: 'relative',
                width: '92px',
                height: '39px',
                background: showFirstTimeOnly 
                  ? 'linear-gradient(135deg, #8B5A9F 0%, #97567D 100%)'
                  : 'rgba(151, 86, 125, 0.2)',
                border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(31.9617px)',
                borderRadius: '19.5px',
                display: 'flex',
                alignItems: 'center',
                padding: '3px'
              }}
            >
              {/* Background Text */}
              <span 
                className="absolute font-bold transition-all duration-300"
                style={{ 
                  left: showFirstTimeOnly ? '6px' : 'auto',
                  right: showFirstTimeOnly ? 'auto' : '8px',
                  color: showFirstTimeOnly ? 'white' : theme.textSecondary,
                  opacity: showFirstTimeOnly ? 1 : 0.8,
                  zIndex: 1,
                  fontSize: '9px',
                  lineHeight: '1'
                }}
              >
                {showFirstTimeOnly ? 'First Time' : 'Recurring'}
              </span>
              
              {/* Sliding Circle */}
              <div
                className="absolute w-7 h-7 rounded-full transition-all duration-300 ease-in-out"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  transform: showFirstTimeOnly ? 'translateX(58px)' : 'translateX(2px)',
                  backdropFilter: 'blur(10px)',
                  top: '4px',
                  zIndex: 2
                }}
              />
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-center">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5" style={{ color: theme.textSecondary }} />
              </div>
              <input
                type="text"
                placeholder="Search prop firms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none hover:brightness-110"
                style={{
                  background: 'rgba(151, 86, 125, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: theme.textPrimary,
                  boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)',
                  backdropFilter: 'blur(31.9617px)',
                  WebkitBackdropFilter: 'blur(31.9617px)' // Safari support
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 0 0 2px ${theme.accent}40, 0 8px 24px rgba(151, 86, 125, 0.2)`
                  e.target.style.background = 'rgba(151, 86, 125, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)'
                  e.target.style.background = 'rgba(151, 86, 125, 0.05)'
                }}
              />
            </div>

            {/* Sort Toggle Button */}
            <div className="relative">
              <button
                onClick={handleSortToggle}
                className="group w-full sm:w-48 px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none cursor-pointer hover:brightness-110 hover:scale-105"
                style={{
                  background: 'rgba(151, 86, 125, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: theme.textPrimary,
                  boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)',
                  backdropFilter: 'blur(31.9617px)',
                  WebkitBackdropFilter: 'blur(31.9617px)' // Safari support
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 0 0 2px ${theme.accent}40, 0 8px 24px rgba(151, 86, 125, 0.2)`
                  e.target.style.background = 'rgba(151, 86, 125, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)'
                  e.target.style.background = 'rgba(151, 86, 125, 0.05)'
                }}
                title={getSortDisplay().description}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-medium text-sm">
                    {getSortDisplay().text}
                  </span>
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {getSortDisplay().icon}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Sort Status Indicator */}
          {sortState !== 'default' && (
            <div 
              className="text-center px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${theme.accent}15`,
                color: theme.accent,
                border: `1px solid ${theme.accent}30`
              }}
            >
              <span className="flex items-center justify-center space-x-1">
                {getSortDisplay().icon}
                <span>Cashback: {getSortDisplay().text}</span>
              </span>
            </div>
          )}

          {showFirstTimeOnly && (
            <div 
              className="p-3 rounded-2xl"
              style={{
                backgroundColor: `${theme.accent}10`,
                borderColor: `${theme.accent}30`
              }}
            >
              <p className="text-sm font-semibold" style={{ color: theme.accent }}>
                ✨ Showing first-time customer offers
              </p>
            </div>
          )}


        </div>

        {/* Futures Prop Firms Section */}
        {renderFirmSection("Futures Prop Firms", futuresFirms, <BarChart3 />)}

        {/* Forex Prop Firms Section */}
        {renderFirmSection("Forex Prop Firms", forexFirms, <TrendingUp />)}

        {/* No results message */}
        {filteredFirms.length === 0 && (
          <div 
            className="text-center py-12 sm:py-16 w-full max-w-5xl mx-auto"
            style={{
              position: 'relative',
              minHeight: '322px',
              background: 'rgba(151, 86, 125, 0.05)',
              border: '1.59809px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(31.9617px)',
              borderRadius: '38.3541px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '31px 42px'
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${theme.accent}20` }}
            >
              {searchQuery.trim() ? (
                <Search className="h-8 w-8" style={{ color: theme.accent }} />
              ) : (
                <Star className="h-8 w-8" style={{ color: theme.accent }} />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: theme.textPrimary }}>
              {searchQuery.trim() 
                ? 'No Firms Found' 
                : (showFirstTimeOnly ? 'No First-Time Offers Available' : 'No Recurring Offers Available')
              }
            </h3>
            <p className="text-base mb-6 px-4" style={{ color: theme.textSecondary }}>
              {searchQuery.trim() 
                ? `No prop firms found matching "${searchQuery}". Try adjusting your search or filters.`
                : (showFirstTimeOnly 
                  ? 'There are currently no prop firms offering first-time customer cashback. Toggle off to see recurring offers.'
                  : 'There are currently no prop firms offering recurring customer cashback. Toggle on to see first-time offers.'
                )
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:brightness-110"
                  style={{
                    backgroundColor: theme.cta,
                    color: theme.ctaText,
                    boxShadow: `0 4px 16px ${theme.cta}40`
                  }}
                >
                  Clear Search
                </button>
              )}
              {!searchQuery.trim() && (
                <button
                  onClick={() => setShowFirstTimeOnly(!showFirstTimeOnly)}
                  className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:brightness-110"
                  style={{
                    backgroundColor: theme.cta,
                    color: theme.ctaText,
                    boxShadow: `0 4px 16px ${theme.cta}40`
                  }}
                >
                  {showFirstTimeOnly ? 'Show Recurring Offers' : 'Show First-Time Offers'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error handling notice */}
        {propFirms.length === 0 && (
          <div 
            className="text-center py-12 sm:py-16 w-full max-w-5xl mx-auto"
            style={{
              position: 'relative',
              minHeight: '322px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.59809px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '38.3541px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '31px 42px'
            }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-red-800">
              Unable to Load Prop Firms
            </h3>
            <p className="text-base mb-6 px-4 text-red-700">
              We're having trouble loading the prop firms. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:brightness-110 bg-red-600 text-white"
            >
              Refresh Page
            </button>
          </div>
        )}

        <div 
          className="text-center mt-12 sm:mt-16 w-full max-w-5xl mx-auto"
          style={{
            position: 'relative',
            minHeight: '121px',
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '31px 42px'
          }}
        >
          <p className="text-base mb-4" style={{ color: theme.textSecondary }}>Don't see your prop firm?</p>
          <a 
            href="https://discord.gg/proptrading" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: theme.accent }}
          >
            Request it on Discord →
          </a>
        </div>
      </div>
    </section>
  )
}