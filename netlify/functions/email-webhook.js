// Generic webhook receiver for provider events (delivery, bounce, complaint). ESM

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) }
    }

    const signature = event.headers['x-signature'] || ''
    // TODO: Validate signature when using a real provider webhook secret

    const payload = JSON.parse(event.body || '{}')
    // Example normalized event shape
    const normalized = {
      provider: 'resend',
      event: payload.type || payload.event || 'unknown',
      messageId: payload.data?.id || payload.messageId || null,
      to: payload.data?.to || payload.to || null,
      timestamp: Date.now(),
      raw: payload
    }

    // For now, just log. In production, persist to Supabase table `email_events`.
    console.log('Email webhook:', normalized)

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('Webhook error:', err)
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message || 'Server error' }) }
  }
}


