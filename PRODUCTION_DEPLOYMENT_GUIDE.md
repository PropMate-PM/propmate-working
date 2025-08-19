# PropMate Production Deployment Guide

## 🚀 Complete Production Setup Checklist

This guide walks you through deploying your secure PropMate platform to production with all security features enabled.

## Prerequisites

- ✅ Supabase project created
- ✅ Domain name configured
- ✅ SSL certificate ready
- ✅ Email service account (Resend or SendGrid)
- ✅ Server/hosting environment ready

## Step 1: Environment Configuration

### 1.1 Copy Environment Template
```bash
cp environment-template.env .env.local
```

### 1.2 Configure Required Variables
```bash
# CRITICAL: Fill in these values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Admin Configuration
ADMIN_EMAIL=admin@propmate.site
ADMIN_PASSWORD=YourSecureAdminPassword123!

# Email Service (choose one)
RESEND_API_KEY=re_your-resend-api-key-here
# OR
# SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

# Email Configuration
FROM_EMAIL=noreply@propmate.site
FROM_NAME=PropMate
SUPPORT_EMAIL=support@propmate.site
```

## Step 2: Apply Security Migration

### 2.1 Automatic Setup (Recommended)
```bash
# Install dependencies
npm install

# Run the production setup script
node setup-production.js
```

This script will:
- ✅ Apply the security migration
- ✅ Create the super admin user
- ✅ Test all security functions
- ✅ Verify email configuration

### 2.2 Manual Migration (If Automatic Fails)

1. **Apply Migration via Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase/migrations/20250102000000_critical_security_fixes.sql`
   - Execute the SQL

2. **Create Admin User Manually**
   ```sql
   -- Create user in Supabase Auth dashboard first, then:
   INSERT INTO admin_roles (user_id, role, granted_by, is_active)
   VALUES ('YOUR_USER_ID_HERE', 'super_admin', 'YOUR_USER_ID_HERE', true);
   ```

## Step 3: Security Testing

### 3.1 Run Security Test Suite
```bash
node security-testing-suite.js
```

This will test:
- ✅ Database security and RLS policies
- ✅ Authentication security
- ✅ Fraud detection system
- ✅ Audit trail functionality
- ✅ Input validation
- ✅ Email system security

### 3.2 Manual Security Verification

1. **Test Admin Login**
   - Navigate to your application
   - Log in with admin credentials
   - Verify admin dashboard access

2. **Test User Isolation**
   - Create a test user account
   - Verify they cannot access other users' data
   - Test submission creation and viewing

3. **Test Fraud Detection**
   - Submit a request with duplicate wallet address
   - Verify fraud alert is created
   - Check admin can see and manage alerts

## Step 4: Email Service Integration

### 4.1 Resend Integration (Recommended)
```bash
# Install Resend
npm install resend

# Update src/lib/emailProviders/resend.ts
# Uncomment the Resend implementation code
```

### 4.2 SendGrid Integration
```bash
# Install SendGrid
npm install @sendgrid/mail

# Update src/lib/emailProviders/sendgrid.ts
# Uncomment the SendGrid implementation code
```

### 4.3 Update Email Service
Update `src/lib/emailService.ts` to use your chosen provider:
```typescript
import { createResendProvider } from './emailProviders/resend.js';
// OR
import { createSendGridProvider } from './emailProviders/sendgrid.js';

// Replace the mock implementation with real provider
const emailProvider = createResendProvider();
```

### 4.4 Test Email Functionality
- Test welcome emails
- Test status change notifications
- Test admin notifications
- Verify email logging works

## Step 5: Build and Deploy

### 5.1 Production Build
```bash
# Build the application
npm run build

# The build output will be in the 'dist' directory
```

### 5.2 Deploy to Your Platform

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

#### Traditional Server Deployment
```bash
# Copy dist folder to your web server
scp -r dist/ user@your-server:/var/www/propmate/

# Configure your web server (nginx, apache, etc.)
# Ensure HTTPS is enabled
```

### 5.3 Configure Domain and SSL

1. **Point your domain to the deployed application**
2. **Ensure SSL certificate is installed and working**
3. **Update Supabase Auth settings with your domain**
4. **Update CORS settings if needed**

## Step 6: Post-Deployment Verification

### 6.1 Functional Testing
- [ ] Application loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Admin dashboard functions
- [ ] Cashback submission works
- [ ] Email notifications send
- [ ] All forms validate properly

### 6.2 Security Testing
- [ ] HTTPS enforced
- [ ] Admin-only areas protected
- [ ] User data isolated
- [ ] Fraud detection active
- [ ] Rate limiting working
- [ ] Audit logging functional

### 6.3 Performance Testing
- [ ] Page load times acceptable
- [ ] Database queries fast
- [ ] Email delivery working
- [ ] No JavaScript errors

## Step 7: Security Monitoring Setup

### 7.1 Start Security Monitoring
```bash
# Run the security monitoring dashboard
node security-monitoring-dashboard.js
```

### 7.2 Configure Alerts (Optional)
```bash
# Set up Slack notifications
export SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook-url

