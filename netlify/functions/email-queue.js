// Simple in-memory queue for demo/dev. For production, switch to a durable store (Supabase table or Netlify Blobs). ESM

import { RESEND_API_URL, getSender, formatFromHeader } from './email-config.js'

const queue = []
let isProcessing = false

async function processNext() {
  if (isProcessing) return
  isProcessing = true
  try {
    while (queue.length) {
      const job = queue.shift()
      try {
        const res = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: formatFromHeader(getSender(job.category || 'noreply')),
            to: Array.isArray(job.to) ? job.to : [job.to],
            subject: job.subject,
            html: job.html || undefined,
            text: job.text || undefined
          })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          console.error('Queue send failed:', data)
        }
        await new Promise(r => setTimeout(r, 120)) // basic rate control
      } catch (err) {
        console.error('Queue job error:', err)
      }
    }
  } finally {
    isProcessing = false
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}')
      const { to, subject, html, text, category } = body
      if (!to || !subject || (!html && !text)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid payload' }) }
      }
      queue.push({ to, subject, html, text, category })
      processNext()
      return { statusCode: 202, body: JSON.stringify({ success: true, queued: true, size: queue.length }) }
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) }
    }
  }
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: JSON.stringify({ queued: queue.length, processing: isProcessing }) }
  }
  return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) }
}


