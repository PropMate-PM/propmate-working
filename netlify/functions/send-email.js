'use strict'

// Netlify Function: send-email (Resend)
// Expects JSON body: { to, subject, html, text }

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) }
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@propmate.site'
    const FROM_NAME = process.env.FROM_NAME || 'PropMate'

    if (!RESEND_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Missing RESEND_API_KEY' }) }
    }

    const payload = JSON.parse(event.body || '{}')
    const { to, subject, html, text } = payload

    if (!to || !subject || (!html && !text)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid request body' }) }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined
      })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: data?.message || 'Email send failed' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, messageId: data?.id || null }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message || 'Server error' }) }
  }
}


