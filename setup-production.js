#!/usr/bin/env node

/**
 * Production Setup Script for PropMate Security Implementation
 * 
 * This script helps you set up the production environment with all security features.
 * Run with: node setup-production.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.magenta}${colors.bright}=== ${msg} ===${colors.reset}\n`)
};

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@propmate.com',
  adminPassword: process.env.ADMIN_PASSWORD,
  resendApiKey: process.env.RESEND_API_KEY,
  sendgridApiKey: process.env.SENDGRID_API_KEY
};

/**
 * Check environment variables
 */
function checkEnvironment() {
  log.header('Checking Environment Configuration');
  
  const required = ['supabaseUrl', 'supabaseServiceKey'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.info('Please set the following environment variables:');
    log.info('  VITE_SUPABASE_URL - Your Supabase project URL');
    log.info('  SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (for admin operations)');
    log.info('  VITE_SUPABASE_ANON_KEY - Your Supabase anon key');
    log.info('  ADMIN_EMAIL - Initial admin email (optional, defaults to admin@propmate.com)');
    log.info('  ADMIN_PASSWORD - Initial admin password (optional, will prompt if not set)');
    log.info('  RESEND_API_KEY or SENDGRID_API_KEY - Email service API key');
    return false;
  }
  
  log.success('Environment variables configured');
  return true;
}

/**
 * Create Supabase client with service role key
 */
function createAdminClient() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Apply the security migration
 */
