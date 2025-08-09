import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gwpbbzjqharvfuuxxuek.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGJiempxaGFydmZ1dXh4dWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTUzMDcsImV4cCI6MjA2OTE5MTMwN30.LSxPfuzvXOhY_leqIGm7DG7Frw1FLu_acqK6dRQ1g_k'

// Debug environment variables
console.log('Environment variables check:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
console.log('Using URL:', supabaseUrl)
console.log('Using Key:', supabaseAnonKey ? 'SET' : 'NOT SET')

// Check if Supabase credentials are configured
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project-id.supabase.co' || 
    supabaseAnonKey === 'your-anon-key-here') {
  console.error('Supabase credentials not configured. Please update your .env file with actual Supabase project credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export interface PropFirm {
  id: string
  name: string
  logo_url: string
  description: string
  affiliate_link: string
  discount_percentage: number
  cashback_percentage: number
  is_active: boolean
  created_at: string
  category: 'futures' | 'forex'
  is_first_time_offer: boolean
}

export interface CashbackSubmission {
  id: string
  name: string
  email: string
  prop_firm_id: string
  purchase_amount: number
  proof_url: string
  wallet_address: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
  updated_at: string
  user_id?: string
  prop_firms?: PropFirm
  // Enhanced fields from migration
  additional_details?: string
  admin_notes?: string
  processed_by?: string
  processed_at?: string
  firm_name?: string
  cashback_amount?: number
  ip_address?: string
  user_agent?: string
}

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

export interface AdminRole {
  id: string
  user_id: string
  role: 'super_admin' | 'admin' | 'moderator'
  granted_by?: string
  granted_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLogEntry {
  id: string
  user_id?: string
  action_type: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
  details?: any
  ip_address?: string
  user_agent?: string
  timestamp: string
}

export interface PayoutRecord {
  id: string
  user_id: string
  user_email: string
  cashback_submission_ids: string[]
  payout_amount: number
  crypto_wallet_address: string
  transaction_hash?: string
  payout_date: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateEthereumAddress = (address: string): boolean => {
  // Basic Ethereum address validation (starts with 0x, 42 characters total)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  return ethRegex.test(address)
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Enhanced validation functions
export const validateWalletAddress = (address: string, type?: string): boolean => {
  if (!address || address.trim().length === 0) return false
  
  const patterns = {
    bep20: /^0x[a-fA-F0-9]{40}$/, // Same as Ethereum format
    trc20: /^T[a-zA-Z0-9]{33}$/, // Tron addresses start with T and are 34 chars
    arbitrum: /^0x[a-fA-F0-9]{40}$/, // Same as Ethereum format
    // Legacy patterns for backward compatibility
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    bitcoinSegwit: /^bc1[a-z0-9]{39,59}$/,
    litecoin: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // Base58 encoded
    other: /^.+$/, // Accept any non-empty string for other networks
  }
  
  // If type specified, check that pattern
  if (type && patterns[type as keyof typeof patterns]) {
    return patterns[type as keyof typeof patterns].test(address.trim())
  }
  
  // Otherwise check all patterns
  return Object.values(patterns).some(pattern => pattern.test(address.trim()))
}

export const sanitizeInput = (input: string): string => {
  if (!input) return ''
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000) // Limit length
}

// Check for duplicate submissions with enhanced logic
export const checkDuplicateSubmission = async (
  userId: string,
  propFirmId: string,
  purchaseAmount: number,
  walletAddress: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('cashback_submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('prop_firm_id', propFirmId)
    .eq('purchase_amount', purchaseAmount)
    .eq('wallet_address', walletAddress)
    .neq('status', 'rejected') // Don't count rejected submissions
    .limit(1)

  if (error) {
    console.error('Error checking duplicate submission:', error)
    return false
  }

  return data && data.length > 0
}

// Secure submission creation with fraud detection
export const createCashbackSubmission = async (
  submissionData: {
    user_id: string
    name: string
    email: string
    prop_firm_id: string
    purchase_amount: number
    proof_url: string
    wallet_address: string
    additional_details?: string
    ip_address?: string
    user_agent?: string
  }
): Promise<{ success: boolean; data?: CashbackSubmission; error?: string; warnings?: string[] }> => {
  try {
    // Input validation and sanitization
    const sanitizedData = {
      ...submissionData,
      name: sanitizeInput(submissionData.name),
      additional_details: sanitizeInput(submissionData.additional_details || ''),
      wallet_address: submissionData.wallet_address.trim()
    }

    // Validate wallet address
    if (!validateWalletAddress(sanitizedData.wallet_address)) {
      return { success: false, error: 'Invalid wallet address format' }
    }

    // Validate purchase amount
    if (sanitizedData.purchase_amount <= 0 || sanitizedData.purchase_amount > 50000) {
      return { success: false, error: 'Invalid purchase amount' }
    }

    // Check for duplicates
    const isDuplicate = await checkDuplicateSubmission(
      sanitizedData.user_id,
      sanitizedData.prop_firm_id,
      sanitizedData.purchase_amount,
      sanitizedData.wallet_address
    )

    if (isDuplicate) {
      return { success: false, error: 'Duplicate submission detected' }
    }

    // Get prop firm details for firm_name and cashback calculation
    const { data: propFirm, error: firmError } = await supabase
      .from('prop_firms')
      .select('name, cashback_percentage')
      .eq('id', sanitizedData.prop_firm_id)
      .single()

    if (firmError || !propFirm) {
      return { success: false, error: 'Invalid prop firm selected' }
    }

    // Calculate cashback amount
    const cashbackAmount = (sanitizedData.purchase_amount * propFirm.cashback_percentage) / 100

    // Create the submission
    const { data, error } = await supabase
      .from('cashback_submissions')
      .insert({
        ...sanitizedData,
        firm_name: propFirm.name,
        cashback_amount: cashbackAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        prop_firms (
          name,
          logo_url,
          cashback_percentage
        )
      `)
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return { success: false, error: 'Failed to create submission' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createCashbackSubmission:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Admin function to update submission status
export const updateSubmissionStatus = async (
  submissionId: string,
  status: 'pending' | 'approved' | 'paid' | 'rejected',
  adminNotes?: string,
  processedBy?: string
): Promise<{ success: boolean; data?: CashbackSubmission; error?: string }> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    }

    if (adminNotes) {
      updateData.admin_notes = sanitizeInput(adminNotes)
    }

    if (processedBy) {
      updateData.processed_by = processedBy
    }

    const { data, error } = await supabase
      .from('cashback_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select(`
        *,
        prop_firms (
          name,
          logo_url,
          cashback_percentage
        )
      `)
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return { success: false, error: 'Failed to update submission' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateSubmissionStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get submissions with proper security filtering
export const getUserSubmissions = async (userId: string): Promise<CashbackSubmission[]> => {
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user submissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserSubmissions:', error)
    return []
  }
}

// Admin function to get all submissions with filtering
export const getAllSubmissions = async (filters?: {
  status?: string
  dateFrom?: string
  dateTo?: string
  firmName?: string
  limit?: number
}): Promise<CashbackSubmission[]> => {
  try {
    let query = supabase
      .from('cashback_submissions')
      .select(`
        *,
        prop_firms (
          name,
          logo_url,
          cashback_percentage
        )
      `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters?.firmName) {
      query = query.ilike('firm_name', `%${filters.firmName}%`)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching all submissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllSubmissions:', error)
    return []
  }
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !(!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project-id.supabase.co' || 
    supabaseAnonKey === 'your-anon-key-here')
}