import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const faqs = [
  {
    question: "How does the cashback system work?",
    answer: "After purchasing a prop firm challenge using our affiliate links, submit proof of purchase and your crypto wallet address by emailing support@propmate.site. Once verified, we'll send your cashback based on the processing time of the specific prop firm."
  },
  {
    question: "Which cryptocurrencies do you support for payouts?",
    answer: "We support USDT and USDC on the Binance Smart Chain (BSC), Solana, Arbitrum, and Polygon networks. Be sure to specify your preferred network when submitting your wallet address."
  },
  {
    question: "How long does it take to receive my cashback?",
    answer: "Purchase verification typically takes 1–2 business days. After that, payout can take up to 1-4 weeks. You'll receive a confirmation email once your cashback has been sent."
  },
  {
    question: "Can I get cashback on any prop firm purchase?",
    answer: "Cashback is only eligible for purchases made through our affiliate links from the listed prop firms on this site. Please click the 'Purchase' button on our site before making your purchase. We're not responsible for any cookie issues or missed affiliate tracking."
  },
  {
    question: "What proof of purchase is required?",
    answer: "Accepted proof includes a screenshot of your confirmation email, receipt, or account dashboard showing the transaction. Submit your proof by emailing us at support@propmate.site."
  },
  {
    question: "Is there a minimum purchase amount to qualify for cashback?",
    answer: "No, there's no minimum purchase requirement. You'll receive the stated cashback percentage for any qualifying purchase, regardless of the amount."
  },
  {
    question: "Is there a minimum payout threshold?",
    answer: "Yes, the minimum payout is $50. If your cashback is below that, it will carry over to future payouts. If you're buying smaller accounts (e.g., $5,000) and find it difficult to reach $50, you can choose to either forfeit your cashback in exchange for access to exclusive account giveaways, or use your accumulated cashback to purchase a new prop firm account, provided the cashback amount matches the price of an account from any of our partnered firms."
  }
];


export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { theme } = useTheme()

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Header */}
        <div 
          className="text-center mb-12 sm:mb-16 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 md:p-8 gap-6"
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: theme.textPrimary }}>
            Frequently Asked Questions
          </h2>
          <p className="text-base md:text-lg" style={{ color: theme.textSecondary }}>
            Everything you need to know about our cashback program
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
                          className="w-full max-w-5xl mx-auto overflow-hidden"
            style={{
              position: 'relative',
              background: 'rgba(151, 86, 125, 0.05)',
              border: '1.59809px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(31.9617px)',
              borderRadius: '38.3541px'
            }}
            >
              {/* FAQ Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left flex items-center justify-between transition-colors hover:bg-opacity-80 p-4 md:p-8 gap-4 md:gap-6"
                style={{
                  position: 'relative',
                  minHeight: '80px',
                  background: openIndex === index ? 'rgba(151, 86, 125, 0.1)' : 'transparent'
                }}
              >
                <h4 className="text-lg md:text-xl font-bold pr-4 text-left" style={{ color: theme.textPrimary }}>
                  {faq.question}
                </h4>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: theme.accent }} />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: theme.accent }} />
                )}
              </button>
              
              {/* FAQ Answer */}
              {openIndex === index && (
                <div 
                  className="w-full p-4 md:p-8"
                  style={{
                    boxSizing: 'border-box',
                    position: 'relative',
                    minHeight: '120px',
                    background: 'rgba(151, 86, 125, 0.05)',
                    border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(31.9617px)',
                    borderRadius: '38.3541px'
                  }}
                >
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.textSecondary }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div 
          className="text-center mt-8 sm:mt-12 w-full max-w-5xl mx-auto"
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
          <p className="text-base mb-4" style={{ color: theme.textSecondary }}>Still have questions?</p>
          <a 
            href="https://discord.gg/proptrading" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:brightness-110"
            style={{
              backgroundColor: theme.cta,
              color: theme.ctaText,
              boxShadow: `0 4px 16px ${theme.cta}40`
            }}
          >
            Ask in Discord
          </a>
        </div>
      </div>
    </section>
  )
}