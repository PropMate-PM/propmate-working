import React from 'react'
import { Search, ExternalLink, Gift } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function HowItWorks() {
  const { theme } = useTheme()

  const steps = [
    {
      number: 1,
      title: "Choose a Platform",
      description: "Browse our list of supported platforms and pick the one you want to purchase from. We only list trusted prop firms and brokers offering the best available deals.",
      icon: <Search className="h-8 w-8" />
    },
    {
      number: 2,
      title: "Activate Discount", 
      description: "Click the Purchase button. You'll be redirected to the platform's official website through our affiliate link. Use the highest discount available there to complete your purchase.",
      icon: <ExternalLink className="h-8 w-8" />
    },
    {
      number: 3,
      title: "Claim Your Cashback",
      description: "After purchasing, return to our site and click the Claim Cashback button. Submit your proof of purchase and required details. We'll review your submission and notify you once it's approved.",
      icon: <Gift className="h-8 w-8" />
    }
  ]

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          className="text-center mb-16 sm:mb-20 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 md:p-8 gap-6"
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
          <h2 className="typography-h2 mb-4" style={{ color: theme.textPrimary }}>
            How It Works
          </h2>
          <p className="typography-body-large max-w-2xl mx-auto" style={{ color: theme.textSecondary }}>
            Get started with our simple 3-step process to earn cashback on your prop trading purchases.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto items-stretch">
          {steps.map((step, index) => (
            <div key={step.number} className="relative h-full">
              {/* Step Card */}
              <div
                className="group transition-all duration-300 hover:scale-105 w-full h-full flex flex-col items-center justify-center p-8 gap-6 text-center"
                style={{
                  position: 'relative',
                  minHeight: '320px',
                  background: 'rgba(151, 86, 125, 0.05)',
                  border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(31.9617px)',
                  borderRadius: '38.3541px'
                }}
              >
                {/* Step Number Badge */}
                <div 
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.cta} 100%)`,
                    color: theme.ctaText,
                    boxShadow: `0 4px 16px ${theme.accent}40`
                  }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-2xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.accent}20 0%, ${theme.cta}20 100%)`,
                    boxShadow: `0 4px 16px ${theme.accent}20`
                  }}
                >
                  {React.cloneElement(step.icon, { style: { color: theme.accent } })}
                </div>

                {/* Title */}
                <h3 className="typography-h3" style={{ color: theme.textPrimary }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p className="typography-body leading-relaxed" style={{ color: theme.textSecondary }}>
                  {step.description}
                </p>
              </div>

              {/* Connector Arrow (hidden on mobile, shown on large screens) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                  <div 
                    className="w-12 h-0.5"
                    style={{ backgroundColor: `${theme.accent}40` }}
                  >
                    <div 
                      className="absolute -right-1 -top-1.5 w-0 h-0"
                      style={{
                        borderLeft: `8px solid ${theme.accent}40`,
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div 
          className="text-center mt-16 sm:mt-20 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 md:p-8 gap-6"
          style={{
            position: 'relative',
            minHeight: '150px',
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px'
          }}
        >
          <p className="typography-body-large mb-4" style={{ color: theme.textSecondary }}>
            Ready to start earning cashback?
          </p>
          <button 
            onClick={() => {
              const element = document.querySelector('#firms')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="px-8 py-4 rounded-2xl typography-ui font-bold transition-all duration-300 hover:scale-105 transform"
            style={{
              background: `linear-gradient(135deg, ${theme.cta} 0%, ${theme.accent} 100%)`,
              color: theme.ctaText,
              boxShadow: `0 12px 40px ${theme.cta}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }}
          >
            Browse Prop Firms
          </button>
        </div>
      </div>
    </section>
  )
}