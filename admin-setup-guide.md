# PropMate Admin Setup Guide

## Initial Admin User Creation

### Method 1: Using the Setup Script (Recommended)

1. **Set Environment Variables**
   ```bash
   # Copy the environment template
   cp environment-template.env .env.local
   
   # Edit .env.local with your actual values
   VITE_SUPABASE_URL=https://gwpbbzjqharvfuuxxuek.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGJiempxaGFydmZ1dXh4dWVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYxNTMwNywiZXhwIjoyMDY5MTkxMzA3fQ.yNUrn4tEYA0v1Q5TS8syCLVOUX9XGP3RIt3f4tpFhps
   ADMIN_EMAIL=admin@propmate.com
   ADMIN_PASSWORD=Yawar@Farooq#123
   ```

2. **Run the Setup Script**
   ```bash
   node setup-production.js
   ```

   This will:
   - Apply the security migration
   - Create the super admin user
   - Assign admin roles
   - Test security functions
   - Verify the setup

### Method 2: Manual Admin Creation

If the script doesn't work, you can create the admin user manually:

1. **Create User in Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Users
   - Click "Add User"
   - Enter email: `admin@propmate.com`
   - Set a strong password
   - Enable "Email Confirmed"

2. **Assign Admin Role via SQL**
   ```sql
   -- Get the user ID first
   SELECT id, email FROM auth.users WHERE email = 'admin@propmate.com';
   
   -- Insert admin role (replace USER_ID with actual ID)
   INSERT INTO admin_roles (user_id, role, granted_by, is_active)
   VALUES ('USER_ID_HERE', 'super_admin', 'USER_ID_HERE', true);
   ```

3. **Verify Admin Access**
   ```sql
   -- Test admin function
   SELECT is_admin('USER_ID_HERE');
   -- Should return true
   
   SELECT get_admin_role('USER_ID_HERE');
   -- Should return 'super_admin'
   ```

## Admin User Management

### Creating Additional Admin Users

1. **Regular Admin User**
   ```sql
   -- After creating user in Supabase Auth
   INSERT INTO admin_roles (user_id, role, granted_by, is_active)
   VALUES ('NEW_USER_ID', 'admin', 'GRANTING_ADMIN_ID', true);
   ```

2. **Moderator User**
   ```sql
   INSERT INTO admin_roles (user_id, role, granted_by, is_active)
   VALUES ('NEW_USER_ID', 'moderator', 'GRANTING_ADMIN_ID', true);
   ```

### Admin Role Hierarchy

- **super_admin**: Full system access, can manage other admins
- **admin**: Can process requests, view analytics, manage users
- **moderator**: Limited access for review tasks only

### Deactivating Admin Users

```sql
-- Deactivate an admin user
UPDATE admin_roles 
SET is_active = false, updated_at = now()
WHERE user_id = 'USER_ID_TO_DEACTIVATE';
```

## Admin Login Testing

### Test Admin Login Process

1. **Frontend Login Test**
   - Go to your PropMate login page
   - Enter admin credentials
   - Verify admin dashboard access
   - Check admin-only features are visible

2. **Permission Testing**
   ```javascript
   // Test in browser console after admin login
   import { isAdmin, hasAdminPermission } from './src/lib/auth.js';
   
   // Should return true for admin user
   await isAdmin();
   
   // Should return true for super_admin
   await hasAdminPermission('admin');
   ```

3. **Database Access Test**
   - Try to access admin-only data
   - Verify RLS policies work correctly
   - Test bulk operations

## Security Verification Checklist

### ✅ Admin Access Control
- [ ] Admin user can log in successfully
- [ ] Admin dashboard loads with all features
- [ ] Non-admin users cannot access admin features
- [ ] Admin role hierarchy works correctly
- [ ] Admin actions are logged in audit_log

### ✅ Database Security
- [ ] RLS policies prevent unauthorized access
- [ ] Admin functions work correctly
- [ ] Fraud detection functions operational
- [ ] Rate limiting tables accessible
- [ ] Audit logging captures all events

### ✅ Email System
- [ ] Welcome emails send correctly
- [ ] Status change emails work
- [ ] Admin notification emails function
- [ ] Email logging to database works
- [ ] Bulk email functionality tested

### ✅ Fraud Detection
- [ ] Duplicate wallet detection works
- [ ] Duplicate proof detection works
- [ ] Rate limiting functions
- [ ] High amount alerts trigger
- [ ] Suspicious IP detection works

## Troubleshooting Common Issues

### Admin User Cannot Login
1. Check if email is confirmed in Supabase Auth
2. Verify admin_roles table has correct entry
3. Check RLS policies are not blocking access
4. Verify environment variables are correct

### Admin Dashboard Not Loading
1. Check browser console for JavaScript errors
2. Verify admin role checking functions
3. Check network tab for API failures
4. Ensure all required tables exist

### Email System Not Working
1. Verify email service API keys
2. Check email provider configuration
3. Test with mock email service first
4. Check email logging in database

### Database Migration Issues
1. Apply migration manually via Supabase dashboard
2. Check for existing tables/functions
3. Verify service role key permissions
4. Review migration SQL for syntax errors

## Production Deployment Steps

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Admin user created and tested
- [ ] Email service configured
- [ ] Security features tested
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring set up

### Post-Deployment Verification
- [ ] Admin login works in production
- [ ] All security features functional
- [ ] Email system sending correctly
- [ ] Database queries performing well
- [ ] Audit logging working
- [ ] Fraud detection active
- [ ] Rate limiting effective

## Maintenance Procedures

### Daily Tasks
- Review new fraud alerts
- Check system health dashboard
- Monitor email delivery rates
- Review audit logs for anomalies

### Weekly Tasks
- Review and resolve open fraud alerts
- Analyze admin dashboard analytics
- Check for failed email deliveries
- Review user feedback and issues

### Monthly Tasks
- Security audit and review
- Database performance optimization
- Email template updates
- Admin user access review

### Quarterly Tasks
- Comprehensive security assessment
- Fraud detection threshold review
- Email service provider evaluation
- System backup verification

## Emergency Procedures

### Suspected Security Breach
1. Immediately check audit logs
2. Review recent admin actions
3. Check for unusual fraud alerts
4. Monitor suspicious user activity
5. Consider temporary rate limiting
6. Document and investigate

### System Downtime
1. Check database connectivity
2. Verify email service status
3. Review server logs
4. Check SSL certificate status
5. Monitor third-party services
6. Communicate with users if needed

### Data Recovery
1. Access latest database backup
2. Review audit logs for data changes
3. Coordinate with Supabase support
4. Test recovery procedures
5. Verify data integrity
6. Update security measures

---

## Support and Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Security Best Practices**: See SECURITY_IMPLEMENTATION.md
- **Email Provider Docs**: Resend.com or SendGrid documentation
- **PropMate Admin Guide**: This document

For technical support, contact your development team or refer to the comprehensive security documentation.