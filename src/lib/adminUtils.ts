import { supabase } from './supabase'
import { logAuditEvent, getUserIP } from './auth'
import { emailService } from './emailService'
import type { CashbackSubmission, FraudAlert, AuditLogEntry, PayoutRecord } from './supabase'

export interface AdminAnalytics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  paidRequests: number
  rejectedRequests: number
  totalCashbackPaid: number
  totalCashbackPending: number
  avgProcessingTime: number
  topPropFirms: Array<{ name: string; count: number; totalAmount: number }>
  recentActivity: Array<{
    id: string
    action: string
    user_email: string
    timestamp: string
    details: any
  }>
  fraudAlerts: {
    open: number
    critical: number
    high: number
    medium: number
    low: number
  }
}

export interface DashboardStats {
  todayStats: {
    newRequests: number
    processedRequests: number
    totalAmount: number
  }
  weeklyStats: {
    newRequests: number
    processedRequests: number
    totalAmount: number
  }
  monthlyStats: {
    newRequests: number
    processedRequests: number
    totalAmount: number
  }
}

/**
 * Get comprehensive admin analytics
 */
export const getAdminAnalytics = async (): Promise<AdminAnalytics> => {
  try {
    // Get submission statistics
    const { data: submissions, error: submissionsError } = await supabase
      .from('cashback_submissions')
      .select(`
        id,
        status,
        purchase_amount,
        cashback_amount,
        firm_name,
        created_at,
        processed_at,
        email
      `)

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      throw submissionsError
    }

    // Calculate basic stats
    const totalRequests = submissions?.length || 0
    const pendingRequests = submissions?.filter(s => s.status === 'pending').length || 0
    const approvedRequests = submissions?.filter(s => s.status === 'approved').length || 0
    const paidRequests = submissions?.filter(s => s.status === 'paid').length || 0
    const rejectedRequests = submissions?.filter(s => s.status === 'rejected').length || 0

    const totalCashbackPaid = submissions
      ?.filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (s.cashback_amount || 0), 0) || 0

    const totalCashbackPending = submissions
      ?.filter(s => ['pending', 'approved'].includes(s.status))
      .reduce((sum, s) => sum + (s.cashback_amount || 0), 0) || 0

    // Calculate average processing time
    const processedSubmissions = submissions?.filter(s => s.processed_at && s.created_at) || []
    const avgProcessingTime = processedSubmissions.length > 0
      ? processedSubmissions.reduce((sum, s) => {
          const created = new Date(s.created_at).getTime()
          const processed = new Date(s.processed_at!).getTime()
          return sum + (processed - created)
        }, 0) / processedSubmissions.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0

    // Get top prop firms
    const firmStats = submissions?.reduce((acc, s) => {
      const firmName = s.firm_name || 'Unknown'
      if (!acc[firmName]) {
        acc[firmName] = { count: 0, totalAmount: 0 }
      }
      acc[firmName].count++
      acc[firmName].totalAmount += s.purchase_amount || 0
      return acc
    }, {} as Record<string, { count: number; totalAmount: number }>) || {}

    const topPropFirms = Object.entries(firmStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Get recent activity from audit log
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_log')
      .select('*')
      .in('action_type', [
        'cashback_submission_created',
        'cashback_submission_updated',
        'login_success',
        'fraud_alert_created'
      ])
      .order('timestamp', { ascending: false })
      .limit(10)

    const recentActivity = auditLogs?.map(log => ({
      id: log.id,
      action: log.action_type,
      user_email: log.details?.email || 'System',
      timestamp: log.timestamp,
      details: log.details
    })) || []

    // Get fraud alert statistics
    const { data: fraudAlerts, error: fraudError } = await supabase
      .from('fraud_alerts')
      .select('status, severity')

    const fraudStats = fraudAlerts?.reduce((acc, alert) => {
      if (alert.status === 'open') acc.open++
      if (alert.severity === 'critical') acc.critical++
      if (alert.severity === 'high') acc.high++
      if (alert.severity === 'medium') acc.medium++
      if (alert.severity === 'low') acc.low++
      return acc
    }, { open: 0, critical: 0, high: 0, medium: 0, low: 0 }) || { open: 0, critical: 0, high: 0, medium: 0, low: 0 }

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      paidRequests,
      rejectedRequests,
      totalCashbackPaid,
      totalCashbackPending,
      avgProcessingTime,
      topPropFirms,
      recentActivity,
      fraudAlerts: fraudStats
    }
  } catch (error) {
    console.error('Error getting admin analytics:', error)
    throw error
  }
}

