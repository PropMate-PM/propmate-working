// Email service utilities for PropMate
// This would integrate with a real email service in production

import { supabase } from './supabase'
import { logAuditEvent, getUserIP } from './auth'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailData {
  to: string
  subject?: string
  html?: string
  text?: string
  type: 'welcome' | 'status_change' | 'manual' | 'broadcast' | 'paymentSent' | 'statusChange' | 'cashbackRequest' | 'payoutProcessing'
  userId?: string
  // Optional direct template payload for Netlify
  category?: 'noreply' | 'legal' | 'support' | 'admin' | 'payments'
  data?: Record<string, unknown>
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}



// All email templates now handled by Netlify Functions

/**
 * Log email communication to database
 */
const logEmailCommunication = async (
  userEmail: string,
  userId: string | null,
  subject: string,
  message: string,
  communicationType: 'manual' | 'status_change' | 'welcome' | 'broadcast' = 'manual',
  sentByAdmin: boolean = false
): Promise<void> => {
  try {
    await supabase
      .from('user_communications')
      .insert({
        user_id: userId,
        user_email: userEmail,
        subject,
        message,
        communication_type: communicationType,
        sent_by_admin: sentByAdmin,
        sent_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging email communication:', error)
  }
}



// Enhanced email service - in production, this would integrate with SendGrid, AWS SES, etc.
export class EmailService {
  private static instance: EmailService
  private emailHistory: EmailData[] = []
  private emailApiUrl: string | undefined = import.meta.env.VITE_EMAIL_API_URL || '/.netlify/functions/send-email'

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(emailData: EmailData): Promise<EmailSendResult> {
    try {
      // Prefer calling a backend email API if configured (e.g., Netlify Function)
      if (this.emailApiUrl) {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        if (anonKey) {
          authHeaders['Authorization'] = `Bearer ${anonKey}`
          authHeaders['apikey'] = anonKey
        }
        
        // Prefer explicit template payload if provided
        if (emailData.category && emailData.data) {
          const payload = {
            to: emailData.to,
            category: emailData.category,
            type: emailData.type,
            data: emailData.data
          }
          console.log('🚀 [DEBUG] Sending structured email data to Netlify:', payload)
          const resp = await fetch(this.emailApiUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload)
          })
          const json = await resp.json().catch(() => ({}))
          if (!resp.ok || json.success === false) {
            throw new Error(json.error || `Email API error: ${resp.status}`)
          }
        } else {
          // Determine template type/category and data based on emailData.type
          let templateType = emailData.type
          let templateCategory: 'noreply' | 'legal' | 'support' | 'admin' | 'payments' = 'noreply'
          let templateData: any = {}
        
          if (emailData.type === 'welcome') {
            templateType = 'welcome'
            templateData = { name: emailData.to.split('@')[0] } // Extract name from email
          } else if (emailData.type === 'cashbackRequest') {
            templateCategory = 'payments'
            templateType = 'cashbackRequest'
            // Extract data from the provided plain-text body
            const text = emailData.text || ''
            const nameMatch = text.match(/Hi\s+([^,]+),/)
            const firmMatch = text.match(/Prop Firm:\s*([^,\n]+)/)
            const amountMatch = text.match(/Purchase Amount:\s*\$(\d+\.?\d*)/)
            const userName = nameMatch ? nameMatch[1].trim() : emailData.to.split('@')[0]
            const firmName = firmMatch ? firmMatch[1].trim() : 'Prop Firm'
            const purchaseAmount = amountMatch ? parseFloat(amountMatch[1]) : 0
            const cashbackAmount = Number.isFinite(purchaseAmount) ? +(purchaseAmount * 0.125).toFixed(2) : 0
            templateData = {
              name: userName,
              propFirmName: firmName,
              purchaseAmount,
              cashbackAmount
            }
          } else if (emailData.type === 'status_change') {
            templateCategory = 'payments'
            // Extract data from the subject or text content
            if (emailData.subject?.includes('Payment Sent')) {
              templateType = 'payoutProcessing'
              // Parse payment details from text content
              const text = emailData.text || ''
              const nameMatch = text.match(/Hi\s+([^,]+),/)
              const amountMatch = text.match(/Amount Sent:\s*\$(\d+\.?\d*)/)
              const walletMatch = text.match(/Wallet Address:\s*([^\n]+)/)
              const txMatch = text.match(/Transaction Hash:\s*([^\n]+)/)
              const userName = nameMatch ? nameMatch[1].trim() : emailData.to.split('@')[0]
              const cashbackAmount = amountMatch ? parseFloat(amountMatch[1]) : 0
              const walletAddress = walletMatch ? walletMatch[1].trim() : 'User Wallet'
              const transactionHash = txMatch ? txMatch[1].trim() : 'Transaction Hash'
              templateData = {
                name: userName,
                cashbackAmount,
                purchaseAmount: cashbackAmount,
                propFirmName: 'Cashback',
                walletAddress,
                transactionHash
              }
            } else {
              // Default to a generic status-change style via payments category if needed
              templateType = 'cashbackRequest'
              templateData = {
                name: emailData.to.split('@')[0],
                propFirmName: 'Prop Firm',
                purchaseAmount: 0,
                cashbackAmount: 0
              }
            }
          }
          
          const resp = await fetch(this.emailApiUrl, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              to: emailData.to,
              category: templateCategory,
              type: templateType,
              data: templateData
            })
          })
          const json = await resp.json().catch(() => ({}))
          if (!resp.ok || json.success === false) {
            throw new Error(json.error || `Email API error: ${resp.status}`)
          }
        }
      } else {
        // Fallback mock in development when no backend email API is available
        console.log('📧 [Mock Email] No VITE_EMAIL_API_URL set. Logging email instead:', {
          to: emailData.to,
          subject: emailData.subject || '(no-subject)',
          type: emailData.type
        })
      }
      
      // Log the communication to database
      await logEmailCommunication(
        emailData.to,
        emailData.userId || null,
        emailData.subject || '(no-subject)',
        (emailData.text || '').substring(0, 500), // First 500 chars for summary
        emailData.type === 'paymentSent' || emailData.type === 'statusChange' || emailData.type === 'cashbackRequest' || emailData.type === 'payoutProcessing' ? 'status_change' : emailData.type,
        false
      )
      
      // Log audit event
      await logAuditEvent(
        emailData.userId || null,
        'email_sent',
        { 
          to: emailData.to, 
          subject: emailData.subject || '(no-subject)', 
          type: emailData.type === 'paymentSent' || emailData.type === 'statusChange' || emailData.type === 'cashbackRequest' || emailData.type === 'payoutProcessing' ? 'status_change' : emailData.type,
          html_length: emailData.html?.length ?? 0,
          ip: getUserIP(),
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
        }
      )
      
      // Store in history
      this.emailHistory.push({
        ...emailData,
        type: emailData.type
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return { success: true, messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, userId?: string): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      type: 'welcome',
      category: 'noreply',
      data: {
        name: userName
      },
      userId
    })
  }

  async sendStatusChangeEmail(
    userEmail: string, 
    userName: string, 
    status: string, 
    amount: number, 
    firmName: string,
    userId?: string
  ): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      type: 'statusChange',
      category: 'payments',
      data: {
        name: userName,
        status: status,
        cashbackAmount: amount,
        propFirmName: firmName
      },
      userId
    })
  }

  async sendConfirmationEmail(
    userEmail: string, 
    userName: string, 
    firmName: string, 
    amount: number,
    userId?: string
  ): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      type: 'cashbackRequest',
      category: 'payments',
      data: {
        name: userName,
        propFirmName: firmName,
        purchaseAmount: Number(amount.toFixed(2)),
        cashbackAmount: Number((amount * 0.125).toFixed(2))
      },
      userId
    })
  }

  async sendCustomEmail(
    userEmail: string, 
    subject: string, 
    message: string,
    userId?: string
  ): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      subject,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${message.replace(/\n/g, '<br>')}</div>`,
      text: message,
      type: 'manual',
      userId
    })
  }

  // New enhanced email methods with better templates
  async sendEnhancedWelcomeEmail(userEmail: string, userName: string, userId?: string): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to PropMate – Your Cashback Trading Partner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #8B5A9F; margin-bottom: 20px;">Welcome to PropMate – Your Cashback Trading Partner</h2>
          <p>Hi ${userName},</p>
          <p>Welcome to PropMate – the premier platform for prop firm cashback rewards.<br>
          We're excited to have you onboard!</p>
          
          <h3>Here's how to get started in 3 quick steps:</h3>
          <ol>
            <li><strong>Browse Firms:</strong> Explore our curated list of leading prop trading firms.</li>
            <li><strong>Use Our Links:</strong> Purchase through our referral links to qualify for cashback.</li>
            <li><strong>Submit Proof:</strong> Upload your purchase receipt to claim your cashback.</li>
          </ol>
          
          <p>💡 <strong>Tip:</strong> Always use our referral links to ensure your cashback is tracked correctly.</p>
          
          <p>We look forward to helping you maximize your trading benefits.<br>
          Log in to your dashboard anytime to explore firms and manage requests.</p>
          
          <p>Happy trading,<br>
          The PropMate Team</p>
        </div>
      `,
      text: `Hi ${userName}, Welcome to PropMate – the premier platform for prop firm cashback rewards. We're excited to have you onboard! Here's how to get started: 1) Browse Firms: Explore our curated list of leading prop trading firms. 2) Use Our Links: Purchase through our referral links to qualify for cashback. 3) Submit Proof: Upload your purchase receipt to claim your cashback. Tip: Always use our referral links to ensure your cashback is tracked correctly. We look forward to helping you maximize your trading benefits. Log in to your dashboard anytime to explore firms and manage requests. Happy trading, The PropMate Team`,
      type: 'welcome',
      userId
    })
  }

  async sendRequestApprovedEmail(
    userEmail: string,
    requestDetails: {
      userName: string
      firmName: string
      purchaseAmount: number
      cashbackAmount: number
      requestId: string
      walletAddress: string
    },
    userId?: string
  ): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      subject: `Cashback Approved - $${requestDetails.cashbackAmount.toFixed(2)} from ${requestDetails.firmName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #8B5A9F; margin-bottom: 20px;">Cashback Request Approved!</h2>
      <p>Great news! Your cashback request has been approved and is ready for payment.</p>
      
          <h3>Approved Cashback:</h3>
        <ul>
          <li><strong>Prop Firm:</strong> ${requestDetails.firmName}</li>
          <li><strong>Purchase Amount:</strong> $${requestDetails.purchaseAmount.toFixed(2)}</li>
          <li><strong>Cashback Amount:</strong> $${requestDetails.cashbackAmount.toFixed(2)}</li>
          <li><strong>Wallet Address:</strong> ${requestDetails.walletAddress.substring(0, 10)}...${requestDetails.walletAddress.substring(requestDetails.walletAddress.length - 10)}</li>
        </ul>
      
          <h3>Payment Process:</h3>
      <p>Your cashback will be processed within 1-2 business days. You'll receive another email with the transaction hash once the payment is sent.</p>
      
        <p><strong>Payment Method:</strong> Cryptocurrency transfer to your provided wallet address</p>
      
      <p>Thank you for choosing PropMate for your cashback needs!</p>
        </div>
      `,
      text: `Cashback approved! ${requestDetails.firmName} - $${requestDetails.cashbackAmount.toFixed(2)} will be sent to your wallet within 1-2 business days.`,
      type: 'status_change',
      userId
    })
  }

  async sendPaymentSentEmail(
    userEmail: string,
    paymentDetails: {
      userName: string
      firmName: string
      amount: number
      walletAddress: string
      transactionHash: string
      requestId: string
    },
    userId?: string
  ): Promise<EmailSendResult> {
    return this.sendEmail({
      to: userEmail,
      subject: `Cashback Payment Sent – $${paymentDetails.amount.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #8B5A9F; margin-bottom: 20px;">Cashback Payment Sent – $${paymentDetails.amount.toFixed(2)}</h2>
          <p>Hi ${paymentDetails.userName},</p>
          <p>Your cashback payment has been successfully processed and sent to your wallet.</p>
          
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Amount Sent:</strong> $${paymentDetails.amount.toFixed(2)}</li>
          <li><strong>Prop Firm:</strong> ${paymentDetails.firmName}</li>
          <li><strong>Wallet Address:</strong> ${paymentDetails.walletAddress}</li>
            <li><strong>Transaction Hash:</strong> ${paymentDetails.transactionHash}</li>
        </ul>
          
          <p>🔎 <strong>Verify Transaction:</strong><br>
          You can verify this transaction on the blockchain using the transaction hash above. Depending on network congestion, it may take a few minutes to appear.</p>
          
          <p>📌 <strong>Keep this email as proof of payment for your records.</strong></p>
          
          <p>Thank you for using PropMate. We look forward to sending you more cashback rewards soon.</p>
          
          <p>Best regards,<br>
          The PropMate Team</p>
        </div>
      `,
      text: `Hi ${paymentDetails.userName}, Your cashback payment has been successfully processed and sent to your wallet. Amount Sent: $${paymentDetails.amount.toFixed(2)}, Prop Firm: ${paymentDetails.firmName}, Wallet Address: ${paymentDetails.walletAddress}, Transaction Hash: ${paymentDetails.transactionHash}. Verify Transaction: You can verify this transaction on the blockchain using the transaction hash above. Keep this email as proof of payment for your records. Thank you for using PropMate. We look forward to sending you more cashback rewards soon. Best regards, The PropMate Team`,
      type: 'status_change',
      userId
    })
  }

  async sendBulkEmail(
    recipients: Array<{ email: string; userId?: string; name?: string }>,
    subject: string,
    content: string,
    ctaText?: string,
    ctaUrl?: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] }
    
    for (const recipient of recipients) {
      try {
        const personalizedContent = content.replace(/\{name\}/g, recipient.name || recipient.email.split('@')[0])
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #8B5A9F; margin-bottom: 20px;">PropMate Update</h2>
            ${personalizedContent}
            ${ctaText && ctaUrl ? `<p style="text-align: center; margin: 20px 0;"><a href="${ctaUrl}" style="background: #8B5A9F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${ctaText}</a></p>` : ''}
            <p>Best regards,<br>The PropMate Team</p>
          </div>
        `
        const text = personalizedContent.replace(/<[^>]*>/g, '')
        
        const result = await this.sendEmail({
          to: recipient.email,
          subject,
          html,
          text,
          type: 'broadcast',
          userId: recipient.userId
        })
        
        if (result.success) {
          results.sent++
        } else {
          results.failed++
          results.errors.push(`${recipient.email}: ${result.error}`)
        }
        
        // Add small delay to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        results.failed++
        results.errors.push(`${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return results
  }

  getEmailHistory(): EmailData[] {
    return this.emailHistory
  }
}

export const emailService = EmailService.getInstance()