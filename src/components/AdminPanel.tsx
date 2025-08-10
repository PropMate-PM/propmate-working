import React, { useState, useEffect } from 'react'
import { X, CheckCircle, Clock, XCircle, ExternalLink, Settings } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase, type CashbackSubmission } from '../lib/supabase'
import { hasAdminPermission } from '../lib/auth'
import AdminDashboard from './AdminDashboard'
import UserSavingsTracker from './UserSavingsTracker'

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export default function AdminPanel({ isOpen, onClose, user }: AdminPanelProps) {
  const { theme } = useTheme()
  const [submissions, setSubmissions] = useState<CashbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('all')

  // Check if current user is admin (role-based)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      if (!user) {
        if (mounted) setIsAdmin(false)
        return
      }
      try {
        const allowed = await hasAdminPermission('admin')
        if (mounted) setIsAdmin(Boolean(allowed))
      } catch {
        if (mounted) setIsAdmin(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      if (isAdmin) {
        // Admin sees the full admin dashboard immediately
        return
      } else {
        // Regular users see their own submissions
        fetchUserSubmissions()
      }
    }
  }, [isOpen, user, isAdmin])

  const fetchUserSubmissions = async () => {
    if (!user || isAdmin) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cashback_submissions')
        .select(`
          *,
          prop_firms (
            name,
            logo_url,
            cashback_percentage
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (err) {
      console.error('Error fetching user submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => 
    filter === 'all' || sub.status === filter
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5" style={{ color: theme.accent }} />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { backgroundColor: `${theme.accent}10`, color: theme.accent, borderColor: `${theme.accent}20` }
      case 'rejected':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }
      default:
        return { backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', borderColor: 'rgba(234, 179, 8, 0.2)' }
    }
  }

  if (!isOpen) return null

  // If user is admin, show the admin dashboard directly
  if (isAdmin) {
    return (
      <AdminDashboard
        isOpen={true}
        onClose={onClose}
        user={user}
      />
    )
  }

  // Regular user dashboard
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(20px)' }}
    >
      <div 
        className="p-4 sm:p-6 max-w-7xl w-full flex flex-col"
        style={{
          background: 'rgba(151, 86, 125, 0.05)',
          border: '1.59809px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(31.9617px)',
          borderRadius: '38.3541px',
          height: 'min(90vh, 800px)',
          maxHeight: 'min(90vh, 800px)'
        }}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
          <h2 className="typography-h4 sm:typography-h3" style={{ color: theme.textPrimary }}>My Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl transition-colors hover:bg-opacity-80"
            style={{ background: 'rgba(151, 86, 125, 0.05)' }}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.textSecondary }} />
          </button>
        </div>

        {!user ? (
          <div className="text-center py-12">
            <p className="typography-ui font-semibold mb-4" style={{ color: theme.textSecondary }}>Please sign in to view your dashboard</p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl typography-ui font-semibold transition-all duration-200 hover:scale-105 transform"
              style={{
                background: `linear-gradient(135deg, ${theme.cta} 0%, ${theme.accent} 100%)`,
                color: theme.ctaText,
                boxShadow: `0 12px 40px ${theme.cta}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-4 sm:space-y-6">
            {/* User Savings Tracker */}
            <UserSavingsTracker user={user} />

            {/* Cashback Requests Section */}
            <div>
              <h3 className="typography-h4 mb-6" style={{ color: theme.textPrimary }}>My Cashback Requests</h3>
              
              {/* Filter Tabs */}
              <div 
                className="flex space-x-1 mb-4 sm:mb-6 p-1 overflow-x-auto flex-shrink-0"
                style={{
                  background: 'rgba(151, 86, 125, 0.05)',
                  border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '38.3541px'
                }}
              >
                {(['all', 'pending', 'paid', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-xl typography-small sm:typography-ui font-semibold transition-all whitespace-nowrap capitalize`}
                    style={filter === status ? {
                      backgroundColor: `${theme.accent}20`,
                      color: theme.accent,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    } : {
                      color: theme.textSecondary
                    }}
                  >
                    {status} ({submissions.filter(s => status === 'all' || s.status === status).length})
                  </button>
                ))}
              </div>

              {/* Submissions List */}
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.accent }}></div>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="typography-ui font-semibold mb-4" style={{ color: theme.textSecondary }}>
                      {submissions.length === 0 ? 'No cashback requests found' : `No ${filter} requests found`}
                    </p>
                    {submissions.length === 0 && (
                      <p className="typography-body" style={{ color: theme.textSecondary }}>
                        Submit your first cashback request by clicking "Claim Cashback" on any prop firm.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-4 sm:p-6 rounded-2xl border transition-all duration-200 hover:scale-105"
                        style={{
                          background: 'rgba(151, 86, 125, 0.05)',
                          border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: 'inset 0px 6.39234px 6.39234px rgba(0, 0, 0, 0.25)',
                          backdropFilter: 'blur(31.9617px)',
                          borderRadius: '38.3541px'
                        }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <img
                              src={submission.prop_firms?.logo_url || ''}
                              alt="Prop firm logo"
                              className="w-12 h-12 rounded-2xl object-cover border"
                              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                            />
                            <div>
                              <h4 className="typography-h4" style={{ color: theme.textPrimary }}>
                                {submission.prop_firms?.name}
                              </h4>
                              <p className="typography-small" style={{ color: theme.textSecondary }}>
                                Submitted {new Date(submission.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span 
                            className="px-4 py-2 rounded-2xl typography-small font-semibold border flex items-center"
                            style={getStatusColor(submission.status)}
                          >
                            {getStatusIcon(submission.status)}
                            <span className="ml-2 capitalize">{submission.status}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div>
                            <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Purchase Amount</p>
                            <p className="typography-ui font-semibold" style={{ color: theme.textPrimary }}>${submission.purchase_amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Cashback Amount</p>
                            <p className="typography-ui font-semibold" style={{ color: theme.accent }}>
                              ${((submission.purchase_amount * (submission.prop_firms?.cashback_percentage || 0)) / 100).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="typography-small font-semibold mb-1" style={{ color: theme.textSecondary }}>Last Updated</p>
                            <p className="typography-ui font-semibold" style={{ color: theme.textPrimary }}>
                              {new Date(submission.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="typography-small font-semibold mb-2" style={{ color: theme.textSecondary }}>Wallet Address</p>
                            <p 
                              className="font-mono typography-small px-3 py-2 rounded-xl break-all border"
                              style={{
                                background: 'rgba(151, 86, 125, 0.05)',
                                border: '1.59809px solid rgba(255, 255, 255, 0.1)',
                                color: theme.textPrimary
                              }}
                            >
                              {submission.wallet_address}
                            </p>
                          </div>
                          <div>
                            <p className="typography-small font-semibold mb-2" style={{ color: theme.textSecondary }}>Proof of Purchase</p>
                            <a
                              href={submission.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center typography-ui font-semibold transition-colors hover:opacity-80"
                              style={{ color: theme.accent }}
                            >
                              <span className="truncate">View Proof</span>
                              <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}