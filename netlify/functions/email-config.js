// Centralized email configuration for Netlify Functions (ESM)

const APP_NAME = process.env.APP_NAME || 'PropMate'
const DOMAIN = process.env.PRODUCTION_DOMAIN || 'propmate.site'

// Sender addresses by category
const SENDERS = {
  legal: {
    email: process.env.LEGAL_FROM_EMAIL || `legal@${DOMAIN}`,
    name: process.env.LEGAL_FROM_NAME || APP_NAME + ' Legal'
  },
  noreply: {
    email: process.env.NOREPLY_FROM_EMAIL || `noreply@${DOMAIN}`,
    name: process.env.NOREPLY_FROM_NAME || APP_NAME
  },
  support: {
    email: process.env.SUPPORT_FROM_EMAIL || `support@${DOMAIN}`,
    name: process.env.SUPPORT_FROM_NAME || APP_NAME + ' Support'
  },
  admin: {
    email: process.env.ADMIN_FROM_EMAIL || `admin@${DOMAIN}`,
    name: process.env.ADMIN_FROM_NAME || APP_NAME + ' Admin'
  },
  payments: {
    email: process.env.PAYMENTS_FROM_EMAIL || `payments@${DOMAIN}`,
    name: process.env.PAYMENTS_FROM_NAME || APP_NAME + ' Payments'
  }
}

const RESEND_API_URL = 'https://api.resend.com/emails'

// Basic soft rate limiting (per-process memory)
const RATE_LIMIT_WINDOW_MS = Number(process.env.EMAIL_RATE_LIMIT_WINDOW_MS || 60_000)
const RATE_LIMIT_MAX = Number(process.env.EMAIL_RATE_LIMIT_MAX || 20)
const rateBuckets = new Map()

function getSender(category) {
  return SENDERS[category] || SENDERS.noreply
}

function formatFromHeader({ name, email }) {
  return `${name} <${email}>`
}

function getRateBucketKey(event) {
  const key = event.headers['x-ratelimit-key'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'anonymous'
  return key + ':' + (event.queryStringParameters?.category || 'generic')
}

function isRateLimited(event) {
  const key = getRateBucketKey(event)
  const now = Date.now()
  const bucket = rateBuckets.get(key) || { count: 0, start: now }
  if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
    bucket.count = 0
    bucket.start = now
  }
  bucket.count += 1
  rateBuckets.set(key, bucket)
  return bucket.count > RATE_LIMIT_MAX
}

function requiredEnv() {
  const missing = []
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
  // Not strictly required but recommended
  if (!process.env.PRODUCTION_DOMAIN) missing.push('PRODUCTION_DOMAIN')
  return missing
}

export {
  APP_NAME,
  DOMAIN,
  SENDERS,
  RESEND_API_URL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  getSender,
  formatFromHeader,
  isRateLimited,
  requiredEnv
}


