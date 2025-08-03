import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase credentials are configured
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project-id.supabase.co' || 
    supabaseAnonKey === 'your-anon-key-here') {
  console.error('Supabase credentials not configured. Please update your .env file with actual Supabase project credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  status: 'pending' | 'paid' | 'rejected'
  created_at: string
  updated_at: string
  user_id?: string
  prop_firms?: PropFirm
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

// Check for duplicate submissions
export const checkDuplicateSubmission = async (
  userId: string,
  propFirmId: string,
  purchaseAmount: number,
  proofUrl: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('cashback_submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('prop_firm_id', propFirmId)
    .eq('purchase_amount', purchaseAmount)
    .eq('proof_url', proofUrl)
    .limit(1)

  if (error) {
    console.error('Error checking duplicate submission:', error)
    return false
  }

  return data && data.length > 0
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !(!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project-id.supabase.co' || 
    supabaseAnonKey === 'your-anon-key-here')
}