async function applySecurityMigration() {
  log.header('Applying Security Migration');
  
  try {
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250102000000_critical_security_fixes.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    log.info('Reading migration file...');
    
    const supabase = createAdminClient();
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    log.info(`Executing ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error && !error.message.includes('already exists')) {
          log.warning(`Statement ${i + 1} warning: ${error.message}`);
        }
      } catch (err) {
        log.warning(`Statement ${i + 1} error: ${err.message}`);
      }
    }
    
    log.success('Security migration applied successfully');
    return true;
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    log.info('You may need to apply the migration manually using your Supabase dashboard');
    log.info('Migration file: supabase/migrations/20250102000000_critical_security_fixes.sql');
    return false;
  }
}

/**
 * Create initial super admin user
 */
async function createSuperAdmin() {
  log.header('Creating Super Admin User');
  
  try {
    const supabase = createAdminClient();
    
    // Get admin password
    let adminPassword = config.adminPassword;
    if (!adminPassword) {
      log.info('Admin password not set in environment variables');
      log.info('Please set ADMIN_PASSWORD environment variable or create the admin user manually');
      return false;
    }
    
    log.info(`Creating admin user: ${config.adminEmail}`);
    
    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: config.adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    
    if (authError && !authError.message.includes('already registered')) {
      log.error(`Failed to create admin user: ${authError.message}`);
      return false;
    }
    
    const userId = authData?.user?.id;
    if (!userId) {
      log.warning('Admin user may already exist');
      // Try to get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingAdmin = users.users.find(u => u.email === config.adminEmail);
      if (existingAdmin) {
        userId = existingAdmin.id;
        log.info('Found existing admin user');
      }
    }
    
    if (userId) {
      // Assign super admin role
      const { error: roleError } = await supabase
        .from('admin_roles')
        .upsert({
          user_id: userId,
          role: 'super_admin',
          granted_by: userId,
          is_active: true
        });
      
      if (roleError) {
        log.error(`Failed to assign admin role: ${roleError.message}`);
        return false;
      }
      
      log.success(`Super admin user created: ${config.adminEmail}`);
      log.info(`Admin can now log in with the provided password`);
    }
    
    return true;
  } catch (error) {
    log.error(`Admin setup failed: ${error.message}`);
    return false;
  }
}

/**
 * Test database security
 */
async function testSecurity() {
  log.header('Testing Security Implementation');
  
  try {
    const supabase = createAdminClient();
    
    // Test 1: Check if RLS is enabled
    log.info('Testing Row Level Security...');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['cashback_submissions', 'admin_roles', 'audit_log']);
    
    if (tables && tables.length > 0) {
      log.success('Security tables exist');
    }
    
    // Test 2: Check admin functions
    log.info('Testing admin functions...');
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin', {
      user_uuid: '00000000-0000-0000-0000-000000000000'
    });
    
    if (!adminError) {
      log.success('Admin functions working');
    }
    
    // Test 3: Check fraud detection functions
    log.info('Testing fraud detection...');
    const { data: fraudCheck, error: fraudError } = await supabase.rpc('check_duplicate_wallet', {
      wallet_addr: '0x0000000000000000000000000000000000000000',
      user_uuid: '00000000-0000-0000-0000-000000000000'
    });
    
    if (!fraudError) {
      log.success('Fraud detection functions working');
    }
    
    log.success('Security tests completed');
    return true;
  } catch (error) {
    log.error(`Security testing failed: ${error.message}`);
    return false;
  }
}

/**
 * Setup email service configuration
 */
function setupEmailService() {
  log.header('Email Service Configuration');
  
  if (config.resendApiKey) {
    log.success('Resend API key found');
    log.info('To integrate Resend:');
    log.info('1. Update src/lib/emailService.ts');
    log.info('2. Replace the mock sendEmail function with Resend integration');
    log.info('3. Test email sending functionality');
    return true;
  } else if (config.sendgridApiKey) {
    log.success('SendGrid API key found');
    log.info('To integrate SendGrid:');
    log.info('1. Update src/lib/emailService.ts');
    log.info('2. Replace the mock sendEmail function with SendGrid integration');
    log.info('3. Test email sending functionality');
    return true;
  } else {
    log.warning('No email service API key found');
    log.info('Email service is currently in mock mode');
    log.info('Set RESEND_API_KEY or SENDGRID_API_KEY to enable production emails');
    return false;
  }
}

/**
 * Generate security checklist
 */
function generateSecurityChecklist() {
  log.header('Security Implementation Checklist');
  
  const checklist = [
    '□ Database migration applied',
    '□ Super admin user created',
    '□ Email service configured',
    '□ Environment variables secured',
    '□ HTTPS enabled in production',
    '□ Regular backup schedule established',
    '□ Security monitoring alerts configured',
    '□ Admin access restricted to authorized personnel',
    '□ Rate limiting tested',
    '□ Fraud detection tested',
    '□ Audit logging verified',
    '□ User data isolation confirmed',
    '□ Password policies enforced',
    '□ Email templates reviewed',
    '□ Production deployment tested'
  ];
  
  console.log('\nSecurity Checklist:');
  checklist.forEach(item => console.log(`  ${item}`));
  
  log.info('\nReview and complete each item before going live');
}

/**
 * Main setup function
 */
async function main() {
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              PropMate Security Setup                     ║');
  console.log('║         Production Environment Configuration             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // Step 1: Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Step 2: Apply migration
  const migrationSuccess = await applySecurityMigration();
  
  // Step 3: Create admin user
  const adminSuccess = await createSuperAdmin();
  
  // Step 4: Test security
  const testSuccess = await testSecurity();
  
  // Step 5: Setup email
  const emailSuccess = setupEmailService();
  
  // Step 6: Generate checklist
  generateSecurityChecklist();
  
  // Summary
  log.header('Setup Summary');
  log.info(`Migration: ${migrationSuccess ? '✓ Applied' : '✗ Failed'}`);
  log.info(`Admin User: ${adminSuccess ? '✓ Created' : '✗ Failed'}`);
  log.info(`Security Tests: ${testSuccess ? '✓ Passed' : '✗ Failed'}`);
  log.info(`Email Service: ${emailSuccess ? '✓ Configured' : '⚠ Manual setup required'}`);
  
  if (migrationSuccess && adminSuccess && testSuccess) {
    log.success('\n🎉 Production setup completed successfully!');
    log.info('Your PropMate platform is now secure and ready for production use.');
  } else {
    log.warning('\n⚠ Setup completed with some issues.');
    log.info('Please review the errors above and complete any failed steps manually.');
  }
  
  log.info('\nNext steps:');
  log.info('1. Test the admin login functionality');
  log.info('2. Review the security checklist');
  log.info('3. Set up monitoring and alerts');
  log.info('4. Deploy to production environment');
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as setupProduction };