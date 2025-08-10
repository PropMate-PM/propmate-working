#!/usr/bin/env node

// Update an existing Supabase user email and password using service role key
// Env vars required:
// - VITE_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - OLD_ADMIN_EMAIL (default: admin@propmate.com)
// - NEW_ADMIN_EMAIL (default: admin@propmate.site)
// - NEW_ADMIN_PASSWORD (default pulled from ADMIN_PASSWORD if set)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const oldEmail = (process.env.OLD_ADMIN_EMAIL || 'admin@propmate.com').toLowerCase()
const newEmail = (process.env.NEW_ADMIN_EMAIL || 'admin@propmate.site').toLowerCase()
const newPassword = process.env.NEW_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@PropMate2024!'

function fail(msg) { console.error(msg); process.exit(1) }

if (!supabaseUrl || !serviceRoleKey) fail('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function listAllUsers() {
  const users = []
  let page = 1
  const perPage = 100
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) fail(error.message)
    users.push(...(data?.users || []))
    if (!data || data.users.length < perPage) break
    if (++page > 50) break
  }
  return users
}

async function main() {
  console.log(`⏳ Looking up existing user by email: ${oldEmail}`)
  const users = await listAllUsers()
  const user = users.find(u => (u.email || '').toLowerCase() === oldEmail)
  if (!user) fail(`User not found: ${oldEmail}`)

  console.log(`🔄 Updating email to: ${newEmail}`)
  const { data: upd, error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
    password: newPassword
  })
  if (updErr) fail(`Failed to update user: ${updErr.message}`)

  console.log('✅ Email and password updated.')

  // Ensure super_admin role
  console.log('⏳ Ensuring super_admin role...')
  const { error: upsertErr } = await admin
    .from('admin_roles')
    .upsert({ user_id: user.id, role: 'super_admin', is_active: true }, { onConflict: 'user_id' })
  if (upsertErr) fail(`Failed to assign role: ${upsertErr.message}`)

  console.log('🏁 Done. Use the new credentials to sign in.')
}

main().catch(e => fail(e.message || String(e)))


