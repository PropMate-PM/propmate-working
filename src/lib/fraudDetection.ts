import { supabase } from './supabase'
import { logAuditEvent, getUserIP } from './auth'

export interface FraudAlert {
  id: string
  user_id?: string
  request_id?: string
  alert_type: 'duplicate_wallet' | 'duplicate_proof' | 'suspicious_ip' | 'high_amount' | 'rapid_requests' | 'invalid_data'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: any
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  investigated_by?: string
  investigated_at?: string
  resolution_notes?: string
  created_at: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fraudAlerts: FraudAlert[]
}

// Validation thresholds and limits
export const FRAUD_THRESHOLDS = {
  MAX_PURCHASE_AMOUNT: 50000, // $50,000 USD
  HIGH_AMOUNT_THRESHOLD: 10000, // $10,000 USD
  MAX_REQUESTS_PER_HOUR: 5,
  MAX_REQUESTS_PER_DAY: 20,
  MAX_USERS_PER_IP_PER_DAY: 10,
  SUSPICIOUS_IP_THRESHOLD: 5, // Different users from same IP in 24h
}

// Crypto wallet validation patterns
export const WALLET_PATTERNS = {
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  bitcoinSegwit: /^bc1[a-z0-9]{39,59}$/,
  litecoin: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
  dogecoin: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/,
  // Add more patterns as needed
}

/**
 * Validate crypto wallet address format
 */
export const validateWalletAddress = (address: string): { isValid: boolean; type?: string; errors: string[] } => {
  const errors: string[] = []
  
  if (!address || address.trim().length === 0) {
    errors.push('Wallet address is required')
    return { isValid: false, errors }
  }

  const cleanAddress = address.trim()
  
  // Check against known patterns
  for (const [type, pattern] of Object.entries(WALLET_PATTERNS)) {
    if (pattern.test(cleanAddress)) {
      return { isValid: true, type, errors: [] }
    }
  }

  errors.push('Invalid wallet address format. Please check your address and try again.')
  return { isValid: false, errors }
}

/**
 * Validate file upload (proof of purchase)
 */
export const validateProofFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']

  if (!file) {
    errors.push('Proof of purchase file is required')
    return { isValid: false, errors }
  }

  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB')
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be an image (JPEG, PNG, WebP) or PDF')
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /script/i,
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      errors.push('Suspicious file type detected')
      break
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .substring(0, 1000) // Limit length
}

/**
 * Check for duplicate wallet address
 */
