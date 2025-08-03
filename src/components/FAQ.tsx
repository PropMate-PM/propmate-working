import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const faqs = [
  {
    question: "How does the cashback system work?",
    answer: "After purchasing a prop firm challenge using our affiliate links, submit proof of purchase and your crypto wallet address via our Discord server or by emailing support@proptrading.com. Once verified, we'll send your cashback based on the processing time of the specific prop firm."
  },
  {
    question: "Which cryptocurrencies do you support for payouts?",
    answer: "We support USDT and USDC on the Binance Smart Chain (BSC), Solana, Arbitrum, and Polygon networks. Be sure to specify your preferred network when submitting your wallet address."
  },
  {
    question: "How long does it take to receive my cashback?",
    answer: "Purchase verification typically takes 1–2 business days. After that, the payout timeline depends on the specific prop firm. You'll receive a confirmation email once your cashback has been sent."
  },
  {
    question: "Can I get cashback on any prop firm purchase?",
    answer: "Cashback is only eligible for purchases made through our affiliate links from the listed prop firms on this site. Please click the 'Purchase' button on our site before making your purchase. We're not responsible for any cookie issues or missed affiliate tracking."
  },
  {
    question: "What proof of purchase is required?",
    answer: "Accepted proof includes a screenshot of your confirmation email, receipt, or account dashboard showing the transaction. Submit your proof via our Discord server or email us at support@proptrading.com."
  },
  {
    question: "Is there a minimum purchase amount to qualify for cashback?",
    answer: "No, there’s no minimum purchase requirement. You'll receive the stated cashback percentage for any qualifying purchase, regardless of the amount."
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="text-center mb-12 sm:mb-16 p-6 sm:p-8 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <h2 className="typography-h3 sm:typography-h2 mb-4 sm:mb-6" style={{ color: theme.textPrimary }}>
            Frequently Asked Questions
          </h2>
          <p className="typography-body sm:typography-body-large" style={{ color: theme.textSecondary }}>
            Everything you need to know about our cashback program
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: theme.cardBackground,
                backdropFilter: theme.backdropFilter,
                borderColor: theme.cardBorder,
                boxShadow: theme.cardShadow
              }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 sm:px-8 py-4 sm:py-6 text-left flex items-center justify-between transition-colors hover:bg-opacity-80"
                style={{ 
                  backgroundColor: openIndex === index ? `${theme.accent}05` : 'transparent'
                }}
              >
                <h4 className="typography-ui sm:typography-h4 pr-4 text-left" style={{ color: theme.textPrimary }}>
                  {faq.question}
                </h4>
                {openIndex === index ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.accent }} />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.accent }} />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 sm:px-8 pb-4 sm:pb-6">
                  <p className="typography-small sm:typography-body leading-relaxed" style={{ color: theme.textSecondary }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div 
          className="text-center mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <p className="typography-body mb-4 sm:mb-6" style={{ color: theme.textSecondary }}>Still have questions?</p>
          <a 
            href="https://discord.gg/proptrading" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:brightness-110"
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