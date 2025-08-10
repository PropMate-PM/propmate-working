// Enhanced Netlify Function: send-email (Resend + templates + categories; ESM)
// Expects JSON body:
// { to, category, type, data, subject?, html?, text? }
// - If subject/html/text are omitted, will render from template: renderTemplate(category, type, { to, ...data })
// - category in: legal | noreply | support | admin | payments

import { RESEND_API_URL, getSender, formatFromHeader, isRateLimited, requiredEnv } from './email-config.js'
import { renderTemplate } from './email-templates.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) }
    }

    const missing = requiredEnv()
    if (missing.length) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: `Missing env: ${missing.join(', ')}` }) }
    }

    if (isRateLimited(event)) {
      return { statusCode: 429, body: JSON.stringify({ success: false, error: 'Too Many Requests' }) }
    }

    const payload = JSON.parse(event.body || '{}')
    const { to, category = 'noreply', type, data = {}, subject, html, text } = payload

    if (!to) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing to' }) }

    let finalSubject = subject
    let finalHtml = html
    let finalText = text

    if (!finalSubject || (!finalHtml && !finalText)) {
      if (!type) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing type for templated email' }) }
      const rendered = renderTemplate(category, type, { to, ...(data || {}) })
      finalSubject = finalSubject || rendered.subject
      finalHtml = finalHtml || rendered.html
      finalText = finalText || rendered.text
    }

    const sender = getSender(category)

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: formatFromHeader(sender),
        to: Array.isArray(to) ? to : [to],
        subject: finalSubject,
        html: finalHtml || undefined,
        text: finalText || undefined,
        headers: {
          'X-Propmate-Category': category,
          'X-Propmate-Type': type || 'custom'
        }
      })
    })

    const dataOut = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: dataOut?.message || 'Email send failed' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, messageId: dataOut?.id || null }) }
  } catch (err) {
    console.error('send-email error', err)
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message || 'Server error' }) }
  }
}