export const checkDuplicateWallet = async (walletAddress: string, userId: string): Promise<FraudAlert[]> => {
  const alerts: FraudAlert[] = []
  
  try {
    const { data, error } = await supabase.rpc('check_duplicate_wallet', {
      wallet_addr: walletAddress,
      user_uuid: userId
    })

    if (error) {
      console.error('Error checking duplicate wallet:', error)
      return alerts
    }

    if (data === true) {
      // Create fraud alert
      const alertId = await createFraudAlert(
        userId,
        null,
        'duplicate_wallet',
        'high',
        {
          wallet_address: walletAddress,
          message: 'Wallet address already used by another user'
        }
      )

      if (alertId) {
        alerts.push({
          id: alertId,
          user_id: userId,
          alert_type: 'duplicate_wallet',
          severity: 'high',
          details: { wallet_address: walletAddress },
          status: 'open',
          created_at: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Error in checkDuplicateWallet:', error)
  }

  return alerts
}

/**
 * Check for duplicate proof of purchase
 */
export const checkDuplicateProof = async (proofUrl: string, userId: string): Promise<FraudAlert[]> => {
  const alerts: FraudAlert[] = []
  
  try {
    const { data, error } = await supabase.rpc('check_duplicate_proof', {
      proof_url_param: proofUrl,
      user_uuid: userId
    })

    if (error) {
      console.error('Error checking duplicate proof:', error)
      return alerts
    }

    if (data === true) {
      // Create fraud alert
      const alertId = await createFraudAlert(
        userId,
        null,
        'duplicate_proof',
        'critical',
        {
          proof_url: proofUrl,
          message: 'Proof of purchase already used by another user'
        }
      )

      if (alertId) {
        alerts.push({
          id: alertId,
          user_id: userId,
          alert_type: 'duplicate_proof',
          severity: 'critical',
          details: { proof_url: proofUrl },
          status: 'open',
          created_at: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Error in checkDuplicateProof:', error)
  }

  return alerts
}

/**
 * Check for rapid submissions from same user
 */
export const checkRapidSubmissions = async (userId: string): Promise<FraudAlert[]> => {
  const alerts: FraudAlert[] = []
  
  try {
    const { data, error } = await supabase.rpc('check_rapid_submissions', {
      user_uuid: userId
    })

    if (error) {
      console.error('Error checking rapid submissions:', error)
      return alerts
    }

    const submissionCount = data || 0
    
    if (submissionCount >= FRAUD_THRESHOLDS.MAX_REQUESTS_PER_HOUR) {
      // Create fraud alert
      const alertId = await createFraudAlert(
        userId,
        null,
        'rapid_requests',
        'medium',
        {
          submission_count: submissionCount,
          time_window: '1 hour',
          message: `${submissionCount} submissions in the last hour`
        }
      )

      if (alertId) {
        alerts.push({
          id: alertId,
          user_id: userId,
          alert_type: 'rapid_requests',
          severity: 'medium',
          details: { submission_count: submissionCount },
          status: 'open',
          created_at: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Error in checkRapidSubmissions:', error)
  }

  return alerts
}

/**
 * Check for suspicious IP activity
 */
export const checkSuspiciousIP = async (ipAddress: string, userId: string): Promise<FraudAlert[]> => {
  const alerts: FraudAlert[] = []
  
  try {
    const { data, error } = await supabase.rpc('check_suspicious_ip', {
      ip_addr: ipAddress
    })

    if (error) {
      console.error('Error checking suspicious IP:', error)
      return alerts
    }

    const userCount = data || 0
    
    if (userCount >= FRAUD_THRESHOLDS.SUSPICIOUS_IP_THRESHOLD) {
      // Create fraud alert
      const alertId = await createFraudAlert(
        userId,
        null,
        'suspicious_ip',
        'medium',
        {
          ip_address: ipAddress,
          user_count: userCount,
          message: `${userCount} different users from same IP in last 24 hours`
        }
      )

      if (alertId) {
        alerts.push({
          id: alertId,
          user_id: userId,
          alert_type: 'suspicious_ip',
          severity: 'medium',
          details: { ip_address: ipAddress, user_count: userCount },
          status: 'open',
          created_at: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Error in checkSuspiciousIP:', error)
  }

  return alerts
}

/**
 * Check for high amount transactions
 */
export const checkHighAmount = async (amount: number, userId: string): Promise<FraudAlert[]> => {
  const alerts: FraudAlert[] = []
  
  if (amount > FRAUD_THRESHOLDS.MAX_PURCHASE_AMOUNT) {
    // Create fraud alert for excessive amount
    const alertId = await createFraudAlert(
      userId,
      null,
      'high_amount',
      'critical',
      {
        amount: amount,
        threshold: FRAUD_THRESHOLDS.MAX_PURCHASE_AMOUNT,
        message: `Purchase amount exceeds maximum allowed ($${FRAUD_THRESHOLDS.MAX_PURCHASE_AMOUNT})`
      }
    )

    if (alertId) {
      alerts.push({
        id: alertId,
        user_id: userId,
        alert_type: 'high_amount',
        severity: 'critical',
        details: { amount, threshold: FRAUD_THRESHOLDS.MAX_PURCHASE_AMOUNT },
        status: 'open',
        created_at: new Date().toISOString()
      })
    }
  } else if (amount > FRAUD_THRESHOLDS.HIGH_AMOUNT_THRESHOLD) {
    // Create fraud alert for high amount (for review)
    const alertId = await createFraudAlert(
      userId,
      null,
      'high_amount',
      'medium',
      {
        amount: amount,
        threshold: FRAUD_THRESHOLDS.HIGH_AMOUNT_THRESHOLD,
        message: `High value transaction ($${amount}) requires review`
      }
    )

    if (alertId) {
      alerts.push({
        id: alertId,
        user_id: userId,
        alert_type: 'high_amount',
        severity: 'medium',
        details: { amount, threshold: FRAUD_THRESHOLDS.HIGH_AMOUNT_THRESHOLD },
        status: 'open',
        created_at: new Date().toISOString()
      })
    }
  }

  return alerts
}

/**
 * Create a fraud alert in the database
 */
export const createFraudAlert = async (
  userId: string,
  requestId: string | null,
  alertType: FraudAlert['alert_type'],
  severity: FraudAlert['severity'],
  details: any
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('create_fraud_alert', {
      user_uuid: userId,
      request_uuid: requestId,
      alert_type_param: alertType,
      severity_param: severity,
      details_param: JSON.stringify(details)
    })

    if (error) {
      console.error('Error creating fraud alert:', error)
      return null
    }

    // Log audit event
    await logAuditEvent(
      userId,
      'fraud_alert_created',
      'fraud_alerts',
      data,
      null,
      { alert_type: alertType, severity, details },
      getUserIP(),
      navigator.userAgent
    )

    return data
  } catch (error) {
    console.error('Error in createFraudAlert:', error)
    return null
  }
}

/**
 * Comprehensive validation for cashback submissions
 */
export const validateCashbackSubmission = async (submission: {
  user_id: string
  firm_name: string
  purchase_amount: number
  wallet_address: string
  proof_url: string
  additional_details?: string
}): Promise<ValidationResult> => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    fraudAlerts: []
  }

  // Basic validation
  if (!submission.user_id) {
    result.errors.push('User ID is required')
  }

  if (!submission.firm_name || submission.firm_name.trim().length === 0) {
    result.errors.push('Prop firm selection is required')
  }

  if (!submission.purchase_amount || submission.purchase_amount <= 0) {
    result.errors.push('Purchase amount must be greater than 0')
  }

  if (!submission.wallet_address || submission.wallet_address.trim().length === 0) {
    result.errors.push('Wallet address is required')
  }

  if (!submission.proof_url || submission.proof_url.trim().length === 0) {
    result.errors.push('Proof of purchase is required')
  }

  // Wallet address validation
  if (submission.wallet_address) {
    const walletValidation = validateWalletAddress(submission.wallet_address)
    if (!walletValidation.isValid) {
      result.errors.push(...walletValidation.errors)
    }
  }

  // Sanitize text inputs
  submission.firm_name = sanitizeInput(submission.firm_name)
  submission.additional_details = sanitizeInput(submission.additional_details || '')

  // Fraud detection checks (only if basic validation passes)
  if (result.errors.length === 0) {
    try {
      // Check for duplicate wallet
      const duplicateWalletAlerts = await checkDuplicateWallet(submission.wallet_address, submission.user_id)
      result.fraudAlerts.push(...duplicateWalletAlerts)

      // Check for duplicate proof
      const duplicateProofAlerts = await checkDuplicateProof(submission.proof_url, submission.user_id)
      result.fraudAlerts.push(...duplicateProofAlerts)

      // Check for rapid submissions
      const rapidSubmissionAlerts = await checkRapidSubmissions(submission.user_id)
      result.fraudAlerts.push(...rapidSubmissionAlerts)

      // Check for high amount
      const highAmountAlerts = await checkHighAmount(submission.purchase_amount, submission.user_id)
      result.fraudAlerts.push(...highAmountAlerts)

      // Check for suspicious IP
      const ipAddress = getUserIP()
      if (ipAddress && ipAddress !== 'client-ip-unknown') {
        const suspiciousIPAlerts = await checkSuspiciousIP(ipAddress, submission.user_id)
        result.fraudAlerts.push(...suspiciousIPAlerts)
      }

      // Add warnings for fraud alerts
      for (const alert of result.fraudAlerts) {
        if (alert.severity === 'critical') {
          result.errors.push(`Security check failed: ${alert.details.message || 'Critical security issue detected'}`)
        } else if (alert.severity === 'high') {
          result.errors.push(`Security check failed: ${alert.details.message || 'High risk activity detected'}`)
        } else {
          result.warnings.push(`Security notice: ${alert.details.message || 'Potential security issue detected'}`)
        }
      }
    } catch (error) {
      console.error('Error during fraud detection:', error)
      result.warnings.push('Security checks could not be completed. Submission will be reviewed manually.')
    }
  }

  result.isValid = result.errors.length === 0

  return result
}

/**
 * Get fraud alerts for admin review
 */
export const getFraudAlerts = async (filters?: {
  status?: FraudAlert['status']
  severity?: FraudAlert['severity']
  alert_type?: FraudAlert['alert_type']
  limit?: number
}): Promise<FraudAlert[]> => {
  try {
    let query = supabase
      .from('fraud_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters?.alert_type) {
      query = query.eq('alert_type', filters.alert_type)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching fraud alerts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getFraudAlerts:', error)
    return []
  }
}

/**
 * Update fraud alert status
 */
export const updateFraudAlert = async (
  alertId: string,
  status: FraudAlert['status'],
  resolutionNotes?: string,
  investigatedBy?: string
): Promise<boolean> => {
  try {
    const updateData: any = {
      status,
      investigated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes
    }

    if (investigatedBy) {
      updateData.investigated_by = investigatedBy
    }

    const { error } = await supabase
      .from('fraud_alerts')
      .update(updateData)
      .eq('id', alertId)

    if (error) {
      console.error('Error updating fraud alert:', error)
      return false
    }

    // Log audit event
    await logAuditEvent(
      investigatedBy || null,
      'fraud_alert_updated',
      'fraud_alerts',
      alertId,
      null,
      { status, resolution_notes: resolutionNotes },
      getUserIP(),
      navigator.userAgent
    )

    return true
  } catch (error) {
    console.error('Error in updateFraudAlert:', error)
    return false
  }
}