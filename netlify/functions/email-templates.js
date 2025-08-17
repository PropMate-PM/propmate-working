import { APP_NAME, DOMAIN } from './email-config.js'

// Utility: base layout
function baseTemplate({ title, content, unsubscribeUrl, footerLinks = [] }) {
  const linksHtml = footerLinks.map(l => `<a href="${l.href}" style="color:#6b7280;text-decoration:underline;">${l.label}</a>`).join(' | ')
  return `<!DOCTYPE html><html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title>
  <style>
    body{margin:0;background:#f3f4f6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,sans-serif;color:#111827}
    .container{max-width:640px;margin:0 auto;padding:24px}
    .card{background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden}
    .header{background:linear-gradient(135deg,#0b3b70,#0c6b58);color:#fff;padding:24px}
    .content{padding:24px}
    .footer{padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px}
    .btn{display:inline-block;background:#0c6b58;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600}
    .muted{color:#6b7280}
  </style></head><body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div style="font-size:22px;font-weight:700;">${APP_NAME}</div>
        <div style="opacity:.9;margin-top:4px">Your Cashback Trading Partner</div>
      </div>
      <div class="content">${content}</div>
      <div class="footer">
        <div>${linksHtml}</div>
        <div style="margin-top:8px">If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color:#6b7280;">unsubscribe</a>.</div>
        <div style="margin-top:8px">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</div>
      </div>
    </div>
  </div>
  </body></html>`
}

