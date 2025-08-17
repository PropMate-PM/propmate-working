import React, { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase, type CashbackSubmission } from '../lib/supabase'

interface UserSavingsTrackerProps {
  user: any
}

interface SavingsData {
  totalDiscountSaved: number
  totalCashbackEarned: number
  totalCashbackPaid: number
  totalPendingCashback: number
  totalSavings: number
  totalRequests: number
  approvedRequests: number
  pendingRequests: number
  rejectedRequests: number
  savingsByFirm: { [key: string]: { discount: number; cashback: number; pendingCashback: number; requests: number; firmName: string } }
}

export default function UserSavingsTracker({ user }: UserSavingsTrackerProps) {
  const { theme } = useTheme()
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalDiscountSaved: 0,
    totalCashbackEarned: 0,
    totalCashbackPaid: 0,
    totalPendingCashback: 0,
    totalSavings: 0,
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    savingsByFirm: {}
  })
  const [loading, setLoading] = useState(true)
  

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
      totalPendingCashback: 0,
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
        data.totalPendingCashback += cashbackAmount
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
          pendingCashback: 0,
          requests: 0,
          firmName
        }
      }

      data.savingsByFirm[firmId].discount += discountAmount
      data.savingsByFirm[firmId].requests++
      
      if (submission.status === 'paid') {
        data.savingsByFirm[firmId].cashback += cashbackAmount
      } else if (submission.status === 'pending') {
        data.savingsByFirm[firmId].pendingCashback += cashbackAmount
      }
    })

    // Calculate total savings
    data.totalSavings = data.totalCashbackEarned + data.totalPendingCashback

    return data
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
          total_pending_cashback: data.totalPendingCashback,
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
          background: 'rgba(151, 86, 125, 0.05)',
          border: '1.59809px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(31.9617px)',
          borderRadius: '38.3541px'
        }}
      >
        <div className="text-center mb-6">
          <h3 className="typography-h3 mb-2" style={{ color: theme.textPrimary }}>Your Total Savings</h3>
          <div className="text-4xl font-bold mb-2" style={{ color: theme.accent }}>
            ${savingsData.totalSavings.toFixed(2)}
          </div>
          <p className="typography-body" style={{ color: theme.textSecondary }}>
            Combined approved and pending cashback
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl border" style={{ background: 'rgba(151, 86, 125, 0.05)', border: '1.59809px solid rgba(255, 255, 255, 0.1)', borderRadius: '38.3541px' }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.accent }}>
              ${savingsData.totalPendingCashback.toFixed(2)}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Pending Cashback
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border" style={{ background: 'rgba(151, 86, 125, 0.05)', border: '1.59809px solid rgba(255, 255, 255, 0.1)', borderRadius: '38.3541px' }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.accent }}>
              ${savingsData.totalCashbackEarned.toFixed(2)}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Cashback Earned
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border" style={{ background: 'rgba(151, 86, 125, 0.05)', border: '1.59809px solid rgba(255, 255, 255, 0.1)', borderRadius: '38.3541px' }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
              {savingsData.totalRequests}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Total Requests
            </div>
          </div>

          <div className="text-center p-4 rounded-xl border" style={{ background: 'rgba(151, 86, 125, 0.05)', border: '1.59809px solid rgba(255, 255, 255, 0.1)', borderRadius: '38.3541px' }}>
            <div className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
              {savingsData.approvedRequests}
            </div>
            <div className="typography-small font-semibold" style={{ color: theme.textSecondary }}>
              Approved
            </div>
          </div>
        </div>
      </div>

      

      {/* Savings by Prop Firm */}
      {Object.keys(savingsData.savingsByFirm).length > 0 && (
        <div 
          className="p-6 rounded-2xl border"
          style={{
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px'
          }}
        >
          <h4 className="typography-h4 mb-4" style={{ color: theme.textPrimary }}>Cashback by Prop Firm</h4>
          <div className="space-y-3">
            {Object.entries(savingsData.savingsByFirm)
              .sort(([,a], [,b]) => (b.cashback + b.pendingCashback) - (a.cashback + a.pendingCashback))
              .map(([firmId, firmData]) => (
                <div key={firmId} className="flex items-center justify-between p-4 rounded-xl border" style={{ background: 'rgba(151, 86, 125, 0.05)', border: '1.59809px solid rgba(255, 255, 255, 0.1)', borderRadius: '38.3541px' }}>
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
                      ${(firmData.cashback + firmData.pendingCashback).toFixed(2)}
                    </p>
                    <div className="flex space-x-4 typography-small" style={{ color: theme.textSecondary }}>
                      <span>Approved: ${firmData.cashback.toFixed(2)}</span>
                      <span>Pending: ${firmData.pendingCashback.toFixed(2)}</span>
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
            background: 'rgba(151, 86, 125, 0.05)',
            border: '1.59809px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(31.9617px)',
            borderRadius: '38.3541px'
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
            Submit your first cashback request to start tracking your savings.
          </p>
        </div>
      )}
    </div>
  )
}