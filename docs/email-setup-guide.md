## PropMate Email System (Netlify + Resend)

This guide sets up automated, production-ready email for PropMate on Netlify using Resend.

### 1) Folder structure

```
netlify/functions/
  - send-email.js         # Main handler: categories + templates
  - email-config.js       # Central config, sender identities, rate limits
  - email-templates.js    # All HTML/text templates
  - email-queue.js        # Simple queue (demo/dev)
  - email-webhook.js      # Webhook receiver for delivery/bounce events
src/services/
  - emailService.ts       # Frontend wrapper with convenience helpers
docs/
  - email-setup-guide.md  # This guide
```

### 2) Environment variables

Set these in Netlify (Site settings → Environment variables):

- RESEND_API_KEY: Your Resend API key
- PRODUCTION_DOMAIN: propmate.site
- APP_NAME: PropMate
- LEGAL_FROM_EMAIL: legal@propmate.site
- NOREPLY_FROM_EMAIL: noreply@propmate.site
- SUPPORT_FROM_EMAIL: support@propmate.site
- ADMIN_FROM_EMAIL: admin@propmate.site
- PAYMENTS_FROM_EMAIL: payments@propmate.site
- EMAIL_RATE_LIMIT_WINDOW_MS: 60000
- EMAIL_RATE_LIMIT_MAX: 20
- PUBLIC_APP_URL: https://propmate.site

Local dev (.env or environment-template.env):
- VITE_EMAIL_API_URL=/.netlify/functions/send-email

### 3) DNS and domain setup (SPF/DKIM)

In Resend dashboard:
- Add domain: propmate.site
- Follow instructions to add DNS records:
  - DKIM (CNAME) records
  - SPF: add or update TXT record at root: `v=spf1 include:resend.com ~all`
  - DMARC (recommended): TXT at `_dmarc.propmate.site` with `v=DMARC1; p=none; rua=mailto:admin@propmate.site`
- Wait for verification to show “verified”. Use the exact from addresses configured above.

### 4) Using in your app

Type-safe frontend helpers in `src/services/emailService.ts`:

```ts
import { Email } from '@/services/emailService'

await Email.welcome('user@example.com', 'Alice')
await Email.verifyEmail('user@example.com', 'Alice', '123456')
await Email.paymentCashback('user@example.com', 12.5, 'FunderX')
```

Or call the function directly:

```ts
import { sendEmail } from '@/services/emailService'

await sendEmail({
  to: 'user@example.com',
  category: 'payments',
  type: 'monthlySummary',
  data: { month: 'Jan 2025', totals: { cashback: 120.5, payouts: 100.0 } }
})
```

### 5) Netlify functions API

- POST `/.netlify/functions/send-email`
  - Body: `{ to, category, type, data }`
  - Categories: `legal | noreply | support | admin | payments`
  - If `subject/html/text` omitted, system renders template.

- POST `/.netlify/functions/email-queue` (demo queue)
- POST `/.netlify/functions/email-webhook` (provider events)

### 6) Templates

All templates are in `netlify/functions/email-templates.js` and are mobile‑friendly.
Categories include:
- Legal: `termsUpdate`, `privacyUpdate`, `complianceNotice`
- No‑reply: `welcome`, `verifyEmail`, `resetPassword`, `accountActivated`
- Support: `supportReply`, `accountHelp`, `helpdeskNotification`
- Admin: `newUser`, `systemAlert`, `statsSummary`
- Payments: `cashbackEarned`, `payoutProcessing`, `paymentMethodUpdate`, `monthlySummary`

Unsubscribe links are included via `PUBLIC_APP_URL/unsubscribe?email=...`. Implement that route to respect user preferences.

### 7) Error handling and logs

- API returns `{ success: false, error }` on failure.
- Netlify function logs appear in Netlify deploy logs.
- For production, persist send attempts and webhook events to Supabase (table `email_events`).

### 8) Rate limiting

- Basic in‑memory limiter in `email-config.js` (per process). For robust limits, use a shared store (Supabase, Upstash Redis) keyed by IP + category.

### 9) Testing and preview

- Local: `npm run dev` with Netlify dev (`netlify dev`) so `/.netlify/functions/send-email` is available.
- Use a test address you control. In Resend, you can send to any address once domain is verified.
- To preview templates, call the function with category/type and inspect HTML returned by your app if you surface it, or log locally.

### 10) Deployment steps

1. Commit code and push to your Netlify‑connected repo.
2. Set environment variables in Netlify.
3. In Resend, add and verify domain `propmate.site` and set from addresses.
4. Deploy site. Test by calling `Email.welcome()` from a local UI action.
5. Monitor logs and webhook events. Adjust SPF/DMARC alignment if deliverability issues arise.

### 11) Best practices

- Keep transactional emails concise, with clear CTAs.
- Use distinct from addresses for intent clarity (legal, support, payments).
- Add List‑Unsubscribe header (future enhancement) and visible unsubscribe link for non‑transactional.
- Handle bounces/complaints: use webhook to mark addresses as suppressed.
- Avoid sending on user actions more than once; use idempotency keys for duplicate protection.

### 12) Failure handling

- Frontend: show friendly message and retry option; do not block core flows on email failure.
- Backend: return HTTP 502/500 with message; retry via queue if appropriate.
- Log correlation IDs (messageId). Store in Supabase alongside user actions for traceability.