/**
 * Get dashboard statistics for different time periods
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get submissions for different periods
    const { data: allSubmissions, error } = await supabase
      .from('cashback_submissions')
      .select('created_at, processed_at, status, purchase_amount')
      .gte('created_at', monthAgo.toISOString())

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }

    const submissions = allSubmissions || []

    // Calculate today's stats
    const todaySubmissions = submissions.filter(s => 
      new Date(s.created_at) >= today
    )
    const todayProcessed = submissions.filter(s => 
      s.processed_at && new Date(s.processed_at) >= today
    )

    // Calculate weekly stats
    const weeklySubmissions = submissions.filter(s => 
      new Date(s.created_at) >= weekAgo
    )
    const weeklyProcessed = submissions.filter(s => 
      s.processed_at && new Date(s.processed_at) >= weekAgo
    )

    // Calculate monthly stats (all submissions in the data)
    const monthlySubmissions = submissions
    const monthlyProcessed = submissions.filter(s => 
      s.processed_at && new Date(s.processed_at) >= monthAgo
    )

    return {
      todayStats: {
        newRequests: todaySubmissions.length,
        processedRequests: todayProcessed.length,
        totalAmount: todaySubmissions.reduce((sum, s) => sum + (s.purchase_amount || 0), 0)
      },
      weeklyStats: {
        newRequests: weeklySubmissions.length,
        processedRequests: weeklyProcessed.length,
        totalAmount: weeklySubmissions.reduce((sum, s) => sum + (s.purchase_amount || 0), 0)
      },
      monthlyStats: {
        newRequests: monthlySubmissions.length,
        processedRequests: monthlyProcessed.length,
        totalAmount: monthlySubmissions.reduce((sum, s) => sum + (s.purchase_amount || 0), 0)
      }
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    throw error
  }
}

/**
 * Process cashback request approval
 */
