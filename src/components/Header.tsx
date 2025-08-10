import React, { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { hasAdminPermission } from '../lib/auth'

interface HeaderProps {
  onAdminClick: () => void
  user: any
  onAuthClick: (mode?: 'signin' | 'signup') => void
  onSignOut: () => void
}

export default function Header({ onAdminClick, user, onAuthClick, onSignOut }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { theme } = useTheme()

  // Check if current user is admin (role-based via Supabase)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      if (!user) {
        if (isMounted) setIsAdmin(false)
        return
      }
      try {
        const allowed = await hasAdminPermission('admin')
        if (isMounted) setIsAdmin(Boolean(allowed))
      } catch {
        if (isMounted) setIsAdmin(false)
      }
    }
    check()
    return () => {
      isMounted = false
    }
  }, [user])



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
      // Enhanced glassmorphism styling to match site aesthetic
      transition: 'all 0.3s ease-out',
      background: 'rgba(151, 86, 125, 0.05)',
      backdropFilter: 'blur(31.9617px)',
      WebkitBackdropFilter: 'blur(31.9617px)',
      border: '1.59809px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 8px 32px rgba(151, 86, 125, 0.1)',
      // Enhanced border radius to match site design
      borderRadius: 'clamp(38px, 4vw, 9999px)',
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
                 className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl shadow-lg transition-all duration-200 hover:brightness-110 hover:scale-105 flex items-center justify-center"
                 style={{ 
                   background: '#000000',
                   boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                 }}
               >
                 <span 
                   className="text-sm sm:text-base font-black leading-none"
                   style={{ 
                     color: '#ffffff',
                     textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                   }}
                 >
                   PM
                 </span>
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

              
              {user ? (
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div 
                    className="flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-2xl border transition-all duration-200 hover:brightness-110"
                    style={{
                      background: 'rgba(151, 86, 125, 0.05)',
                      backdropFilter: 'blur(31.9617px)',
                      WebkitBackdropFilter: 'blur(31.9617px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)'
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
              {/* Enhanced Mobile Menu Button with glassmorphism */}
              <button
                className="p-3 -m-1 rounded-2xl transition-all duration-200 hover:brightness-110 hover:scale-105"
                style={{ 
                  background: 'rgba(151, 86, 125, 0.05)',
                  backdropFilter: 'blur(31.9617px)',
                  WebkitBackdropFilter: 'blur(31.9617px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)'
                }}
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
            <div className="md:hidden py-4 border-t px-4 sm:px-6" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
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
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div 
                      className="flex items-center space-x-2 px-3 py-2 rounded-2xl border transition-all duration-200 hover:brightness-110"
                      style={{
                        background: 'rgba(151, 86, 125, 0.05)',
                        backdropFilter: 'blur(31.9617px)',
                        WebkitBackdropFilter: 'blur(31.9617px)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(151, 86, 125, 0.1)'
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
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
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