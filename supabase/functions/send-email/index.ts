// Supabase Edge Function: send-email (Resend)
// Request: POST JSON { to, subject, html?, text? }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return json({ success: false, error: "Method Not Allowed" }, 405)
    }

    const { to, subject, html, text } = await req.json().catch(() => ({}))
    if (!to || !subject || (!html && !text)) {
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
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return json({ success: false, error: data?.message || "Email send failed" }, 502)
    }

    return json({ success: true, messageId: data?.id || null })
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


