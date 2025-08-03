import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import PropFirms from './components/PropFirms'
import CashbackModal from './components/CashbackModal'
import FAQ from './components/FAQ'
import AdminPanel from './components/AdminPanel'
import AuthModal from './components/AuthModal'
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
        backgroundColor: theme.background,
        // Ensure content is above the fixed background layers
        position: 'relative',
        zIndex: 1
      }}
    >
      <Header 
        onAdminClick={() => setIsAdminPanelOpen(true)}
        user={user}
        onAuthClick={handleAuthClick}
        onSignOut={handleSignOut}
      />
      <Hero />
      <PropFirms propFirms={propFirms} onClaimCashback={handleClaimCashback} />
      <FAQ />
      
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