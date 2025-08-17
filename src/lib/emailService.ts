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
  subject: string
  html: string
  text: string
  type: 'welcome' | 'status_change' | 'manual' | 'broadcast' | 'paymentSent' | 'statusChange'
  userId?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

// Email configuration
const EMAIL_CONFIG = {
  FROM_EMAIL: 'noreply@propmate.com',
  FROM_NAME: 'PropMate',
  SUPPORT_EMAIL: 'support@propmate.com',
  ADMIN_EMAIL: 'admin@propmate.site'
}

// Email templates
export const emailTemplates = {
  welcome: (userName: string): EmailTemplate => ({
    subject: 'Welcome to PropMate – Your Cashback Trading Partner',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A9F;">Welcome to PropMate – Your Cashback Trading Partner</h1>
        <p>Hi ${userName},</p>
        <p>Welcome to PropMate – the premier platform for prop firm cashback rewards.<br>
        We're excited to have you onboard!</p>
        
        <h2>Here's how to get started in 3 quick steps:</h2>
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
    text: `Hi ${userName}, Welcome to PropMate – the premier platform for prop firm cashback rewards. We're excited to have you onboard! Here's how to get started: 1) Browse Firms: Explore our curated list of leading prop trading firms. 2) Use Our Links: Purchase through our referral links to qualify for cashback. 3) Submit Proof: Upload your purchase receipt to claim your cashback. Tip: Always use our referral links to ensure your cashback is tracked correctly. We look forward to helping you maximize your trading benefits. Log in to your dashboard anytime to explore firms and manage requests. Happy trading, The PropMate Team`
  }),

  statusChange: (userName: string, status: string, amount: number, firmName: string): EmailTemplate => ({
    subject: `Cashback Request ${status.charAt(0).toUpperCase() + status.slice(1)} - PropMate`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A9F;">Cashback Request Update</h1>
        <p>Hi ${userName},</p>
        <p>Your cashback request for <strong>${firmName}</strong> has been <strong>${status}</strong>.</p>
        ${status === 'paid' ? `
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #0369a1; margin-top: 0;">Payment Processed!</h2>
            <p>Amount: <strong>$${amount.toFixed(2)}</strong></p>
            <p>Your cashback has been sent to your crypto wallet. Please allow up to 24 hours for the transaction to appear in your wallet.</p>
          </div>
        ` : status === 'rejected' ? `
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #dc2626; margin-top: 0;">Request Rejected</h2>
            <p>Unfortunately, we couldn't process your cashback request. This may be due to:</p>
            <ul>
              <li>Invalid proof of purchase</li>
              <li>Purchase not made through our affiliate link</li>
              <li>Duplicate submission</li>
            </ul>
            <p>Please contact support if you believe this was an error.</p>
          </div>
        ` : ''}
        <p>You can view all your requests in your dashboard.</p>
        <p>Best regards,<br>The PropMate Team</p>
      </div>
    `,
            text: `Hi ${userName}, Your cashback request for ${firmName} has been ${status}. ${status === 'paid' ? `Amount: $${amount.toFixed(2)}. Your cashback has been sent to your crypto wallet.` : status === 'rejected' ? 'Unfortunately, we couldn\'t process your cashback request. Please contact support if you believe this was an error.' : ''} You can view all your requests in your dashboard. Best regards, The PropMate Team`
  }),

  confirmation: (userName: string, firmName: string, amount: number): EmailTemplate => ({
    subject: 'Cashback Request Received – PropMate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A9F;">Cashback Request Received – PropMate</h1>
        <p>Hi ${userName},</p>
        <p>We've received your cashback request for <strong>${firmName}</strong>.<br>
        Our team is reviewing your submission and will update you shortly.</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Request Details:</h2>
          <ul>
            <li><strong>Prop Firm:</strong> ${firmName}</li>
            <li><strong>Purchase Amount:</strong> $${amount.toFixed(2)}</li>
            <li><strong>Estimated Cashback:</strong> $${(amount * 0.125).toFixed(2)}</li>
            <li><strong>Status:</strong> Under Review</li>
          </ul>
        </div>
        
        <p>We typically process requests within 5–7 business days. You'll be notified once your cashback has been confirmed and sent.</p>
        
        <p>Thank you for choosing PropMate,<br>
        The PropMate Team</p>
      </div>
    `,
    text: `Hi ${userName}, We've received your cashback request for ${firmName}. Our team is reviewing your submission and will update you shortly. Request Details: Prop Firm: ${firmName}, Purchase Amount: $${amount.toFixed(2)}, Estimated Cashback: $${(amount * 0.125).toFixed(2)}, Status: Under Review. We typically process requests within 5–7 business days. You'll be notified once your cashback has been confirmed and sent. Thank you for choosing PropMate, The PropMate Team`
  })
}

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

/**
 * Generate enhanced email template with consistent branding
 */