function textify(html) {
  return html
    // drop head (styles, meta) to avoid CSS in text version
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function unsubscribeUrlFor(email) {
  const base = process.env.PUBLIC_APP_URL || `https://${DOMAIN}`
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}`
}

// Templates by category and type
const templates = {
  // LEGAL
  legal: {
    termsUpdate: ({ to, version, effectiveDate }) => {
      const content = `
        <h2>Terms of Service Update</h2>
        <p>We have updated our Terms of Service to version <strong>${version}</strong>, effective <strong>${effectiveDate}</strong>.</p>
        <p>Please review the updated terms at your earliest convenience.</p>
        <p><a class="btn" href="https://${DOMAIN}/legal/terms">Read Updated Terms</a></p>
      `
      const html = baseTemplate({ title: 'Terms Update', content, unsubscribeUrl: unsubscribeUrlFor(to), footerLinks: [ { href: `https://${DOMAIN}/privacy`, label: 'Privacy' } ] })
      return { subject: `${APP_NAME} Terms Update (v${version})`, html, text: textify(html) }
    },
    privacyUpdate: ({ to, version, effectiveDate }) => {
      const content = `
        <h2>Privacy Policy Update</h2>
        <p>Our Privacy Policy has been updated to version <strong>${version}</strong>, effective <strong>${effectiveDate}</strong>.</p>
        <p>We encourage you to review the changes to understand how we handle your data.</p>
        <p><a class="btn" href="https://${DOMAIN}/legal/privacy">Read Privacy Policy</a></p>
      `
      const html = baseTemplate({ title: 'Privacy Update', content, unsubscribeUrl: unsubscribeUrlFor(to), footerLinks: [ { href: `https://${DOMAIN}/terms`, label: 'Terms' } ] })
      return { subject: `${APP_NAME} Privacy Policy Update (v${version})`, html, text: textify(html) }
    },
    complianceNotice: ({ to, summary }) => {
      const content = `
        <h2>Legal Compliance Notice</h2>
        <p>${summary}</p>
        <p class="muted">This message is for legal compliance. No action is required unless stated.</p>
      `
      const html = baseTemplate({ title: 'Compliance Notice', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Legal Compliance Notice`, html, text: textify(html) }
    }
  },

  // NOREPLY (transactional)
  noreply: {
    welcome: ({ to, name }) => {
      const html = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px; color: #111;">
  <p><strong>Welcome to PropMate – Your Cashback Trading Partner</strong></p>
  <p>Hi ${name || 'Trader'},</p>
  <p>Welcome to PropMate – the premier platform for prop firm cashback rewards. We're excited to have you onboard!</p>
  <p>Here's how to get started in 3 quick steps:</p>
  <ol>
    <li>Browse Firms: Explore our curated list of leading prop trading firms.</li>
    <li>Use Our Links: Purchase through our referral links to qualify for cashback.</li>
    <li>Submit Proof: Upload your purchase receipt to claim your cashback.</li>
  </ol>
  <p>Tip: Always use our referral links to ensure your cashback is tracked correctly.</p>
  <p>We look forward to helping you maximize your trading benefits. Log in to your dashboard anytime to explore firms and manage requests.</p>
  <p>Happy trading,<br/>The PropMate Team</p>
 </div>`
      return { subject: `Welcome to PropMate – Your Cashback Trading Partner`, html, text: textify(html) }
    },
    verifyEmail: ({ to, name, code, verifyUrl }) => {
      const link = verifyUrl || `https://${DOMAIN}/verify?code=${encodeURIComponent(code||'')}&email=${encodeURIComponent(to)}`
      const content = `
        <h2>Verify your email</h2>
        <p>Hi ${name || 'there'}, please confirm your email to finish setting up your account.</p>
        <p><a class="btn" href="${link}">Verify Email</a></p>
        <p class="muted">If you didn't create an account, you can ignore this email.</p>
      `
      const html = baseTemplate({ title: 'Verify Email', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Email Verification`, html, text: textify(html) }
    },
    resetPassword: ({ to, name, resetUrl }) => {
      const url = resetUrl || `https://${DOMAIN}/reset-password?email=${encodeURIComponent(to)}`
      const content = `
        <h2>Password Reset Requested</h2>
        <p>Hi ${name || 'there'}, we received a request to reset your password.</p>
        <p><a class="btn" href="${url}">Reset Password</a></p>
        <p class="muted">If you didn't request this, you can safely ignore this email.</p>
      `
      const html = baseTemplate({ title: 'Password Reset', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Password Reset`, html, text: textify(html) }
    },
    accountActivated: ({ to, name }) => {
      const content = `
        <h2>Your account is active</h2>
        <p>Welcome aboard, ${name || 'Trader'}! Your ${APP_NAME} account is now active.</p>
        <p><a class="btn" href="https://${DOMAIN}">Open Dashboard</a></p>
      `
      const html = baseTemplate({ title: 'Account Activated', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Account Activated`, html, text: textify(html) }
    }
  },

  // SUPPORT
  support: {
    supportReply: ({ to, ticketId, message }) => {
      const content = `
        <h2>Support Update</h2>
        <p>Ticket <strong>#${ticketId}</strong></p>
        <div style="white-space:pre-wrap">${message}</div>
        <p><a class="btn" href="https://${DOMAIN}/support?ticket=${encodeURIComponent(ticketId)}">View Ticket</a></p>
      `
      const html = baseTemplate({ title: 'Support Reply', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `[${APP_NAME} Support] Update on ticket #${ticketId}`, html, text: textify(html) }
    },
    accountHelp: ({ to, message }) => {
      const content = `
        <h2>Account Assistance</h2>
        <div style="white-space:pre-wrap">${message}</div>
      `
      const html = baseTemplate({ title: 'Account Assistance', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Account Assistance`, html, text: textify(html) }
    },
    helpdeskNotification: ({ to, summary }) => {
      const content = `
        <h2>Help Desk Notification</h2>
        <p>${summary}</p>
      `
      const html = baseTemplate({ title: 'Help Desk Notification', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Help Desk Notification`, html, text: textify(html) }
    }
  },

  // ADMIN
  admin: {
    newUser: ({ to, count, userEmail }) => {
      const content = `
        <h2>New User Registered</h2>
        <p><strong>${userEmail}</strong> just registered.</p>
        <p>Total users: <strong>${count}</strong></p>
      `
      const html = baseTemplate({ title: 'New User', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME}: New user - ${userEmail}`, html, text: textify(html) }
    },
    systemAlert: ({ to, level, message }) => {
      const content = `
        <h2>System Alert (${level})</h2>
        <div class="muted">${new Date().toISOString()}</div>
        <div style="white-space:pre-wrap;margin-top:8px">${message}</div>
      `
      const html = baseTemplate({ title: 'System Alert', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Alert: ${level}`, html, text: textify(html) }
    },
    statsSummary: ({ to, period, stats }) => {
      const content = `
        <h2>Platform Statistics - ${period}</h2>
        <ul>
          <li>New users: <strong>${stats.newUsers||0}</strong></li>
          <li>Cashback requests: <strong>${stats.requests||0}</strong></li>
          <li>Payouts processed: <strong>${stats.payouts||0}</strong></li>
        </ul>
      `
      const html = baseTemplate({ title: 'Platform Stats', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} ${period} Stats`, html, text: textify(html) }
    }
  },

  // PAYMENTS
  payments: {
    cashbackRequest: ({ to, name, propFirmName, purchaseAmount, cashbackAmount }) => {
      const html = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px; color: #111;">
  <p><strong>Cashback Request Received – PropMate</strong></p>
  <p>Hi ${name || 'Trader'},</p>
  <p>We've received your cashback request for ${propFirmName}. Our team is reviewing your submission and will update you shortly.</p>
  <p>Request Details:</p>
  <ul>
    <li>Prop Firm: ${propFirmName}</li>
    <li>Purchase Amount: $${Number(purchaseAmount).toFixed(2)}</li>
    <li>Estimated Cashback: $${Number(cashbackAmount).toFixed(2)}</li>
    <li>Status: Under Review</li>
  </ul>
  <p>We typically process requests within 5–7 business days. You'll be notified once your cashback has been confirmed and sent.</p>
  <p>Thank you for choosing PropMate,<br/>The PropMate Team</p>
</div>`
      return { subject: `Cashback Request Received – PropMate`, html, text: textify(html) }
    },
    cashbackEarned: ({ to, amount, firm }) => {
      const content = `
        <h2>Cashback Earned 🎉</h2>
        <p>You just earned <strong>$${Number(amount).toFixed(2)}</strong> from <strong>${firm}</strong>.</p>
        <p><a class="btn" href="https://${DOMAIN}/dashboard">View Details</a></p>
      `
      const html = baseTemplate({ title: 'Cashback Earned', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `You earned $${Number(amount).toFixed(2)} cashback`, html, text: textify(html) }
    },
    payoutProcessing: ({ to, name, cashbackAmount, purchaseAmount, propFirmName, walletAddress, transactionHash }) => {
      const html = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px; color: #111;">
  <p><strong>Cashback Payment Sent – $${Number(cashbackAmount).toFixed(2)}</strong></p>
  <p>Hi ${name || 'Trader'},</p>
  <p>Your cashback payment has been successfully processed and sent to your wallet.</p>
  <p>Payment Details:</p>
  <ul>
    <li>Amount Sent: $${Number(cashbackAmount).toFixed(2)}</li>
    <li>Purchase Amount: $${Number(purchaseAmount).toFixed(2)}</li>
    <li>Prop Firm: ${propFirmName}</li>
    <li>Wallet Address: ${walletAddress}</li>
    <li>Transaction Hash: ${transactionHash}</li>
  </ul>
  <p>Verify the transaction on the blockchain using the transaction hash above. It may take a few minutes to appear depending on network congestion.</p>
  <p>Keep this email as proof of payment for your records.</p>
  <p>Thank you for using PropMate.</p>
  <p>Best regards,<br/>The PropMate Team</p>
</div>`
      return { subject: `Cashback Payment Sent – $${Number(cashbackAmount).toFixed(2)}`, html, text: textify(html) }
    },
    paymentMethodUpdate: ({ to, method }) => {
      const content = `
        <h2>Payment Method Updated</h2>
        <p>Your payment method is now set to <strong>${method}</strong>.</p>
      `
      const html = baseTemplate({ title: 'Payment Method Updated', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `Payment method updated: ${method}`, html, text: textify(html) }
    },
    monthlySummary: ({ to, month, totals }) => {
      const content = `
        <h2>Monthly Earning Summary - ${month}</h2>
        <ul>
          <li>Total cashback: <strong>$${Number(totals.cashback||0).toFixed(2)}</strong></li>
          <li>Payouts received: <strong>$${Number(totals.payouts||0).toFixed(2)}</strong></li>
        </ul>
      `
      const html = baseTemplate({ title: 'Monthly Summary', content, unsubscribeUrl: unsubscribeUrlFor(to) })
      return { subject: `${APP_NAME} Monthly Summary - ${month}`, html, text: textify(html) }
    }
  }
}

function renderTemplate(category, type, data) {
  const cat = templates[category]
  if (!cat) throw new Error(`Unknown category: ${category}`)
  const fn = cat[type]
  if (!fn) throw new Error(`Unknown template type: ${category}.${type}`)
  return fn(data)
}

export { renderTemplate }


