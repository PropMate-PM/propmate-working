import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import PropFirms from './components/PropFirms'
import CashbackModal from './components/CashbackModal'
import FAQ from './components/FAQ'
import AdminPanel from './components/AdminPanel'
import AuthModal from './components/AuthModal'
import SplineBackground from './components/SplineBackground'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { supabase, type PropFirm } from './lib/supabase'
import { onAuthStateChange, signOut } from './lib/auth'

function AppContent() {
  const [propFirms, setPropFirms] = useState<PropFirm[]>([])
  const [selectedPropFirm, setSelectedPropFirm] = useState<PropFirm | null>(null)
  const [isCashbackModalOpen, setIsCashbackModalOpen] = useState(false)
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin')
  const [user, setUser] = useState<any>(null)
  const { theme } = useTheme()

  useEffect(() => {
    fetchPropFirms()
    
    // Set up auth state listener
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const fetchPropFirms = async () => {
    try {
      const { data, error } = await supabase
        .from('prop_firms')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setPropFirms(data || [])
    } catch (err) {
      console.error('Error fetching prop firms:', err)
    }
  }

  const handleClaimCashback = (propFirm: PropFirm) => {
    if (!user) {
      setAuthModalMode('signup')
      setIsAuthModalOpen(true)
      return
    }
    setSelectedPropFirm(propFirm)
    setIsCashbackModalOpen(true)
  }

  const handleCloseCashbackModal = () => {
    setIsCashbackModalOpen(false)
    setSelectedPropFirm(null)
  }

  const handleAuthClick = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        // Removed backgroundColor to let Spline background show through
        // Ensure content is above the fixed background layers
        position: 'relative',
        zIndex: 1
      }}
    >
      <SplineBackground />
      <Header 
        onAdminClick={() => setIsAdminPanelOpen(true)}
        user={user}
        onAuthClick={handleAuthClick}
        onSignOut={handleSignOut}
      />
      <Hero />
      <HowItWorks />
      <PropFirms propFirms={propFirms} onClaimCashback={handleClaimCashback} />
      <FAQ />
      {/* Legal Footer Links */}
      <div className="px-4 sm:px-6 lg:px-8 mt-12 mb-10">
        <div 
          className="max-w-5xl mx-auto p-4 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px'
          }}
        >
          <div className="text-center sm:text-left">
            <p className="typography-small sm:typography-ui font-semibold" style={{ color: theme.textPrimary }}>Legal</p>
            <p className="typography-small" style={{ color: theme.textSecondary }}>Read our Terms & Conditions and Privacy Policy</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2.5 rounded-2xl typography-ui font-semibold border transition-all hover:brightness-110"
              style={{
                background: 'rgba(151, 86, 125, 0.05)',
                border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                color: theme.textPrimary
              }}
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2.5 rounded-2xl typography-ui font-semibold border transition-all hover:brightness-110"
              style={{
                background: 'rgba(151, 86, 125, 0.05)',
                border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                color: theme.textPrimary
              }}
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
      
      <CashbackModal
        isOpen={isCashbackModalOpen}
        onClose={handleCloseCashbackModal}
        propFirm={selectedPropFirm}
        user={user}
      />
      
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        user={user}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App