const generateEmailTemplate = (
  title: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  footerText?: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #8B5A9F 0%, #6B46C1 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .content { 
          padding: 30px 20px; 
        }
        .footer { 
          background: #f8f9fa; 
          padding: 20px; 
          text-align: center; 
          font-size: 14px; 
          color: #6c757d; 
          border-top: 1px solid #e9ecef;
        }
        .cta-button { 
          display: inline-block; 
          background: #28a745; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold; 
          margin: 20px 0; 
        }
        .highlight { 
          background: #e3f2fd; 
          padding: 15px; 
          border-left: 4px solid #2196f3; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .warning { 
          background: #fff3cd; 
          padding: 15px; 
          border-left: 4px solid #ffc107; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .success { 
          background: #d4edda; 
          padding: 15px; 
          border-left: 4px solid #28a745; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .error { 
          background: #f8d7da; 
          padding: 15px; 
          border-left: 4px solid #dc3545; 
          margin: 20px 0; 
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">PropMate</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Cashback Trading Partner</p>
        </div>
        <div class="content">
          ${content}
          ${ctaText && ctaUrl ? `<div style="text-align: center;"><a href="${ctaUrl}" class="cta-button">${ctaText}</a></div>` : ''}
        </div>
        <div class="footer">
          <p>${footerText || 'Thank you for choosing PropMate for your trading cashback needs.'}</p>
          <p>
            <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: #6c757d;">Contact Support</a> | 
            <a href="#" style="color: #6c757d;">Unsubscribe</a>
          </p>
          <p style="font-size: 12px; margin-top: 15px;">
            © ${new Date().getFullYear()} PropMate. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Enhanced email service - in production, this would integrate with SendGrid, AWS SES, etc.
export class EmailService {
  private static instance: EmailService
  private emailHistory: EmailData[] = []
  private emailApiUrl: string | undefined = import.meta.env.VITE_EMAIL_API_URL || `${location.origin}/functions/v1/send-email`

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
        
        // Determine template type and data based on emailData.type
        let templateType = emailData.type
        let templateData: any = {}
        
        if (emailData.type === 'welcome') {
          templateType = 'welcome'
          templateData = { name: emailData.to.split('@')[0] } // Extract name from email
        } else if (emailData.type === 'status_change') {
          // Extract data from the subject or text content
          if (emailData.subject.includes('Payment Sent')) {
            templateType = 'paymentSent'
            // Parse payment details from text content
            const text = emailData.text
            const amountMatch = text.match(/\$(\d+\.?\d*)/)
            const amount = amountMatch ? parseFloat(amountMatch[1]) : 0
            templateData = {
              userName: emailData.to.split('@')[0],
              amount: amount,
              firmName: 'Cashback',
              walletAddress: 'User Wallet',
              transactionHash: 'Transaction Hash'
            }
          } else {
            templateType = 'statusChange'
            templateData = {
              userName: emailData.to.split('@')[0],
              status: 'approved',
              amount: 0,
              firmName: 'Prop Firm'
            }
          }
        }
        
        const resp = await fetch(this.emailApiUrl, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            to: emailData.to,
            type: templateType,
            data: templateData
          })
        })
        const json = await resp.json().catch(() => ({}))
        if (!resp.ok || json.success === false) {
          throw new Error(json.error || `Email API error: ${resp.status}`)
        }
      } else {
        // Fallback mock in development when no backend email API is available
        console.log('📧 [Mock Email] No VITE_EMAIL_API_URL set. Logging email instead:', {
          to: emailData.to,
          subject: emailData.subject,
          type: emailData.type
        })
      }
      
      // Log the communication to database
      await logEmailCommunication(
        emailData.to,
        emailData.userId || null,
        emailData.subject,
        emailData.text.substring(0, 500), // First 500 chars for summary
        emailData.type === 'paymentSent' || emailData.type === 'statusChange' ? 'status_change' : emailData.type,
        false
      )
      
      // Log audit event
      await logAuditEvent(
        emailData.userId || null,
        'email_sent',
        { 
          to: emailData.to, 
          subject: emailData.subject, 
          type: emailData.type === 'paymentSent' || emailData.type === 'statusChange' ? 'status_change' : emailData.type,
          html_length: emailData.html.length,
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
    const template = emailTemplates.welcome(userName)
    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'welcome',
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
    const template = emailTemplates.statusChange(userName, status, amount, firmName)
    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'status_change',
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
    const template = emailTemplates.confirmation(userName, firmName, amount)
    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'status_change',
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
    const content = `
      <h2>Welcome to PropMate – Your Cashback Trading Partner</h2>
      <p>Hi ${userName},</p>
      <p>Welcome to PropMate – the premier platform for prop firm cashback rewards.<br>
      We're excited to have you onboard!</p>
      
      <div class="highlight">
        <h3>Here's how to get started in 3 quick steps:</h3>
        <ol>
          <li><strong>Browse Firms:</strong> Explore our curated list of leading prop trading firms.</li>
          <li><strong>Use Our Links:</strong> Purchase through our referral links to qualify for cashback.</li>
          <li><strong>Submit Proof:</strong> Upload your purchase receipt to claim your cashback.</li>
        </ol>
      </div>
      
      <p>💡 <strong>Tip:</strong> Always use our referral links to ensure your cashback is tracked correctly.</p>
      
      <p>We look forward to helping you maximize your trading benefits.<br>
      Log in to your dashboard anytime to explore firms and manage requests.</p>
      
      <p>Happy trading,<br>
      The PropMate Team</p>
    `
    
    const html = generateEmailTemplate('Welcome to PropMate', content, 'Access Dashboard', '#')
    const text = `Hi ${userName}, Welcome to PropMate – the premier platform for prop firm cashback rewards. We're excited to have you onboard! Here's how to get started: 1) Browse Firms: Explore our curated list of leading prop trading firms. 2) Use Our Links: Purchase through our referral links to qualify for cashback. 3) Submit Proof: Upload your purchase receipt to claim your cashback. Tip: Always use our referral links to ensure your cashback is tracked correctly. We look forward to helping you maximize your trading benefits. Log in to your dashboard anytime to explore firms and manage requests. Happy trading, The PropMate Team`
    
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to PropMate – Your Cashback Trading Partner',
      html,
      text,
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
    const content = `
      <h2>🎉 Cashback Request Approved!</h2>
      <p>Great news! Your cashback request has been approved and is ready for payment.</p>
      
      <div class="success">
        <h3>💰 Approved Cashback:</h3>
        <ul>
          <li><strong>Prop Firm:</strong> ${requestDetails.firmName}</li>
          <li><strong>Purchase Amount:</strong> $${requestDetails.purchaseAmount.toFixed(2)}</li>
          <li><strong>Cashback Amount:</strong> $${requestDetails.cashbackAmount.toFixed(2)}</li>
          <li><strong>Wallet Address:</strong> ${requestDetails.walletAddress.substring(0, 10)}...${requestDetails.walletAddress.substring(requestDetails.walletAddress.length - 10)}</li>
        </ul>
      </div>
      
      <h3>💸 Payment Process:</h3>
      <p>Your cashback will be processed within 1-2 business days. You'll receive another email with the transaction hash once the payment is sent.</p>
      
      <div class="highlight">
        <p><strong>Payment Method:</strong> Cryptocurrency transfer to your provided wallet address</p>
      </div>
      
      <p>Thank you for choosing PropMate for your cashback needs!</p>
    `
    
    const html = generateEmailTemplate('Cashback Approved', content, 'View Dashboard', '#')
    const text = `Cashback approved! ${requestDetails.firmName} - $${requestDetails.cashbackAmount.toFixed(2)} will be sent to your wallet within 1-2 business days.`
    
    return this.sendEmail({
      to: userEmail,
      subject: `Cashback Approved - $${requestDetails.cashbackAmount.toFixed(2)} from ${requestDetails.firmName}`,
      html,
      text,
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
    const content = `
      <h2>Cashback Payment Sent – $${paymentDetails.amount.toFixed(2)}</h2>
      <p>Hi ${paymentDetails.userName},</p>
      <p>Your cashback payment has been successfully processed and sent to your wallet.</p>
      
      <div class="success">
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Amount Sent:</strong> $${paymentDetails.amount.toFixed(2)}</li>
          <li><strong>Prop Firm:</strong> ${paymentDetails.firmName}</li>
          <li><strong>Wallet Address:</strong> ${paymentDetails.walletAddress}</li>
          <li><strong>Transaction Hash:</strong> <code style="word-break: break-all; background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">${paymentDetails.transactionHash}</code></li>
        </ul>
      </div>
      
      <p>🔎 <strong>Verify Transaction:</strong><br>
      You can verify this transaction on the blockchain using the transaction hash above. Depending on network congestion, it may take a few minutes to appear.</p>
      
      <p>📌 <strong>Keep this email as proof of payment for your records.</strong></p>
      
      <p>Thank you for using PropMate. We look forward to sending you more cashback rewards soon.</p>
      
      <p>Best regards,<br>
      The PropMate Team</p>
    `
    
    const html = generateEmailTemplate('Cashback Payment Sent', content, 'View Payment History', '#')
    const text = `Hi ${paymentDetails.userName}, Your cashback payment has been successfully processed and sent to your wallet. Amount Sent: $${paymentDetails.amount.toFixed(2)}, Prop Firm: ${paymentDetails.firmName}, Wallet Address: ${paymentDetails.walletAddress}, Transaction Hash: ${paymentDetails.transactionHash}. Verify Transaction: You can verify this transaction on the blockchain using the transaction hash above. Keep this email as proof of payment for your records. Thank you for using PropMate. We look forward to sending you more cashback rewards soon. Best regards, The PropMate Team`
    
    return this.sendEmail({
      to: userEmail,
      subject: `Cashback Payment Sent – $${paymentDetails.amount.toFixed(2)}`,
      html,
      text,
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
        const html = generateEmailTemplate('PropMate Update', personalizedContent, ctaText, ctaUrl)
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