export const approveCashbackRequest = async (
  requestId: string,
  adminId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the submission details
    const { data: submission, error: fetchError } = await supabase
      .from('cashback_submissions')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('cashback_submissions')
      .update({
        status: 'approved',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return { success: false, error: 'Failed to update submission' }
    }

    // Send approval email
    try {
      await emailService.sendRequestApprovedEmail(
        submission.email,
        {
          userName: submission.name,
          firmName: submission.firm_name || 'Unknown Firm',
          purchaseAmount: submission.purchase_amount,
          cashbackAmount: submission.cashback_amount || 0,
          requestId: submission.id,
          walletAddress: submission.wallet_address
        },
        submission.user_id
      )
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the approval if email fails
    }

    // Log audit event
    await logAuditEvent(
      adminId,
      'cashback_request_approved',
      'cashback_submissions',
      requestId,
      { status: 'pending' },
      { status: 'approved', admin_notes: adminNotes },
      getUserIP(),
      navigator.userAgent
    )

    return { success: true }
  } catch (error) {
    console.error('Error approving cashback request:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Process cashback request rejection
 */
export const rejectCashbackRequest = async (
  requestId: string,
  adminId: string,
  reason: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the submission details
    const { data: submission, error: fetchError } = await supabase
      .from('cashback_submissions')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('cashback_submissions')
      .update({
        status: 'rejected',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes || reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return { success: false, error: 'Failed to update submission' }
    }

    // Send rejection email
    try {
      await emailService.sendStatusChangeEmail(
        submission.email,
        submission.name,
        'rejected',
        submission.purchase_amount,
        submission.firm_name || 'Unknown Firm',
        submission.user_id
      )
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError)
      // Don't fail the rejection if email fails
    }

    // Log audit event
    await logAuditEvent(
      adminId,
      'cashback_request_rejected',
      'cashback_submissions',
      requestId,
      { status: 'pending' },
      { status: 'rejected', admin_notes: adminNotes, reason },
      getUserIP(),
      navigator.userAgent
    )

    return { success: true }
  } catch (error) {
    console.error('Error rejecting cashback request:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Process payout for approved cashback request
 */
export const processPayout = async (
  requestId: string,
  adminId: string,
  transactionHash: string,
  actualAmount?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the submission details
    const { data: submission, error: fetchError } = await supabase
      .from('cashback_submissions')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !submission) {
      return { success: false, error: 'Submission not found' }
    }

    if (submission.status !== 'approved') {
      return { success: false, error: 'Request must be approved before payout' }
    }

    const payoutAmount = actualAmount || submission.cashback_amount || 0

    // Update submission status to paid
    const { error: updateError } = await supabase
      .from('cashback_submissions')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return { success: false, error: 'Failed to update submission' }
    }

    // Create payout log entry
    const { error: payoutError } = await supabase
      .from('payout_log')
      .insert({
        request_id: requestId,
        user_id: submission.user_id,
        wallet_address: submission.wallet_address,
        amount_sent: payoutAmount,
        transaction_hash: transactionHash,
        admin_id: adminId,
        firm_name: submission.firm_name || 'Unknown Firm',
        original_purchase_amount: submission.purchase_amount,
        status: 'completed',
        sent_at: new Date().toISOString()
      })

    if (payoutError) {
      console.error('Error creating payout log:', payoutError)
      // Revert submission status
      await supabase
        .from('cashback_submissions')
        .update({ status: 'approved' })
        .eq('id', requestId)
      
      return { success: false, error: 'Failed to log payout' }
    }

    // Send payment confirmation email
    try {
      await emailService.sendPaymentSentEmail(
        submission.email,
        {
          userName: submission.name,
          firmName: submission.firm_name || 'Unknown Firm',
          amount: payoutAmount,
          walletAddress: submission.wallet_address,
          transactionHash,
          requestId: submission.id
        },
        submission.user_id
      )
    } catch (emailError) {
      console.error('Error sending payment email:', emailError)
      // Don't fail the payout if email fails
    }

    // Log audit event
    await logAuditEvent(
      adminId,
      'payout_processed',
      'payout_log',
      requestId,
      null,
      { 
        amount: payoutAmount,
        transaction_hash: transactionHash,
        wallet_address: submission.wallet_address
      },
      getUserIP(),
      navigator.userAgent
    )

    return { success: true }
  } catch (error) {
    console.error('Error processing payout:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk process multiple requests
 */
export const bulkProcessRequests = async (
  requestIds: string[],
  action: 'approve' | 'reject',
  adminId: string,
  reason?: string
): Promise<{ processed: number; failed: number; errors: string[] }> => {
  const results = { processed: 0, failed: 0, errors: [] as string[] }

  for (const requestId of requestIds) {
    try {
      if (action === 'approve') {
        const result = await approveCashbackRequest(requestId, adminId)
        if (result.success) {
          results.processed++
        } else {
          results.failed++
          results.errors.push(`${requestId}: ${result.error}`)
        }
      } else {
        const result = await rejectCashbackRequest(requestId, adminId, reason || 'Bulk rejection')
        if (result.success) {
          results.processed++
        } else {
          results.failed++
          results.errors.push(`${requestId}: ${result.error}`)
        }
      }
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      results.failed++
      results.errors.push(`${requestId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Log bulk action
  await logAuditEvent(
    adminId,
    `bulk_${action}_requests`,
    null,
    null,
    null,
    { 
      request_count: requestIds.length,
      processed: results.processed,
      failed: results.failed,
      action,
      reason
    },
    getUserIP(),
    navigator.userAgent
  )

  return results
}

/**
 * Export data for accounting/reporting
 */
export const exportData = async (
  type: 'submissions' | 'payouts' | 'analytics',
  filters?: {
    dateFrom?: string
    dateTo?: string
    status?: string
    firmName?: string
  }
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    let query
    let selectFields = '*'

    switch (type) {
      case 'submissions':
        query = supabase.from('cashback_submissions')
        selectFields = `
          id,
          name,
          email,
          firm_name,
          purchase_amount,
          cashback_amount,
          wallet_address,
          status,
          created_at,
          processed_at,
          admin_notes
        `
        break
      case 'payouts':
        query = supabase.from('payout_log')
        selectFields = `
          id,
          user_id,
          wallet_address,
          amount_sent,
          transaction_hash,
          firm_name,
          original_purchase_amount,
          sent_at,
          status
        `
        break
      case 'analytics':
        // For analytics, we'll return a summary
        const analytics = await getAdminAnalytics()
        return { success: true, data: [analytics] }
    }

    query = query.select(selectFields)

    // Apply filters
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.firmName) {
      query = query.ilike('firm_name', `%${filters.firmName}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error exporting data:', error)
      return { success: false, error: 'Failed to export data' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in exportData:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get system health status
 */
export const getSystemHealth = async (): Promise<{
  status: 'healthy' | 'warning' | 'error'
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
    timestamp: string
  }>
}> => {
  const checks = []
  const timestamp = new Date().toISOString()

  // Check database connectivity
  try {
    const { error } = await supabase.from('prop_firms').select('count').limit(1)
    checks.push({
      name: 'Database Connection',
      status: error ? 'fail' : 'pass',
      message: error ? 'Database connection failed' : 'Database connection healthy',
      timestamp
    })
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: 'Database connection error',
      timestamp
    })
  }

  // Check for critical fraud alerts
  try {
    const { data: criticalAlerts, error } = await supabase
      .from('fraud_alerts')
      .select('count')
      .eq('severity', 'critical')
      .eq('status', 'open')

    const count = criticalAlerts?.[0]?.count || 0
    checks.push({
      name: 'Critical Fraud Alerts',
      status: count > 0 ? 'warning' : 'pass',
      message: count > 0 ? `${count} critical fraud alerts require attention` : 'No critical fraud alerts',
      timestamp
    })
  } catch (error) {
    checks.push({
      name: 'Critical Fraud Alerts',
      status: 'fail',
      message: 'Unable to check fraud alerts',
      timestamp
    })
  }

  // Check pending requests age
  try {
    const { data: oldPending, error } = await supabase
      .from('cashback_submissions')
      .select('count')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const count = oldPending?.[0]?.count || 0
    checks.push({
      name: 'Old Pending Requests',
      status: count > 10 ? 'warning' : 'pass',
      message: count > 10 ? `${count} requests pending for over 7 days` : 'No old pending requests',
      timestamp
    })
  } catch (error) {
    checks.push({
      name: 'Old Pending Requests',
      status: 'fail',
      message: 'Unable to check pending requests',
      timestamp
    })
  }

  // Determine overall status
  const hasFailures = checks.some(check => check.status === 'fail')
  const hasWarnings = checks.some(check => check.status === 'warning')
  
  const status = hasFailures ? 'error' : hasWarnings ? 'warning' : 'healthy'

  return { status, checks }
}