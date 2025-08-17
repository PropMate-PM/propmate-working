// Simple frontend wrapper to call Netlify function with categories/templates

export type EmailCategory = 'legal' | 'noreply' | 'support' | 'admin' | 'payments'

export interface SendEmailRequest {
  to: string | string[]
  type?: string
  data?: Record<string, unknown>
  subject?: string
  html?: string
  text?: string
}

export interface SendEmailResponse {
  success: boolean
  messageId?: string | null
  error?: string
}

const DEFAULT_ENDPOINT = import.meta.env.VITE_EMAIL_API_URL || '/.netlify/functions/send-email'

export async function sendEmail(req: SendEmailRequest, endpoint: string = DEFAULT_ENDPOINT): Promise<SendEmailResponse> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`)
    }
    return json as SendEmailResponse
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Convenience helpers
export const Email = {
  welcome: (to: string, name?: string) => sendEmail({ to, type: 'welcome', data: { name } }),
  verifyEmail: (to: string, name: string | undefined, code: string, verifyUrl?: string) =>
    sendEmail({ to, type: 'verifyEmail', data: { name, code, verifyUrl } }),
  resetPassword: (to: string, name: string | undefined, resetUrl?: string) =>
    sendEmail({ to, type: 'resetPassword', data: { name, resetUrl } }),
  accountActivated: (to: string, name?: string) =>
    sendEmail({ to, type: 'accountActivated', data: { name } }),

  legalTermsUpdate: (to: string, version: string, effectiveDate: string) =>
    sendEmail({ to, type: 'termsUpdate', data: { version, effectiveDate } }),
  legalPrivacyUpdate: (to: string, version: string, effectiveDate: string) =>
    sendEmail({ to, type: 'privacyUpdate', data: { version, effectiveDate } }),
  legalCompliance: (to: string, summary: string) =>
    sendEmail({ to, type: 'complianceNotice', data: { summary } }),

  supportReply: (to: string, ticketId: string, message: string) =>
    sendEmail({ to, type: 'supportReply', data: { ticketId, message } }),
  accountHelp: (to: string, message: string) =>
    sendEmail({ to, type: 'accountHelp', data: { message } }),

  adminNewUser: (to: string, userEmail: string, count: number) =>
    sendEmail({ to, type: 'newUser', data: { userEmail, count } }),
  adminAlert: (to: string, level: 'info' | 'warn' | 'error', message: string) =>
    sendEmail({ to, type: 'systemAlert', data: { level, message } }),
  adminStats: (to: string, period: string, stats: Record<string, number>) =>
    sendEmail({ to, type: 'statsSummary', data: { period, stats } }),

  paymentCashback: (to: string, amount: number, firm: string) =>
    sendEmail({ to, type: 'cashbackEarned', data: { amount, firm } }),
  paymentProcessing: (to: string, amount: number, method: string) =>
    sendEmail({ to, type: 'statusChange', data: { status: 'paid', amount, firmName: 'Cashback' } }),
  paymentMethodUpdated: (to: string, method: string) =>
    sendEmail({ to, type: 'paymentMethodUpdate', data: { method } }),
  monthlySummary: (to: string, month: string, totals: { cashback: number; payouts: number }) =>
    sendEmail({ to, type: 'monthlySummary', data: { month, totals } })
}


