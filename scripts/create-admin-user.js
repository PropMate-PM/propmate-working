#!/usr/bin/env node

// Create or promote admin user using Supabase service role
// Required env vars:
// - VITE_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - ADMIN_EMAIL (default: admin@propmate.site)
// - ADMIN_PASSWORD (required when creating new user)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@propmate.site').trim().toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD

function exitWith(msg, code = 1) {
  console.error(msg)
  process.exit(code)
}

if (!supabaseUrl || !serviceRoleKey) {
  exitWith('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function findUserByEmail(email) {
  // auth.admin.listUsers does not support direct filtering by email; iterate pages
  const perPage = 100
  let page = 1
  /* eslint-disable no-constant-condition */
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data?.users?.find(u => (u.email || '').toLowerCase() === email)
    if (found) return found
    if (!data || data.users.length < perPage) return null
    page += 1
    if (page > 50) return null // hard safety cap
  }
}

async function ensureAdminUser() {
  console.log(`⏳ Ensuring admin user exists: ${adminEmail}`)
  let user = await findUserByEmail(adminEmail)

  if (!user) {
    if (!adminPassword) {
      exitWith('ADMIN_PASSWORD is required to create a new admin user (not found).')
    }
    console.log('➕ Creating admin user via admin API...')
    const { data, error } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })
    if (error && !String(error.message || '').includes('already registered')) {
      console.warn(`Create user failed: ${error.message}`)
      console.log('↩ Falling back to generate signup link...')
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'signup',
        email: adminEmail,
        password: adminPassword
      })
      if (linkErr) {
        exitWith(`Failed to generate signup link: ${linkErr.message}`)
      }
      console.log('👇 Open this link in your browser to complete admin signup:')
      console.log(linkData.properties?.action_link || linkData.action_link)
      console.log('After opening the link and completing signup, rerun this script to assign the role if needed.')
      return
    }
    user = data?.user || (await findUserByEmail(adminEmail))
    if (!user) exitWith('User creation appeared to succeed but user not found afterward.')
    console.log('✅ Admin user created.')
  } else {
    console.log('✅ Admin user already exists.')
  }

  // Promote to super_admin in admin_roles
  console.log('⏳ Ensuring super_admin role...')
  const { error: upsertErr } = await admin
    .from('admin_roles')
    .upsert({ user_id: user.id, role: 'super_admin', is_active: true }, { onConflict: 'user_id' })
  if (upsertErr) exitWith(`Failed to assign admin role: ${upsertErr.message}`)

  console.log('🏁 Done. Admin user ensured and promoted to super_admin.')
}

ensureAdminUser().catch(err => exitWith(err.message || String(err)))


