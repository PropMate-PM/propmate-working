import { renderTemplate } from './email-templates.js'

// Returns rendered subject/html/text without sending. Useful for dev/QA.
// GET example:
// /.netlify/functions/email-preview?category=payments&type=cashbackEarned&to=a@b.com&data=%7B%22amount%22:12.5,%22firm%22:%22FunderX%22%7D

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) }
    }

    const input = event.httpMethod === 'GET'
      ? { ...event.queryStringParameters }
      : JSON.parse(event.body || '{}')

    const category = input.category || 'noreply'
    const type = input.type
    const to = input.to || 'preview@example.com'
    let data = {}
    try { data = typeof input.data === 'string' ? JSON.parse(input.data) : (input.data || {}) } catch {}

    if (!type) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing type' }) }
    }

    const rendered = renderTemplate(category, type, { to, ...data })
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, ...rendered })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message || 'Server error' }) }
  }
}


