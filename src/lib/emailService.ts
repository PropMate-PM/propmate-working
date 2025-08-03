// Email service utilities for PropMate
// This would integrate with a real email service in production

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

// Mock email service - in production, this would integrate with SendGrid, AWS SES, etc.
export class EmailService {
  private static instance: EmailService
  private emailHistory: EmailData[] = []

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // In production, this would make an API call to your email service
      console.log('Sending email:', emailData)
      
      // Store in history
      this.emailHistory.push({
        ...emailData,
        type: emailData.type
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const template = emailTemplates.welcome(userName)
    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'welcome'
    })
  }

  async sendStatusChangeEmail(
    userEmail: string, 
    userName: string, 
    status: string, 
    amount: number, 
    firmName: string
  ): Promise<boolean> {
    const template = emailTemplates.statusChange(userName, status, amount, firmName)
    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'status_change'
    })
  }

  async sendConfirmationEmail(
    userEmail: string, 
    userName: string, 
    firmName: string, 
    amount: number
  ): Promise<boolean> {
    const template = emailTemplates.confirmation(userName, firmName, amount)
    return this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      type: 'status_change'
    })
  }

  async sendCustomEmail(
    userEmail: string, 
    subject: string, 
    message: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${message.replace(/\n/g, '<br>')}</div>`,
      text: message,
      type: 'manual'
    })
  }

  getEmailHistory(): EmailData[] {
    return this.emailHistory
  }
}

export const emailService = EmailService.getInstance()