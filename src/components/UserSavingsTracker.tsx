import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Award, Target, Star, Gift } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase, type CashbackSubmission } from '../lib/supabase'

interface UserSavingsTrackerProps {
  user: any
}

interface SavingsData {
  totalDiscountSaved: number
  totalCashbackEarned: number
  totalCashbackPaid: number
  totalSavings: number
  totalRequests: number
  approvedRequests: number
  pendingRequests: number
  rejectedRequests: number
  savingsByFirm: { [key: string]: { discount: number; cashback: number; requests: number; firmName: string } }
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  threshold: number
  achieved: boolean
  progress: number
}

export default function UserSavingsTracker({ user }: UserSavingsTrackerProps) {
  const { theme } = useTheme()
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalDiscountSaved: 0,
    totalCashbackEarned: 0,
    totalCashbackPaid: 0,
    totalSavings: 0,
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    savingsByFirm: {}
  })
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    if (user) {
      fetchUserSavings()
    }
  }, [user])

  const fetchUserSavings = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch user's submissions
      const { data: submissions, error } = await supabase
        .from('cashback_submissions')
        .select(`
          *,
          prop_firms (
            name,
            cashback_percentage,
            discount_percentage
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate savings data
      const calculatedData = calculateSavingsData(submissions || [])
      setSavingsData(calculatedData)

      // Calculate achievements
      const userAchievements = calculateAchievements(calculatedData)
      setAchievements(userAchievements)

      // Update user savings tracker in database
      await updateUserSavingsTracker(calculatedData)
    } catch (err) {
      console.error('Error fetching user savings:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateSavingsData = (submissions: CashbackSubmission[]): SavingsData => {
    const data: SavingsData = {
      totalDiscountSaved: 0,
      totalCashbackEarned: 0,
      totalCashbackPaid: 0,
      totalSavings: 0,
      totalRequests: submissions.length,
      approvedRequests: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
      savingsByFirm: {}
    }

    submissions.forEach(submission => {
      const discountAmount = (submission.purchase_amount * (submission.prop_firms?.discount_percentage || 0)) / 100
      const cashbackAmount = (submission.purchase_amount * (submission.prop_firms?.cashback_percentage || 0)) / 100

      // Add to totals
      data.totalDiscountSaved += discountAmount

      if (submission.status === 'paid') {
        data.totalCashbackEarned += cashbackAmount
        data.approvedRequests++
      } else if (submission.status === 'pending') {
        data.pendingRequests++
      } else if (submission.status === 'rejected') {
        data.rejectedRequests++
      }

      // Group by firm
      const firmId = submission.prop_firm_id
      const firmName = submission.prop_firms?.name || 'Unknown Firm'
      
      if (!data.savingsByFirm[firmId]) {
        data.savingsByFirm[firmId] = {
          discount: 0,
          cashback: 0,
          requests: 0,
          firmName
        }
      }

      data.savingsByFirm[firmId].discount += discountAmount
      data.savingsByFirm[firmId].requests++
      
      if (submission.status === 'paid') {
        data.savingsByFirm[firmId].cashback += cashbackAmount
      }
    })

    // Calculate total savings
    data.totalSavings = data.totalDiscountSaved + data.totalCashbackEarned

    return data
  }

  const calculateAchievements = (data: SavingsData): Achievement[] => {
    const achievements: Achievement[] = [
      {
        id: 'first_request',
        title: 'Getting Started',
        description: 'Submit your first cashback request',
        icon: <Star className="h-5 w-5" />,
        threshold: 1,
        achieved: data.totalRequests >= 1,
        progress: Math.min(data.totalRequests, 1)
      },
      {
        id: 'saver_100',
        title: 'Smart Saver',
        description: 'Save $100 in total discounts and cashback',
        icon: <DollarSign className="h-5 w-5" />,
        threshold: 100,
        achieved: data.totalSavings >= 100,
        progress: Math.min(data.totalSavings, 100)
      },
      {
        id: 'saver_500',
        title: 'Super Saver',
        description: 'Save $500 in total discounts and cashback',
        icon: <TrendingUp className="h-5 w-5" />,
        threshold: 500,
        achieved: data.totalSavings >= 500,
        progress: Math.min(data.totalSavings, 500)
      },
      {
        id: 'frequent_trader',
        title: 'Frequent Trader',
        description: 'Submit 5 cashback requests',
        icon: <Target className="h-5 w-5" />,
        threshold: 5,
        achieved: data.totalRequests >= 5,
        progress: Math.min(data.totalRequests, 5)
      },
      {
        id: 'cashback_master',
        title: 'Cashback Master',
        description: 'Earn $200 in approved cashback',
        icon: <Award className="h-5 w-5" />,
        threshold: 200,
        achieved: data.totalCashbackEarned >= 200,
        progress: Math.min(data.totalCashbackEarned, 200)
      },
      {
        id: 'diversified_trader',
        title: 'Diversified Trader',
        description: 'Trade with 3 different prop firms',
        icon: <Gift className="h-5 w-5" />,
        threshold: 3,
        achieved: Object.keys(data.savingsByFirm).length >= 3,
        progress: Math.min(Object.keys(data.savingsByFirm).length, 3)
      }
    ]

    return achievements
  }

  const updateUserSavingsTracker = async (data: SavingsData) => {
    try {
      const { error } = await supabase
        .from('user_savings_tracker')
        .upsert({
          user_id: user.id,
          user_email: user.email,
          total_discount_saved: data.totalDiscountSaved,
          total_cashback_earned: data.totalCashbackEarned,
          total_cashback_paid: data.totalCashbackPaid,
          total_requests: data.totalRequests,
          approved_requests: data.approvedRequests,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error updating user savings tracker:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.accent }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Savings Overview */}
      <div 
        className="p-6 rounded-2xl border"
        style={{
          backgroundColor: theme.cardBackground,
          backdropFilter: theme.backdropFilter,
          borderColor: theme.cardBorder,
          boxShadow: theme.cardShadow
        }}
      >
        <div className="text-center mb-6">
          <h3 className="typography-h3 mb-2" style={{ color: theme.textPrimary }}>Your Total Savings</h3>
          <div className="text-4xl font-bold mb-2" style={{ color: theme.accent }}>
            ${savingsData.totalSavings.toFixed(2)}
          </div>
          <p className="typography-body" style={{ color: theme.textSecondary }}>
            Combined discounts and cashback earned
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
              ${savingsData.totalDiscountSaved.toFixed(2)}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Discount Saved
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.accent }}>
              ${savingsData.totalCashbackEarned.toFixed(2)}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Cashback Earned
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
              {savingsData.totalRequests}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Total Requests
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
              {savingsData.approvedRequests}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Approved
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div 
        className="p-6 rounded-2xl border"
        style={{
          backgroundColor: theme.cardBackground,
          backdropFilter: theme.backdropFilter,
          borderColor: theme.cardBorder,
          boxShadow: theme.cardShadow
        }}
      >
        <h4 className="typography-h4 mb-4" style={{ color: theme.textPrimary }}>Achievements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                achievement.achieved ? 'hover:scale-105' : ''
              }`}
              style={{
                backgroundColor: achievement.achieved 
                  ? `${theme.accent}10` 
                  : theme.cardBackground,
                borderColor: achievement.achieved 
                  ? `${theme.accent}30` 
                  : theme.cardBorder,
                opacity: achievement.achieved ? 1 : 0.7
              }}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: achievement.achieved 
                      ? theme.accent 
                      : `${theme.textSecondary}20`,
                    color: achievement.achieved 
                      ? theme.ctaText 
                      : theme.textSecondary
                  }}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="typography-ui font-semibold" style={{ color: theme.textPrimary }}>
                      {achievement.title}
                    </h5>
                    {achievement.achieved && (
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    )}
                  </div>
                  <p className="typography-small mb-2" style={{ color: theme.textSecondary }}>
                    {achievement.description}
                  </p>
                  
                  {!achievement.achieved && (
                    <div>
                      <div 
                        className="w-full h-2 rounded-full mb-1"
                        style={{ backgroundColor: `${theme.textSecondary}20` }}
                      >
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: theme.accent,
                            width: `${(achievement.progress / achievement.threshold) * 100}%`
                          }}
                        />
                      </div>
                      <p className="typography-small" style={{ color: theme.textSecondary }}>
                        {achievement.progress.toFixed(0)} / {achievement.threshold}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Savings by Prop Firm */}
      {Object.keys(savingsData.savingsByFirm).length > 0 && (
        <div 
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <h4 className="typography-h4 mb-4" style={{ color: theme.textPrimary }}>Savings by Prop Firm</h4>
          <div className="space-y-3">
            {Object.entries(savingsData.savingsByFirm)
              .sort(([,a], [,b]) => (b.discount + b.cashback) - (a.discount + a.cashback))
              .map(([firmId, firmData]) => (
                <div key={firmId} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
                  <div>
                    <p className="typography-ui font-semibold mb-1" style={{ color: theme.textPrimary }}>
                      {firmData.firmName}
                    </p>
                    <p className="typography-small" style={{ color: theme.textSecondary }}>
                      {firmData.requests} request{firmData.requests !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="typography-ui font-bold mb-1" style={{ color: theme.accent }}>
                      ${(firmData.discount + firmData.cashback).toFixed(2)}
                    </p>
                    <div className="flex space-x-4 typography-small" style={{ color: theme.textSecondary }}>
                      <span>Discount: ${firmData.discount.toFixed(2)}</span>
                      <span>Cashback: ${firmData.cashback.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {savingsData.totalRequests === 0 && (
        <div 
          className="text-center py-12 p-6 rounded-2xl border"
          style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: theme.backdropFilter,
            borderColor: theme.cardBorder,
            boxShadow: theme.cardShadow
          }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${theme.accent}20` }}
          >
            <DollarSign className="h-8 w-8" style={{ color: theme.accent }} />
          </div>
          <h3 className="typography-h4 mb-2" style={{ color: theme.textPrimary }}>Start Saving Today</h3>
          <p className="typography-body mb-6" style={{ color: theme.textSecondary }}>
            Submit your first cashback request to start tracking your savings and earning achievements.
          </p>
        </div>
      )}
    </div>
  )
}