import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, Menu, X, User, LogOut, Sun, Moon, Settings } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface HeaderProps {
  onAdminClick: () => void
  user: any
  onAuthClick: (mode?: 'signin' | 'signup') => void
  onSignOut: () => void
}

export default function Header({ onAdminClick, user, onAuthClick, onSignOut }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [documentHeight, setDocumentHeight] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const { isDark, toggleTheme, theme } = useTheme()

  // Check if current user is admin
  const isAdmin = user?.email === 'admin@propmate.com'

  // Track scroll position and document dimensions for fade effect
  useEffect(() => {
    const updateDimensions = () => {
      setDocumentHeight(document.documentElement.scrollHeight)
      setWindowHeight(window.innerHeight)
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
      updateDimensions() // Update dimensions on scroll in case content changes
    }

    // Initial setup
    updateDimensions()
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  // Calculate fade opacity based on scroll position relative to page end
  const maxScroll = documentHeight - windowHeight
  const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0
  const fadeOpacity = Math.max(0, 1 - scrollProgress) // Fade out as user scrolls to end

  // Close mobile menu when clicking outside or on navigation links
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isMenuOpen && !target.closest('header')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])

  const getPillStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      // Enable hardware acceleration for smoother animations
      transform: 'translateZ(0)',
      willChange: 'background-color, backdrop-filter, border-color, box-shadow',
      // Responsive shape: pill on desktop, rectangular on mobile
      maxWidth: '950px',
      margin: '0 auto',
      // Always transparent and glassy
      transition: 'all 0.3s ease-out',
      backgroundColor: isDark 
        ? 'rgba(40, 40, 40, 0.4)'
        : 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
      // Responsive border radius: pill on desktop, rounded rectangle on mobile
      borderRadius: 'clamp(16px, 4vw, 9999px)',
    }

    return baseStyles
  }

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false)
    // Smooth scroll to section
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Fixed Background Layer - Theme-Aware */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: isDark 
            ? `linear-gradient(135deg, 
                ${theme.background} 0%, 
                rgba(139, 90, 159, 0.1) 25%, 
                ${theme.background} 50%, 
                rgba(215, 196, 242, 0.05) 75%, 
                ${theme.background} 100%
              )`
            : `linear-gradient(135deg, 
                ${theme.background} 0%, 
                rgba(139, 90, 159, 0.08) 15%, 
                rgba(215, 196, 242, 0.12) 35%, 
                ${theme.background} 50%, 
                rgba(215, 196, 242, 0.08) 65%, 
                rgba(139, 90, 159, 0.06) 85%, 
                ${theme.background} 100%
              )`,
          opacity: fadeOpacity,
          transition: 'opacity 0.1s ease-out',
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'opacity'
        }}
      />

      {/* Fixed Pattern Overlay - Theme-Aware */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `radial-gradient(circle at 25% 25%, ${theme.accent} 2px, transparent 2px), 
               radial-gradient(circle at 75% 75%, ${theme.accent} 1px, transparent 1px)`
            : `radial-gradient(circle at 20% 30%, rgba(139, 90, 159, 0.4) 1.5px, transparent 1.5px), 
               radial-gradient(circle at 80% 70%, rgba(215, 196, 242, 0.6) 1px, transparent 1px),
               radial-gradient(circle at 60% 20%, rgba(139, 90, 159, 0.3) 0.8px, transparent 0.8px)`,
          backgroundSize: isDark 
            ? '60px 60px, 40px 40px'
            : '80px 80px, 50px 50px, 30px 30px',
          opacity: isDark ? fadeOpacity * 0.05 : fadeOpacity * 0.08,
          transition: 'opacity 0.1s ease-out',
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'opacity'
        }}
      />

      {/* Additional Light Mode Decorative Elements */}
      {!isDark && (
        <>
          {/* Soft Radial Gradients for Light Mode */}
          <div 
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 800px 600px at 20% 10%, rgba(215, 196, 242, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 600px 800px at 80% 90%, rgba(139, 90, 159, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse 400px 300px at 60% 40%, rgba(215, 196, 242, 0.08) 0%, transparent 50%)
              `,
              opacity: fadeOpacity * 0.6,
              transition: 'opacity 0.1s ease-out',
              transform: 'translateZ(0)',
              willChange: 'opacity'
            }}
          />

          {/* Subtle Geometric Patterns for Light Mode */}
          <div 
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(139, 90, 159, 0.02) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(215, 196, 242, 0.03) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(139, 90, 159, 0.02) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(215, 196, 242, 0.03) 75%)
              `,
              backgroundSize: '120px 120px, 120px 120px, 120px 120px, 120px 120px',
              backgroundPosition: '0 0, 0 60px, 60px -60px, -60px 0px',
              opacity: fadeOpacity * 0.3,
              transition: 'opacity 0.1s ease-out',
              transform: 'translateZ(0)',
              willChange: 'opacity'
            }}
          />
        </>
      )}

      <header 
        className="sticky top-0 z-50 relative"
        style={{
          padding: '16px 0',
          background: 'transparent'
        }}
      >
        <div 
          className="mx-4 sm:mx-6 lg:mx-8 relative z-10"
          style={getPillStyles()}
        >
          <div className="flex justify-between items-center py-3 px-4 sm:px-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div 
                className="p-2 sm:p-2.5 rounded-2xl shadow-lg"
                style={{ backgroundColor: theme.cta }}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.ctaText }} />
              </div>
              <span className="typography-ui sm:typography-h4 font-semibold" style={{ color: theme.textPrimary }}>
                PropMate
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <button 
                onClick={() => handleNavClick('#firms')} 
                className="typography-ui font-semibold transition-colors hover:opacity-80" 
                style={{ color: theme.textSecondary }}
              >
                Firms
              </button>
              <button 
                onClick={() => handleNavClick('#faq')} 
                className="typography-ui font-semibold transition-colors hover:opacity-80" 
                style={{ color: theme.textSecondary }}
              >
                FAQ
              </button>
              {/* Show different buttons based on admin status */}
              {user && (
                isAdmin ? (
                  <button
                    onClick={onAdminClick}
                    className="flex items-center space-x-2 typography-ui font-semibold transition-colors hover:opacity-80"
                    style={{ color: theme.textSecondary }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </button>
                ) : (
                  <button
                    onClick={onAdminClick}
                    className="typography-ui font-semibold transition-colors hover:opacity-80"
                    style={{ color: theme.textSecondary }}
                  >
                    My Requests
                  </button>
                )
              )}
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-2xl transition-colors hover:bg-opacity-80"
                style={{ backgroundColor: `${theme.accent}20` }}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                )}
              </button>
              
              {user ? (
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div 
                    className="flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-2xl border"
                    style={{
                      backgroundColor: `${theme.cardBackground}80`,
                      backdropFilter: theme.backdropFilter,
                      borderColor: theme.cardBorder,
                      boxShadow: theme.cardShadow
                    }}
                  >
                    <User className="h-3 w-3 lg:h-4 lg:w-4" style={{ color: theme.textSecondary }} />
                    <span className="typography-small font-semibold hidden lg:inline" style={{ color: theme.textSecondary }}>
                      {isAdmin ? 'Admin' : user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="transition-colors hover:text-red-400 p-1"
                    style={{ color: theme.textSecondary }}
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <button
                    onClick={() => onAuthClick('signin')}
                    className="typography-ui font-semibold transition-colors hover:opacity-80"
                    style={{ color: theme.textSecondary }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onAuthClick('signup')}
                    className="px-4 lg:px-6 py-2 lg:py-2.5 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: theme.cta,
                      color: theme.ctaText,
                      boxShadow: `0 4px 16px ${theme.cta}30`
                    }}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-2xl transition-colors hover:bg-opacity-80"
                style={{ backgroundColor: `${theme.accent}20` }}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" style={{ color: theme.accent }} />
                ) : (
                  <Moon className="h-4 w-4" style={{ color: theme.accent }} />
                )}
              </button>
              
              {/* Improved Mobile Menu Button with larger touch target */}
              <button
                className="p-3 -m-1 rounded-2xl transition-colors hover:bg-opacity-20"
                style={{ backgroundColor: `${theme.textSecondary}10` }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" style={{ color: theme.textSecondary }} />
                ) : (
                  <Menu className="h-5 w-5" style={{ color: theme.textSecondary }} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t px-4 sm:px-6" style={{ borderColor: theme.cardBorder }}>
              <nav className="flex flex-col space-y-4">
                <button 
                  onClick={() => handleNavClick('#firms')} 
                  className="typography-ui font-semibold transition-colors hover:opacity-80 text-left" 
                  style={{ color: theme.textSecondary }}
                >
                  Firms
                </button>
                <button 
                  onClick={() => handleNavClick('#faq')} 
                  className="typography-ui font-semibold transition-colors hover:opacity-80 text-left" 
                  style={{ color: theme.textSecondary }}
                >
                  FAQ
                </button>
                {/* Show different buttons based on admin status in mobile menu */}
                {user && (
                  isAdmin ? (
                    <button
                      onClick={() => {
                        onAdminClick()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 typography-ui font-semibold transition-colors hover:opacity-80 text-left"
                      style={{ color: theme.textSecondary }}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onAdminClick()
                        setIsMenuOpen(false)
                      }}
                      className="typography-ui font-semibold transition-colors hover:opacity-80 text-left"
                      style={{ color: theme.textSecondary }}
                    >
                      My Requests
                    </button>
                  )
                )}
                
                {user ? (
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: theme.cardBorder }}>
                    <div 
                      className="flex items-center space-x-2 px-3 py-2 rounded-2xl border"
                      style={{
                        backgroundColor: `${theme.cardBackground}80`,
                        backdropFilter: theme.backdropFilter,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <User className="h-4 w-4" style={{ color: theme.textSecondary }} />
                      <span className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
                        {isAdmin ? 'Admin' : user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="typography-ui transition-colors hover:text-red-400 text-left"
                      style={{ color: theme.textSecondary }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: theme.cardBorder }}>
                    <button
                      onClick={() => {
                        onAuthClick('signin')
                        setIsMenuOpen(false)
                      }}
                      className="typography-ui font-semibold transition-colors hover:opacity-80 text-left"
                      style={{ color: theme.textSecondary }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        onAuthClick('signup')
                        setIsMenuOpen(false)
                      }}
                      className="px-4 py-2.5 rounded-2xl text-center typography-ui font-semibold transition-all duration-200 w-full"
                      style={{
                        backgroundColor: theme.cta,
                        color: theme.ctaText,
                        boxShadow: `0 4px 16px ${theme.cta}30`
                      }}
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}