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
  type: 'welcome' | 'status_change' | 'manual' | 'broadcast'
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
  ADMIN_EMAIL: 'admin@propmate.com'
}

// Email templates
export const emailTemplates = {
  welcome: (userName: string): EmailTemplate => ({
    subject: 'Welcome to PropMate!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A9F;">Welcome to PropMate, ${userName}!</h1>
        <p>Thank you for joining our community of smart traders who save money on prop firm challenges.</p>
        <h2>What's Next?</h2>
        <ul>
          <li>Browse our featured prop firms</li>
          <li>Purchase challenges through our affiliate links</li>
          <li>Submit your cashback requests</li>
          <li>Get paid in crypto!</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy trading!</p>
        <p>The PropMate Team</p>
      </div>
    `,
    text: `Welcome to PropMate, ${userName}! Thank you for joining our community of smart traders who save money on prop firm challenges. Browse our featured prop firms, purchase challenges through our affiliate links, submit your cashback requests, and get paid in crypto! If you have any questions, feel free to reach out to our support team. Happy trading! The PropMate Team`
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
    subject: 'Cashback Request Received - PropMate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5A9F;">Cashback Request Received</h1>
        <p>Hi ${userName},</p>
        <p>We've received your cashback request for <strong>${firmName}</strong>.</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Request Details</h2>
          <p><strong>Prop Firm:</strong> ${firmName}</p>
          <p><strong>Purchase Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Status:</strong> Under Review</p>
        </div>
        <p>We'll review your request and process it within 5-7 business days. You'll receive an email notification once the status changes.</p>
        <p>Thank you for using PropMate!</p>
        <p>The PropMate Team</p>
      </div>
    `,
            text: `Hi ${userName}, We've received your cashback request for ${firmName}. Purchase Amount: $${amount.toFixed(2)}. Status: Under Review. We'll review your request and process it within 5-7 business days. You'll receive an email notification once the status changes. Thank you for using PropMate! The PropMate Team`
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
  private emailApiUrl: string | undefined = import.meta.env.VITE_EMAIL_API_URL

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
        const resp = await fetch(this.emailApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            type: emailData.type
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
        emailData.type,
        false
      )
      
      // Log audit event
      await logAuditEvent(
        emailData.userId || null,
        'email_sent',
        null,
        null,
        null,
        { 
          to: emailData.to, 
          subject: emailData.subject, 
          type: emailData.type,
          html_length: emailData.html.length 
        },
        getUserIP(),
        typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
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
      <h2>Welcome ${userName}! 🎉</h2>
      <p>Thank you for joining PropMate, the premier platform for prop firm cashback rewards.</p>
      
      <div class="highlight">
        <h3>🚀 Get Started in 3 Easy Steps:</h3>
        <ol>
          <li><strong>Browse Prop Firms:</strong> Explore our curated list of top prop trading firms</li>
          <li><strong>Use Our Links:</strong> Purchase through our referral links to qualify for cashback</li>
          <li><strong>Submit Requests:</strong> Upload your proof of purchase and claim your cashback</li>
        </ol>
      </div>
      
      <h3>💰 How It Works:</h3>
      <p>We partner with prop firms to offer you the best discounts available, plus up to 50% cashback on our affiliate commissions. It's a win-win!</p>
      
      <div class="success">
        <p><strong>Pro Tip:</strong> Always use our referral links to ensure your cashback is tracked properly.</p>
      </div>
      
      <p>Ready to start earning? Log in to your dashboard and explore our prop firm directory.</p>
      <p>Happy trading!<br><strong>The PropMate Team</strong></p>
    `
    
    const html = generateEmailTemplate('Welcome to PropMate', content, 'View Prop Firms', '#')
    const text = `Welcome ${userName}! Thank you for joining PropMate. Get started: 1) Browse prop firms, 2) Use our links, 3) Submit requests. We offer up to 50% cashback on affiliate commissions. Always use our referral links for proper tracking. Happy trading! The PropMate Team`
    
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to PropMate - Start Earning Cashback Today!',
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
      <h2>🚀 Payment Sent Successfully!</h2>
      <p>Your cashback payment has been sent to your wallet. Here are the transaction details:</p>
      
      <div class="success">
        <h3>💰 Payment Details:</h3>
        <ul>
          <li><strong>Amount:</strong> $${paymentDetails.amount.toFixed(2)}</li>
          <li><strong>Prop Firm:</strong> ${paymentDetails.firmName}</li>
          <li><strong>Wallet Address:</strong> ${paymentDetails.walletAddress}</li>
          <li><strong>Transaction Hash:</strong> <code style="word-break: break-all; background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">${paymentDetails.transactionHash}</code></li>
        </ul>
      </div>
      
      <h3>🔍 Verify Your Transaction:</h3>
      <p>You can verify this transaction on the blockchain using the transaction hash above. Depending on network congestion, it may take a few minutes to appear in your wallet.</p>
      
      <div class="highlight">
        <p><strong>Keep This Email:</strong> Save this email as proof of payment for your records.</p>
      </div>
      
      <p>Thank you for using PropMate! We hope to process more cashback rewards for you soon.</p>
    `
    
    const html = generateEmailTemplate('Payment Sent', content, 'View Dashboard', '#')
    const text = `Payment sent! $${paymentDetails.amount.toFixed(2)} from ${paymentDetails.firmName} sent to ${paymentDetails.walletAddress}. Transaction: ${paymentDetails.transactionHash}`
    
    return this.sendEmail({
      to: userEmail,
      subject: `Payment Sent - $${paymentDetails.amount.toFixed(2)} Cashback`,
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