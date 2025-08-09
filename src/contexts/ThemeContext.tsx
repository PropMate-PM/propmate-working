import React, { createContext, useContext } from 'react'

interface ThemeContextType {
  isDark: boolean
  theme: {
    background: string
    cardBackground: string
    cardBorder: string
    cardShadow: string
    textPrimary: string
    textSecondary: string
    accent: string
    cta: string
    ctaText: string
    backdropFilter: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDark = true // Always dark mode

  const theme = {
    // Dark theme only
    background: '#0D0D0D',
    cardBackground: 'rgba(237, 233, 242, 0.25)', // Much more opaque for visibility
    cardBorder: 'rgba(255, 255, 255, 0.12)', // More visible border
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    textPrimary: '#FFFFFF', // Pure white for maximum contrast
    textSecondary: '#E0E0E0', // Much lighter secondary text
    accent: '#E4D5F2',
    cta: '#D7C4F2',
    ctaText: '#0D0D0D',
    backdropFilter: 'blur(10px)' // Very strong blur effect
  }

  return (
    <ThemeContext.Provider value={{ isDark, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}