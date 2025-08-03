import React, { useState, useEffect, useRef } from 'react'
import { X, Users, DollarSign, TrendingUp, Mail, Settings, FileText, CreditCard, BarChart3, Send, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase, type CashbackSubmission, type PayoutRecord } from '../lib/supabase'

interface AdminDashboardProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}

interface RevenueAnalytics {
  month_year: string
  affiliate_commissions: number
  total_cashback_paid: number
  total_requests: number
  approved_requests: number
  rejected_requests: number
}

interface UserSavings {
  user_id: string
  user_email: string
  total_discount_saved: number
  total_cashback_earned: number
  total_cashback_paid: number
  total_requests: number
  approved_requests: number
}

export default function AdminDashboard({ isOpen, onClose, user }: AdminDashboardProps) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payouts' | 'analytics' | 'communications'>('overview')
  const [loading, setLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Data states
  const [submissions, setSubmissions] = useState<CashbackSubmission[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<RevenueAnalytics[]>([])
  const [userSavings, setUserSavings] = useState<UserSavings[]>([])
  
  // UI states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [processingPayout, setProcessingPayout] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchAllData()
    }
  }, [isOpen, user])

  // Set fixed container height after initial load
  useEffect(() => {
    if (!loading && containerRef.current) {
      // Calculate and set a fixed height based on viewport
      const viewportHeight = window.innerHeight
      const maxHeight = Math.min(viewportHeight * 0.9, 800) // 90% of viewport or 800px max
      const headerHeight = 120 // Approximate header height
      const contentHeight = maxHeight - headerHeight
      
      containerRef.current.style.height = `${contentHeight}px`
      containerRef.current.style.minHeight = `${contentHeight}px`
      containerRef.current.style.maxHeight = `${contentHeight}px`
    }
  }, [loading])

  // Handle smooth tab transitions
  const handleTabChange = (newTab: typeof activeTab) => {
    if (newTab === activeTab || isTransitioning) return

    setIsTransitioning(true)
    
    // Start fade out
    if (contentRef.current) {
      contentRef.current.style.opacity = '0'
      contentRef.current.style.transform = 'translateY(10px)'
    }

    // Change tab after fade out completes
    setTimeout(() => {
      setActiveTab(newTab)
      
      // Start fade in
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.opacity = '1'
          contentRef.current.style.transform = 'translateY(0)'
        }
        setIsTransitioning(false)
      }, 50)
    }, 200)
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSubmissions(),
        fetchPayouts(),
        fetchUsers(),
        fetchAnalytics(),
        fetchUserSavings()
      ])
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('cashback_submissions')
      .select(`
        *,
        prop_firms (
          name,
          logo_url,
          cashback_percentage,
          discount_percentage
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    setSubmissions(data || [])
  }

  const fetchPayouts = async () => {
    const { data, error } = await supabase
      .from('payout_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setPayouts(data || [])
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setUsers(data || [])
  }

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('*')
      .order('month_year', { ascending: false })

    if (error) throw error
    setAnalytics(data || [])
  }

  const fetchUserSavings = async () => {
    const { data, error } = await supabase
      .from('user_savings_tracker')
      .select('*')
      .order('total_cashback_earned', { ascending: false })

    if (error) throw error
    setUserSavings(data || [])
  }

  const updateSubmissionStatus = async (submissionId: string, status: 'paid' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('cashback_submissions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) throw error
      
      // Refresh submissions
      await fetchSubmissions()
      
      // If approved, create payout record
      if (status === 'paid') {
        const submission = submissions.find(s => s.id === submissionId)
        if (submission) {
          await createPayoutRecord(submission)
        }
      }
    } catch (err) {
      console.error('Error updating submission status:', err)
      alert('Error updating submission status')
    }
  }

  const createPayoutRecord = async (submission: CashbackSubmission) => {
    try {
      const payoutAmount = (submission.purchase_amount * (submission.prop_firms?.cashback_percentage || 0)) / 100

      const { error } = await supabase
        .from('payout_records')
        .insert({
          user_id: submission.user_id,
          user_email: submission.email,
          cashback_submission_ids: [submission.id],
          payout_amount: payoutAmount,
          crypto_wallet_address: submission.wallet_address,
          status: 'pending'
        })

      if (error) throw error
      await fetchPayouts()
    } catch (err) {
      console.error('Error creating payout record:', err)
    }
  }

  const markPayoutComplete = async (payoutId: string, transactionHash: string) => {
    setProcessingPayout(payoutId)
    try {
      const { error } = await supabase
        .from('payout_records')
        .update({
          status: 'completed',
          transaction_hash: transactionHash,
          payout_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutId)

      if (error) throw error
      await fetchPayouts()
    } catch (err) {
      console.error('Error marking payout complete:', err)
      alert('Error updating payout status')
    } finally {
      setProcessingPayout(null)
    }
  }

  const sendEmailToUser = async (userId: string, userEmail: string) => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Please enter both subject and message')
      return
    }

    setSendingEmail(true)
    try {
      // Store communication record
      const { error } = await supabase
        .from('user_communications')
        .insert({
          user_id: userId,
          user_email: userEmail,
          subject: emailSubject,
          message: emailMessage,
          communication_type: 'manual',
          sent_by_admin: true
        })

      if (error) throw error

      // In a real implementation, you would integrate with an email service here
      alert(`Email logged for ${userEmail}. In production, this would send via email service.`)
      
      setEmailSubject('')
      setEmailMessage('')
      setSelectedUser(null)
    } catch (err) {
      console.error('Error sending email:', err)
      alert('Error sending email')
    } finally {
      setSendingEmail(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="h-4 w-4" style={{ color: theme.accent }} />
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return { backgroundColor: `${theme.accent}10`, color: theme.accent, borderColor: `${theme.accent}20` }
      case 'rejected':
      case 'failed':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
      default:
        return { backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', borderColor: 'rgba(234, 179, 8, 0.2)' }
    }
  }

  const calculateTotals = () => {
    const totalRequests = submissions.length
    const pendingRequests = submissions.filter(s => s.status === 'pending').length
    const approvedRequests = submissions.filter(s => s.status === 'paid').length
    const totalCashbackOwed = submissions
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (s.purchase_amount * (s.prop_firms?.cashback_percentage || 0)) / 100, 0)
    const totalCashbackPaid = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.payout_amount, 0)

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalCashbackOwed,
      totalCashbackPaid,
      outstandingPayouts: totalCashbackOwed - totalCashbackPaid
    }
  }

  const totals = calculateTotals()

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(20px)' }}
    >
      <div 
        className="p-4 sm:p-6 max-w-7xl w-full flex flex-col rounded-2xl border"
        style={{
          backgroundColor: theme.cardBackground,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: theme.cardBorder,
          boxShadow: `${theme.cardShadow}, 0 0 0 1px rgba(255, 255, 255, 0.05)`,
          // Fixed dimensions to prevent size changes
          height: 'min(90vh, 800px)',
          maxHeight: 'min(90vh, 800px)'
        }}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
          <h2 className="typography-h4 sm:typography-h3" style={{ color: theme.textPrimary }}>Admin Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: theme.cardBackground }}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.textSecondary }} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          className="flex space-x-1 mb-4 sm:mb-6 p-1 rounded-2xl border overflow-x-auto flex-shrink-0"
          style={{
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder
          }}
        >
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'payouts', label: 'Payouts', icon: CreditCard },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'communications', label: 'Communications', icon: Mail }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              disabled={isTransitioning}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-xl typography-small sm:typography-ui font-semibold transition-all whitespace-nowrap disabled:opacity-50`}
              style={activeTab === tab.id ? {
                backgroundColor: `${theme.accent}20`,
                color: theme.accent,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              } : {
                color: theme.textSecondary
              }}
            >
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
            </button>
          ))}
        </div>

        {/* Fixed Height Content Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{
            // This will be set dynamically via useEffect
            transition: 'none' // Prevent any size transitions
          }}
        >
          {/* Tab Content with Animation */}
          <div 
            ref={contentRef}
            className="h-full overflow-y-auto transition-all duration-200 ease-in-out"
            style={{
              opacity: 1,
              transform: 'translateY(0)'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.accent }}></div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6 animate-fadeIn h-full">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div 
                        className="p-3 sm:p-6 rounded-2xl border"
                        style={{
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.cardBorder
                        }}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                          <span className="typography-small sm:typography-ui font-semibold" style={{ color: theme.textSecondary }}>Total Requests</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>{totals.totalRequests}</div>
                      </div>

                      <div 
                        className="p-3 sm:p-6 rounded-2xl border"
                        style={{
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.cardBorder
                        }}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                          <span className="typography-small sm:typography-ui font-semibold" style={{ color: theme.textSecondary }}>Pending</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>{totals.pendingRequests}</div>
                      </div>

                      <div 
                        className="p-3 sm:p-6 rounded-2xl border"
                        style={{
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.cardBorder
                        }}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                          <span className="typography-small sm:typography-ui font-semibold" style={{ color: theme.textSecondary }}>Cashback Owed</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>${totals.totalCashbackOwed.toFixed(2)}</div>
                      </div>

                      <div 
                        className="p-3 sm:p-6 rounded-2xl border"
                        style={{
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.cardBorder
                        }}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                          <span className="typography-small sm:typography-ui font-semibold" style={{ color: theme.textSecondary }}>Cashback Paid</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>${totals.totalCashbackPaid.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Recent Submissions */}
                    <div 
                      className="p-4 sm:p-6 rounded-2xl border flex-1 overflow-hidden"
                      style={{
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <h3 className="typography-ui sm:typography-h4 mb-4" style={{ color: theme.textPrimary }}>Recent Submissions</h3>
                      <div className="space-y-4 overflow-y-auto max-h-96">
                        {submissions.slice(0, 5).map((submission) => (
                          <div key={submission.id} className="p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
                            {/* Header with basic info */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={submission.prop_firms?.logo_url || ''}
                                  alt="Prop firm logo"
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="typography-ui font-semibold" style={{ color: theme.textPrimary }}>{submission.name}</p>
                                  <p className="typography-small" style={{ color: theme.textSecondary }}>{submission.prop_firms?.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="typography-ui font-bold" style={{ color: theme.accent }}>${submission.purchase_amount.toFixed(2)}</p>
                                <span 
                                  className="px-3 py-1 rounded-full typography-small font-semibold border flex items-center"
                                  style={getStatusColor(submission.status)}
                                >
                                  {getStatusIcon(submission.status)}
                                  <span className="ml-1 capitalize">{submission.status}</span>
                                </span>
                              </div>
                            </div>

                            {/* Detailed information */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Email</p>
                                <p className="typography-small break-all" style={{ color: theme.textPrimary }}>{submission.email}</p>
                              </div>
                              <div>
                                <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Submitted</p>
                                <p className="typography-small" style={{ color: theme.textPrimary }}>
                                  {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="lg:col-span-2">
                                <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Proof of Purchase</p>
                                <a 
                                  href={submission.proof_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="typography-small break-all text-blue-500 hover:text-blue-600 underline"
                                >
                                  {submission.proof_url}
                                </a>
                              </div>
                              <div className="lg:col-span-2">
                                <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Wallet Address</p>
                                <p className="font-mono typography-small break-all p-2 rounded border" style={{ 
                                  color: theme.textPrimary,
                                  backgroundColor: `${theme.cardBackground}80`,
                                  borderColor: theme.cardBorder
                                }}>
                                  {submission.wallet_address}
                                </p>
                              </div>
                            </div>

                            {/* Action buttons for pending submissions */}
                            {submission.status === 'pending' && (
                              <div className="flex space-x-3 pt-3 border-t" style={{ borderColor: theme.cardBorder }}>
                                <button
                                  onClick={() => updateSubmissionStatus(submission.id, 'paid')}
                                  className="flex-1 px-4 py-2 rounded-lg typography-small font-semibold transition-colors"
                                  style={{ backgroundColor: theme.accent, color: theme.ctaText }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                                  className="flex-1 px-4 py-2 rounded-lg typography-small font-semibold transition-colors bg-red-500 text-white"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-4 sm:space-y-6 animate-fadeIn h-full">
                    <div 
                      className="p-4 sm:p-6 rounded-2xl border flex-1 overflow-hidden"
                      style={{
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <h3 className="typography-ui sm:typography-h4 mb-4" style={{ color: theme.textPrimary }}>Registered Users ({users.length})</h3>
                      <div className="space-y-3 overflow-y-auto max-h-full">
                        {users.map((user) => {
                          const userSubmissions = submissions.filter(s => s.user_id === user.id)
                          const userSaving = userSavings.find(s => s.user_id === user.id)
                          
                          return (
                            <div key={user.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-3 sm:p-4 rounded-xl border space-y-3 lg:space-y-0" style={{ borderColor: theme.cardBorder }}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div 
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${theme.accent}20` }}
                                  >
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: theme.accent }} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="typography-small sm:typography-ui font-semibold break-all" style={{ color: theme.textPrimary }}>{user.email}</p>
                                    <p className="typography-small" style={{ color: theme.textSecondary }}>
                                      Joined {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                                  <div>
                                    <p className="typography-small font-semibold" style={{ color: theme.textSecondary }}>Requests</p>
                                    <p className="typography-small sm:typography-ui font-bold" style={{ color: theme.textPrimary }}>{userSubmissions.length}</p>
                                  </div>
                                  <div>
                                    <p className="typography-small font-semibold" style={{ color: theme.textSecondary }}>Earned</p>
                                    <p className="typography-small sm:typography-ui font-bold" style={{ color: theme.accent }}>
                                      ${userSaving?.total_cashback_earned.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="typography-small font-semibold" style={{ color: theme.textSecondary }}>Paid</p>
                                    <p className="typography-small sm:typography-ui font-bold" style={{ color: theme.textPrimary }}>
                                      ${userSaving?.total_cashback_paid.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="px-3 sm:px-4 py-2 rounded-lg typography-small sm:typography-ui font-semibold transition-colors flex items-center justify-center space-x-2 w-full lg:w-auto"
                                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
                              >
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Email</span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payouts Tab */}
                {activeTab === 'payouts' && (
                  <div className="space-y-4 sm:space-y-6 animate-fadeIn h-full">
                    <div 
                      className="p-4 sm:p-6 rounded-2xl border flex-1 overflow-hidden"
                      style={{
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <h3 className="typography-ui sm:typography-h4 mb-4" style={{ color: theme.textPrimary }}>Payout Management</h3>
                      <div className="space-y-4 overflow-y-auto max-h-full">
                        {payouts.map((payout) => (
                          <div key={payout.id} className="p-3 sm:p-4 rounded-xl border" style={{ borderColor: theme.cardBorder }}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                              <div className="min-w-0 flex-1">
                                <p className="typography-small sm:typography-ui font-semibold break-all" style={{ color: theme.textPrimary }}>{payout.user_email}</p>
                                <p className="typography-small" style={{ color: theme.textSecondary }}>
                                  Created {new Date(payout.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="typography-small sm:typography-ui font-bold" style={{ color: theme.accent }}>${payout.payout_amount.toFixed(2)}</p>
                                <span 
                                  className="px-2 sm:px-3 py-1 rounded-full typography-small font-semibold border flex items-center w-fit"
                                  style={getStatusColor(payout.status)}
                                >
                                  {getStatusIcon(payout.status)}
                                  <span className="ml-1 capitalize">{payout.status}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-3">
                              <div>
                                <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Wallet Address</p>
                                <p className="font-mono typography-small break-all p-2 rounded border" style={{ 
                                  color: theme.textPrimary,
                                  backgroundColor: `${theme.cardBackground}80`,
                                  borderColor: theme.cardBorder
                                }}>
                                  {payout.crypto_wallet_address}
                                </p>
                              </div>
                              {payout.transaction_hash && (
                                <div>
                                  <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Transaction Hash</p>
                                  <p className="font-mono typography-small break-all p-2 rounded border" style={{ 
                                    color: theme.textPrimary,
                                    backgroundColor: `${theme.cardBackground}80`,
                                    borderColor: theme.cardBorder
                                  }}>
                                    {payout.transaction_hash}
                                  </p>
                                </div>
                              )}
                            </div>

                            {payout.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                <input
                                  type="text"
                                  placeholder="Transaction hash"
                                  className="flex-1 px-3 py-2 rounded-lg border typography-small"
                                  style={{
                                    backgroundColor: theme.cardBackground,
                                    borderColor: theme.cardBorder,
                                    color: theme.textPrimary
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const hash = (e.target as HTMLInputElement).value
                                      if (hash.trim()) {
                                        markPayoutComplete(payout.id, hash.trim())
                                      }
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const input = document.querySelector(`input[placeholder="Transaction hash"]`) as HTMLInputElement
                                    const hash = input?.value.trim()
                                    if (hash) {
                                      markPayoutComplete(payout.id, hash)
                                    }
                                  }}
                                  disabled={processingPayout === payout.id}
                                  className="px-3 sm:px-4 py-2 rounded-lg typography-small sm:typography-ui font-semibold transition-colors disabled:opacity-50 w-full sm:w-auto"
                                  style={{ backgroundColor: theme.accent, color: theme.ctaText }}
                                >
                                  {processingPayout === payout.id ? 'Processing...' : 'Mark Paid'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-4 sm:space-y-6 animate-fadeIn h-full">
                    <div 
                      className="p-4 sm:p-6 rounded-2xl border flex-1 overflow-hidden"
                      style={{
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <h3 className="typography-ui sm:typography-h4 mb-6" style={{ color: theme.textPrimary }}>Revenue Analytics</h3>
                      
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <div className="p-3 sm:p-4 rounded-xl border text-center" style={{ borderColor: theme.cardBorder }}>
                          <p className="typography-small font-semibold mb-2" style={{ color: theme.textSecondary }}>Total Users</p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>{users.length}</p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border text-center" style={{ borderColor: theme.cardBorder }}>
                          <p className="typography-small font-semibold mb-2" style={{ color: theme.textSecondary }}>Conversion Rate</p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: theme.accent }}>
                            {totals.totalRequests > 0 ? ((totals.approvedRequests / totals.totalRequests) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border text-center" style={{ borderColor: theme.cardBorder }}>
                          <p className="typography-small font-semibold mb-2" style={{ color: theme.textSecondary }}>Avg Cashback</p>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>
                            ${totals.approvedRequests > 0 ? (totals.totalCashbackOwed / totals.approvedRequests).toFixed(2) : '0.00'}
                          </p>
                        </div>
                      </div>

                      {/* Top Users by Savings */}
                      <div className="overflow-y-auto max-h-96">
                        <h4 className="typography-small sm:typography-ui font-semibold mb-4" style={{ color: theme.textPrimary }}>Top Users by Total Savings</h4>
                        <div className="space-y-3">
                          {userSavings.slice(0, 10).map((saving, index) => (
                            <div key={saving.user_id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: theme.cardBorder }}>
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div 
                                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center typography-small font-bold flex-shrink-0"
                                  style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
                                >
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="typography-small sm:typography-ui font-semibold break-all" style={{ color: theme.textPrimary }}>{saving.user_email}</p>
                                  <p className="typography-small" style={{ color: theme.textSecondary }}>
                                    {saving.total_requests} requests • {saving.approved_requests} approved
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="typography-small sm:typography-ui font-bold" style={{ color: theme.accent }}>
                                  ${(saving.total_cashback_earned + saving.total_discount_saved).toFixed(2)}
                                </p>
                                <p className="typography-small" style={{ color: theme.textSecondary }}>total savings</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Communications Tab */}
                {activeTab === 'communications' && (
                  <div className="space-y-4 sm:space-y-6 animate-fadeIn h-full">
                    <div 
                      className="p-4 sm:p-6 rounded-2xl border flex-1 overflow-hidden"
                      style={{
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <h3 className="typography-ui sm:typography-h4 mb-4" style={{ color: theme.textPrimary }}>User Communications</h3>
                      <p className="typography-small sm:typography-body mb-6" style={{ color: theme.textSecondary }}>
                        Send emails to users and manage communication history. In production, this would integrate with an email service.
                      </p>
                      
                      <div 
                        className="p-3 sm:p-4 rounded-xl border mb-6"
                        style={{
                          backgroundColor: 'rgba(234, 179, 8, 0.1)',
                          borderColor: 'rgba(234, 179, 8, 0.2)'
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="typography-small sm:typography-ui font-semibold text-yellow-800 mb-1">Email Integration Required</p>
                            <p className="typography-small text-yellow-700">
                              This feature logs email communications but requires integration with an email service (like EmailJS, SendGrid, or AWS SES) to actually send emails.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto max-h-96">
                        <div>
                          <h4 className="typography-small sm:typography-ui font-semibold mb-3" style={{ color: theme.textPrimary }}>Quick Actions</h4>
                          <div className="space-y-3">
                            <button
                              className="w-full p-3 rounded-xl border text-left transition-colors hover:bg-opacity-80"
                              style={{
                                backgroundColor: `${theme.accent}10`,
                                borderColor: `${theme.accent}20`,
                                color: theme.textPrimary
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                                <div>
                                  <p className="typography-small sm:typography-ui font-semibold">Welcome New Users</p>
                                  <p className="typography-small" style={{ color: theme.textSecondary }}>Send welcome email to recent signups</p>
                                </div>
                              </div>
                            </button>
                            
                            <button
                              className="w-full p-3 rounded-xl border text-left transition-colors hover:bg-opacity-80"
                              style={{
                                backgroundColor: theme.cardBackground,
                                borderColor: theme.cardBorder,
                                color: theme.textPrimary
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <Send className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.accent }} />
                                <div>
                                  <p className="typography-small sm:typography-ui font-semibold">Broadcast Announcement</p>
                                  <p className="typography-small" style={{ color: theme.textSecondary }}>Send message to all users</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="typography-small sm:typography-ui font-semibold mb-3" style={{ color: theme.textPrimary }}>Recent Communications</h4>
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg border" style={{ borderColor: theme.cardBorder }}>
                              <p className="typography-small" style={{ color: theme.textSecondary }}>No communications sent yet</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Email Modal */}
        {selectedUser && (
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(20px)' }}
          >
            <div 
              className="p-4 sm:p-6 max-w-md w-full rounded-2xl border"
              style={{
                backgroundColor: theme.cardBackground,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderColor: theme.cardBorder,
                boxShadow: `${theme.cardShadow}, 0 0 0 1px rgba(255, 255, 255, 0.05)`
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="typography-ui sm:typography-h4" style={{ color: theme.textPrimary }}>Send Email</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
                  style={{ backgroundColor: theme.cardBackground }}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.textSecondary }} />
                </button>
              </div>
              
              <p className="typography-small sm:typography-body mb-4 break-all" style={{ color: theme.textSecondary }}>
                To: {selectedUser.email}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border typography-small sm:typography-body"
                    style={{
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary
                    }}
                    placeholder="Email subject"
                  />
                </div>

                <div>
                  <label className="block typography-small font-semibold mb-2" style={{ color: theme.textPrimary }}>Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border typography-small sm:typography-body resize-none"
                    style={{
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary
                    }}
                    placeholder="Email message"
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 px-4 py-2 rounded-lg typography-small sm:typography-ui font-semibold border transition-colors"
                    style={{
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      color: theme.textSecondary
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => sendEmailToUser(selectedUser.id, selectedUser.email)}
                    disabled={sendingEmail}
                    className="flex-1 px-4 py-2 rounded-lg typography-small sm:typography-ui font-semibold transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.ctaText
                    }}
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for fade animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}