# Set monitoring interval (default: 5 minutes)
export MONITORING_INTERVAL=300000
```

### 7.3 Set Up Automated Monitoring

Create a systemd service (Linux) or similar:
```ini
[Unit]
Description=PropMate Security Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/propmate
ExecStart=/usr/bin/node security-monitoring-dashboard.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/path/to/propmate/.env.local

[Install]
WantedBy=multi-user.target
```

## Step 8: Backup and Maintenance

### 8.1 Database Backup Setup
- Configure automated Supabase backups
- Test backup restoration process
- Set up backup monitoring

### 8.2 Regular Maintenance Schedule

#### Daily Tasks
- [ ] Review security monitoring dashboard
- [ ] Check fraud alerts
- [ ] Monitor system performance
- [ ] Review email delivery rates

#### Weekly Tasks
- [ ] Run security test suite
- [ ] Review audit logs
- [ ] Check for system updates
- [ ] Analyze user activity patterns

#### Monthly Tasks
- [ ] Comprehensive security audit
- [ ] Performance optimization review
- [ ] Email template updates
- [ ] Admin access review

## Step 9: Troubleshooting Common Issues

### Database Connection Issues
```bash
# Test database connection
node -e "
import { createClient } from '@supabase/supabase-js';
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('prop_firms').select('count').then(console.log);
"
```

### Email Delivery Issues
```bash
# Test email configuration
node -e "
import { emailService } from './src/lib/emailService.js';
emailService.sendWelcomeEmail('test@example.com', 'Test User').then(console.log);
"
```

### Admin Access Issues
```sql
-- Check admin roles
SELECT ar.*, u.email 
FROM admin_roles ar 
JOIN auth.users u ON ar.user_id = u.id 
WHERE ar.is_active = true;

-- Test admin function
SELECT is_admin('YOUR_USER_ID_HERE');
```

## Step 10: Go-Live Checklist

### Pre-Launch Final Check
- [ ] All environment variables configured
- [ ] Security migration applied successfully
- [ ] Admin user created and tested
- [ ] Email service working
- [ ] All security tests passing
- [ ] SSL certificate valid
- [ ] Domain properly configured
- [ ] Monitoring system active
- [ ] Backup system configured

### Launch Day Tasks
- [ ] Monitor application performance
- [ ] Watch for error logs
- [ ] Check email delivery
- [ ] Monitor security alerts
- [ ] Be ready for user support

### Post-Launch Monitoring
- [ ] Daily security monitoring
- [ ] User feedback collection
- [ ] Performance metrics tracking
- [ ] Regular security reviews

## Emergency Procedures

### Security Breach Response
1. **Immediate Actions**
   - Check audit logs for suspicious activity
   - Review recent admin actions
   - Monitor fraud alert dashboard
   - Consider rate limiting if needed

2. **Investigation**
   - Analyze attack vectors
   - Check data integrity
   - Review access logs
   - Document findings

3. **Recovery**
   - Apply security patches
   - Update credentials if compromised
   - Notify users if required
   - Strengthen security measures

### System Downtime Response
1. **Assessment**
   - Check server status
   - Verify database connectivity
   - Test third-party services
   - Review error logs

2. **Resolution**
   - Apply fixes as needed
   - Test functionality
   - Monitor performance
   - Communicate with users

## Support Resources

- **Supabase Support**: https://supabase.com/support
- **Resend Documentation**: https://resend.com/docs
- **SendGrid Documentation**: https://docs.sendgrid.com
- **Security Best Practices**: SECURITY_IMPLEMENTATION.md
- **Admin Guide**: admin-setup-guide.md

---

## 🎉 Congratulations!

Your PropMate platform is now securely deployed to production with enterprise-level security features:

✅ **Database Security** - Row Level Security protecting all user data
✅ **Authentication Security** - Strong passwords and rate limiting
✅ **Fraud Detection** - Automated monitoring and alerting
✅ **Audit Trail** - Complete logging of all actions
✅ **Email Automation** - Professional communication system
✅ **Admin Controls** - Secure administrative interface
✅ **Monitoring System** - Real-time security monitoring

Your platform is ready to serve users safely and securely! 🚀