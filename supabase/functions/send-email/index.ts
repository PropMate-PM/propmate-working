// Supabase Edge Function: send-email (Resend)
// Request: POST JSON { to, subject, html?, text?, type? }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Email templates with plain text styling
const emailTemplates = {
  welcome: (userName: string) => ({
    subject: 'Welcome to PropMate – Your Cashback Trading Partner',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to PropMate – Your Cashback Trading Partner</h2>
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
    text: `Hi ${userName}, Welcome to PropMate – the premier platform for prop firm cashback rewards. We're excited to have you onboard! Here's how to get started: 1) Browse Firms: Explore our curated list of leading prop trading firms. 2) Use Our Links: Purchase through our referral links to qualify for cashback. 3) Submit Proof: Upload your purchase receipt to claim your cashback. Tip: Always use our referral links to ensure your cashback is tracked correctly. We look forward to helping you maximize your trading benefits. Log in to your dashboard anytime to explore firms and manage requests. Happy trading, The PropMate Team`
  }),

  cashbackRequest: (userName: string, firmName: string, amount: number) => ({
    subject: 'Cashback Request Received – PropMate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Cashback Request Received – PropMate</h2>
        <p>Hi ${userName},</p>
        <p>We've received your cashback request for <strong>${firmName}</strong>.<br>
        Our team is reviewing your submission and will update you shortly.</p>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Prop Firm:</strong> ${firmName}</li>
          <li><strong>Purchase Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Estimated Cashback:</strong> $${(amount * 0.125).toFixed(2)}</li>
          <li><strong>Status:</strong> Under Review</li>
        </ul>
        
        <p>We typically process requests within 5–7 business days. You'll be notified once your cashback has been confirmed and sent.</p>
        
        <p>Thank you for choosing PropMate,<br>
        The PropMate Team</p>
      </div>
    `,
    text: `Hi ${userName}, We've received your cashback request for ${firmName}. Our team is reviewing your submission and will update you shortly. Request Details: Prop Firm: ${firmName}, Purchase Amount: $${amount.toFixed(2)}, Estimated Cashback: $${(amount * 0.125).toFixed(2)}, Status: Under Review. We typically process requests within 5–7 business days. You'll be notified once your cashback has been confirmed and sent. Thank you for choosing PropMate, The PropMate Team`
  }),

  paymentSent: (userName: string, amount: number, firmName: string, walletAddress: string, transactionHash: string) => ({
    subject: `Cashback Payment Sent – $${amount.toFixed(2)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Cashback Payment Sent – $${amount.toFixed(2)}</h2>
        <p>Hi ${userName},</p>
        <p>Your cashback payment has been successfully processed and sent to your wallet.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Amount Sent:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Prop Firm:</strong> ${firmName}</li>
          <li><strong>Wallet Address:</strong> ${walletAddress}</li>
          <li><strong>Transaction Hash:</strong> ${transactionHash}</li>
        </ul>
        
        <p>🔎 <strong>Verify Transaction:</strong><br>
        You can verify this transaction on the blockchain using the transaction hash above. Depending on network congestion, it may take a few minutes to appear.</p>
        
        <p>📌 <strong>Keep this email as proof of payment for your records.</strong></p>
        
        <p>Thank you for using PropMate. We look forward to sending you more cashback rewards soon.</p>
        
        <p>Best regards,<br>
        The PropMate Team</p>
      </div>
    `,
    text: `Hi ${userName}, Your cashback payment has been successfully processed and sent to your wallet. Amount Sent: $${amount.toFixed(2)}, Prop Firm: ${firmName}, Wallet Address: ${walletAddress}, Transaction Hash: ${transactionHash}. Verify Transaction: You can verify this transaction on the blockchain using the transaction hash above. Keep this email as proof of payment for your records. Thank you for using PropMate. We look forward to sending you more cashback rewards soon. Best regards, The PropMate Team`
  }),

  statusChange: (userName: string, status: string, amount: number, firmName: string) => ({
    subject: `Cashback Request ${status.charAt(0).toUpperCase() + status.slice(1)} – PropMate`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Cashback Request Update</h2>
        <p>Hi ${userName},</p>
        <p>Your cashback request for <strong>${firmName}</strong> has been <strong>${status}</strong>.</p>
        ${status === 'paid' ? `
          <h3>Payment Processed!</h3>
          <p>Amount: <strong>$${amount.toFixed(2)}</strong></p>
          <p>Your cashback has been sent to your crypto wallet. Please allow up to 24 hours for the transaction to appear in your wallet.</p>
        ` : status === 'rejected' ? `
          <h3>Request Rejected</h3>
          <p>Unfortunately, we couldn't process your cashback request. This may be due to:</p>
          <ul>
            <li>Invalid proof of purchase</li>
            <li>Purchase not made through our affiliate link</li>
            <li>Duplicate submission</li>
          </ul>
          <p>Please contact support if you believe this was an error.</p>
        ` : ''}
        <p>You can view all your requests in your dashboard.</p>
        <p>Best regards,<br>The PropMate Team</p>
      </div>
    `,
    text: `Hi ${userName}, Your cashback request for ${firmName} has been ${status}. ${status === 'paid' ? `Amount: $${amount.toFixed(2)}. Your cashback has been sent to your crypto wallet.` : status === 'rejected' ? 'Unfortunately, we couldn\'t process your cashback request. Please contact support if you believe this was an error.' : ''} You can view all your requests in your dashboard. Best regards, The PropMate Team`
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return json({ success: false, error: "Method Not Allowed" }, 405)
    }

    const { to, subject, html, text, type, data } = await req.json().catch(() => ({}))
    
    // If type is provided, render template
    let finalSubject = subject
    let finalHtml = html
    let finalText = text
    
    if (type && data) {
      let template
      switch (type) {
        case 'welcome':
          template = emailTemplates.welcome(data.name || data.userName || 'Trader')
          break
        case 'cashbackRequest':
          template = emailTemplates.cashbackRequest(data.name || data.userName, data.firmName, data.amount)
          break
        case 'paymentSent':
          template = emailTemplates.paymentSent(data.userName, data.amount, data.firmName, data.walletAddress, data.transactionHash)
          break
        case 'statusChange':
          template = emailTemplates.statusChange(data.userName, data.status, data.amount, data.firmName)
          break
        default:
          return json({ success: false, error: "Unknown email type" }, 400)
      }
      finalSubject = template.subject
      finalHtml = template.html
      finalText = template.text
    }

    if (!to || !finalSubject || (!finalHtml && !finalText)) {
      return json({ success: false, error: "Invalid request body" }, 400)
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@propmate.site"
    const FROM_NAME = Deno.env.get("FROM_NAME") || "PropMate"

    if (!RESEND_API_KEY) {
      return json({ success: false, error: "Missing RESEND_API_KEY" }, 500)
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject: finalSubject,
        html: finalHtml || undefined,
        text: finalText || undefined,
      }),
    })

    const dataOut = await res.json().catch(() => ({}))
    if (!res.ok) {
      return json({ success: false, error: dataOut?.message || "Email send failed" }, 502)
    }

    return json({ success: true, messageId: dataOut?.id || null })
  } catch (err) {
    return json({ success: false, error: err?.message || "Server error" }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  })
}


