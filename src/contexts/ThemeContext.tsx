import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
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
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const theme = isDark ? {
    // Dark theme
    background: '#0D0D0D',
    cardBackground: 'rgba(237, 233, 242, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    textPrimary: '#EDE9F2',
    textSecondary: '#9A8FA6',
    accent: '#E4D5F2',
    cta: '#D7C4F2',
    ctaText: '#0D0D0D',
    backdropFilter: 'blur(14px)'
  } : {
    // Improved light theme with better contrast and brighter colors
    background: '#F8F6FB', // Lighter, more neutral background
    cardBackground: 'rgba(255, 255, 255, 0.85)', // More opaque white cards
    cardBorder: 'rgba(139, 90, 159, 0.15)', // Subtle purple border
    cardShadow: '0 8px 32px rgba(139, 90, 159, 0.08)', // Subtle purple shadow
    textPrimary: '#2D1B3D', // Much darker for excellent contrast
    textSecondary: '#5A4A6B', // Darker secondary text but still readable
    accent: '#8B5A9F', // Keep the purple accent
    cta: '#8B5A9F', // Purple CTA button
    ctaText: '#FFFFFF', // White text on purple button
    backdropFilter: 'blur(14px)'
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}