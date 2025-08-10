import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  created_at: string
}

export interface AuthError {
  message: string
  code?: string
}

// Password validation rules
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`)
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (PASSWORD_REQUIREMENTS.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one symbol (!@#$%^&* etc.)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Rate limiting check
export const checkRateLimit = async (identifier: string, action: 'login' | 'signup' | 'password_reset'): Promise<{ allowed: boolean; remainingAttempts?: number; resetTime?: Date }> => {
  try {
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Rate limit check timeout')), 5000) // 5 second timeout
    })

    const rateLimitPromise = supabase
      .from('rate_limits')
      .select('attempts, window_start, blocked_until')
      .eq('identifier', identifier)
      .eq('action_type', action)
      .single()

    const { data, error } = await Promise.race([rateLimitPromise, timeoutPromise]) as any

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Rate limit check error:', error)
      return { allowed: true } // Allow on error to avoid blocking legitimate users
    }

    if (!data) {
      // No previous attempts, allow
      return { allowed: true }
    }

    const now = new Date()
    const windowStart = new Date(data.window_start)
    const windowDuration = 10 * 60 * 1000 // 10 minutes in milliseconds

    // Check if user is currently blocked
    if (data.blocked_until && new Date(data.blocked_until) > now) {
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: new Date(data.blocked_until)
      }
    }

    // Check if we're in a new window
    if (now.getTime() - windowStart.getTime() > windowDuration) {
      // New window, reset attempts
      await supabase
        .from('rate_limits')
        .update({ 
          attempts: 0, 
          window_start: now.toISOString(),
          blocked_until: null,
          updated_at: now.toISOString()
        })
        .eq('identifier', identifier)
        .eq('action_type', action)
      
      return { allowed: true }
    }

    // Check if exceeded limit (5 attempts per 10 minutes)
    const maxAttempts = 5
    if (data.attempts >= maxAttempts) {
      // Block for additional 10 minutes
      const blockedUntil = new Date(now.getTime() + windowDuration)
      await supabase
        .from('rate_limits')
        .update({ 
          blocked_until: blockedUntil.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('identifier', identifier)
        .eq('action_type', action)
      
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: blockedUntil
      }
    }

    return { 
      allowed: true, 
      remainingAttempts: maxAttempts - data.attempts 
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return { allowed: true } // Allow on error to avoid blocking legitimate users
  }
}

// Record rate limit attempt
export const recordRateLimitAttempt = async (identifier: string, action: 'login' | 'signup' | 'password_reset'): Promise<void> => {
  try {
    const now = new Date()
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Rate limit record timeout')), 5000) // 5 second timeout
    })
    
    // Try to increment existing record
    const selectPromise = supabase
      .from('rate_limits')
      .select('attempts')
      .eq('identifier', identifier)
      .eq('action_type', action)
      .single()

    const { data, error } = await Promise.race([selectPromise, timeoutPromise]) as any

    if (error && error.code === 'PGRST116') {
      // No existing record, create new one
      const insertPromise = supabase
        .from('rate_limits')
        .insert({
          identifier,
          action_type: action,
          attempts: 1,
          window_start: now.toISOString()
        })
      
      await Promise.race([insertPromise, timeoutPromise])
    } else if (!error && data) {
      // Increment existing record
      const updatePromise = supabase
        .from('rate_limits')
        .update({ 
          attempts: data.attempts + 1,
          updated_at: now.toISOString()
        })
        .eq('identifier', identifier)
        .eq('action_type', action)
      
      await Promise.race([updatePromise, timeoutPromise])
    }
  } catch (error) {
    console.error('Failed to record rate limit attempt:', error)
    // Don't throw error as this shouldn't block the user
  }
}

// Log audit event
export const logAuditEvent = async (
  userId: string | null,
  actionType: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    // Don't block the main flow if audit logging fails
    const auditData = {
      user_id: userId,
      action_type: actionType,
      details: details || {},
      ip_address: ipAddress || getUserIP(),
      user_agent: userAgent || navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    // Use a timeout to prevent blocking
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Audit log timeout')), 5000) // 5 second timeout
    })

    const auditPromise = supabase
      .from('audit_log')
      .insert(auditData)

    await Promise.race([auditPromise, timeoutPromise])
  } catch (error) {
    // Log the error but don't throw - audit logging shouldn't block the main flow
    console.warn('Audit logging failed:', error)
  }
}

// Get user IP address (client-side approximation)
export const getUserIP = (): string => {
  // In a real application, you'd get this from the server
  // For now, we'll use a placeholder
  return 'client-ip-unknown'
}

export const signUp = async (email: string, password: string, firstName?: string, lastName?: string): Promise<any> => {
  // Validate email
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address')
  }

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join('. '))
  }

  // Check rate limiting
  const rateLimitCheck = await checkRateLimit(email, 'signup')
  if (!rateLimitCheck.allowed) {
    const resetTime = rateLimitCheck.resetTime
    const waitMinutes = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60)) : 10
    throw new Error(`Too many signup attempts. Please try again in ${waitMinutes} minutes.`)
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName || null,
          last_name: lastName || null
        }
      }
    })
    
    if (error) {
      // Record failed attempt
      await recordRateLimitAttempt(email, 'signup')
      
      // Log audit event
      await logAuditEvent(
        null,
        'signup_failed',
        { email, error: error.message },
        getUserIP(),
        navigator.userAgent
      )
      
      throw error
    }

    // Log successful signup
    await logAuditEvent(
      data.user?.id || null,
      'signup_success',
      { email },
      getUserIP(),
      navigator.userAgent
    )

    return data
  } catch (error) {
    // Record failed attempt for any error
    await recordRateLimitAttempt(email, 'signup')
    throw error
  }
}

export const signIn = async (email: string, password: string): Promise<any> => {
  // Validate email
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address')
  }

  try {
    console.log('Attempting to sign in with Supabase...')
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 30000) // 30 second timeout
    })
    
    const signInPromise = supabase.auth.signInWithPassword({
      email,
      password
    })
    
    const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any
    
    console.log('Supabase response:', { data, error })
    
    if (error) {
      console.error('Supabase auth error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before signing in.')
      } else if (error.message?.includes('Too many requests')) {
        throw new Error('Too many login attempts. Please wait a few minutes before trying again.')
      } else {
        throw new Error(error.message || 'Login failed. Please try again.')
      }
    }

    console.log('Login successful:', data)
    return data
  } catch (error) {
    console.error('Sign in error:', error)
    
    // Don't re-throw timeout errors as they're already handled
    if (error instanceof Error && error.message.includes('timed out')) {
      throw error
    }
    
    // Re-throw the error with a user-friendly message
    throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred during login.')
  }
}

export const signOut = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      // Handle various session-related errors gracefully
      if (error.code === 'session_not_found' || 
          error.message?.includes('Auth session missing') ||
          error.message?.includes('Session from session_id claim in JWT does not exist')) {
        return // Don't throw error for already expired/invalid sessions
      }
      throw error
    }

    // Temporarily bypass audit logging
    // if (user) {
    //   await logAuditEvent(
    //     user.id,
    //     'logout_success',
    //     { email: user.email },
    //     getUserIP(),
    //     navigator.userAgent
    //   )
    // }
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

// Password reset with rate limiting
export const resetPassword = async (email: string): Promise<any> => {
  // Validate email
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address')
  }

  // Check rate limiting
  const rateLimitCheck = await checkRateLimit(email, 'password_reset')
  if (!rateLimitCheck.allowed) {
    const resetTime = rateLimitCheck.resetTime
    const waitMinutes = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60)) : 10
    throw new Error(`Too many password reset attempts. Please try again in ${waitMinutes} minutes.`)
  }

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (error) {
      // Record failed attempt
      await recordRateLimitAttempt(email, 'password_reset')
      
      // Log audit event
      await logAuditEvent(
        null,
        'password_reset_failed',
        { email, error: error.message },
        getUserIP(),
        navigator.userAgent
      )
      
      throw error
    }

    // Log successful password reset request
    await logAuditEvent(
      null,
      'password_reset_requested',
      { email },
      getUserIP(),
      navigator.userAgent
    )

    return data
  } catch (error) {
    // Record failed attempt for any error
    await recordRateLimitAttempt(email, 'password_reset')
    throw error
  }
}

// Update password with validation
export const updatePassword = async (newPassword: string): Promise<any> => {
  // Validate password
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join('. '))
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      // Log audit event
      await logAuditEvent(
        null,
        'password_update_failed',
        { error: error.message },
        getUserIP(),
        navigator.userAgent
      )
      
      throw error
    }

    // Log successful password update
    await logAuditEvent(
      data.user?.id || null,
      'password_updated',
      { email: data.user?.email },
      getUserIP(),
      navigator.userAgent
    )

    return data
  } catch (error) {
    throw error
  }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Admin role checking functions
export const isAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const uid = userId || (await getCurrentUser())?.id
    if (!uid) return false

    const { data, error } = await supabase.rpc('is_admin', { user_uuid: uid })
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    return data || false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export const getAdminRole = async (userId?: string): Promise<string> => {
  try {
    const uid = userId || (await getCurrentUser())?.id
    if (!uid) return 'user'

    const { data, error } = await supabase.rpc('get_admin_role', { user_uuid: uid })
    if (error) {
      console.error('Error getting admin role:', error)
      return 'user'
    }
    return data || 'user'
  } catch (error) {
    console.error('Error getting admin role:', error)
    return 'user'
  }
}

// Check if user has specific admin permissions
export const hasAdminPermission = async (requiredRole: 'admin' | 'super_admin' | 'moderator', userId?: string): Promise<boolean> => {
  try {
    const userRole = await getAdminRole(userId)
    
    // Role hierarchy: super_admin > admin > moderator > user
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'moderator': 1,
      'user': 0
    }
    
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole]
    
    return userLevel >= requiredLevel
  } catch (error) {
    console.error('Error checking admin permission:', error)
    return false
  }
}

// Legacy function for backward compatibility
export const isAdminUser = async (maybeUser: any): Promise<boolean> => {
  if (!maybeUser) return false
  return await isAdmin(maybeUser.id)
}

export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user || null
    
    // Log auth state changes
    if (user && event === 'SIGNED_IN') {
      await logAuditEvent(
        user.id,
        'auth_state_changed',
        { event, email: user.email },
        getUserIP(),
        navigator.userAgent
      )
    }
    
    callback(user)
  })
}