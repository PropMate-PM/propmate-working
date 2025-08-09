# 🚀 PropMate Production Quick Start

## ⚡ 5-Minute Production Deployment

### 1. Environment Setup (2 minutes)
```bash
# Copy and configure environment
cp environment-template.env .env.local

# Edit .env.local with your values:
# - VITE_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY  
# - VITE_SUPABASE_ANON_KEY
# - ADMIN_EMAIL & ADMIN_PASSWORD
# - RESEND_API_KEY or SENDGRID_API_KEY
```

### 2. Security Setup (2 minutes)
```bash
# Install dependencies and apply security migration
npm install
npm run setup:production
```

### 3. Testing & Deployment (1 minute)
```bash
# Run security tests and build
npm run deploy:check

# Deploy to your platform
npm run build:production
# Then upload 'dist' folder to your hosting
```

## 🎯 Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run setup:production` | Apply migration & create admin user |
| `npm run test:security` | Run comprehensive security tests |
| `npm run monitor:security` | Start real-time security monitoring |
| `npm run deploy:check` | Pre-deployment validation |

## ✅ Deployment Checklist

### Before Going Live
- [ ] Environment variables configured
- [ ] Security migration applied (`npm run setup:production`)
- [ ] Security tests passing (`npm run test:security`)
- [ ] Admin login tested
- [ ] Email service working
- [ ] SSL certificate installed
- [ ] Domain configured

### After Going Live
- [ ] Start monitoring (`npm run monitor:security`)
- [ ] Test user registration/login
- [ ] Verify fraud detection working
- [ ] Check audit logging
- [ ] Monitor performance

## 🚨 Security Features Active

✅ **Row Level Security** - Users isolated from each other  
✅ **Admin Role System** - Proper privilege management  
✅ **Fraud Detection** - Automated suspicious activity alerts  
✅ **Rate Limiting** - Protection against abuse  
✅ **Audit Logging** - Complete action tracking  
✅ **Email Security** - Professional communication system  
✅ **Input Validation** - XSS and injection prevention  
✅ **Password Security** - Strong password requirements  

## 🔧 Troubleshooting

### Migration Issues
```bash
# Manual migration via Supabase dashboard
# Copy contents of: supabase/migrations/20250102000000_critical_security_fixes.sql
# Execute in Supabase SQL Editor
```

### Admin Access Issues
```sql
-- Check admin user exists
SELECT id, email FROM auth.users WHERE email = 'admin@propmate.com';

-- Assign admin role (replace USER_ID)
INSERT INTO admin_roles (user_id, role, is_active) 
VALUES ('USER_ID_HERE', 'super_admin', true);
```

### Email Issues
- Check API key configuration
- Verify FROM_EMAIL domain
- Test with mock service first

## 📞 Support Resources

- **Complete Guide**: [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
- **Security Details**: [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)
- **Admin Setup**: [admin-setup-guide.md](admin-setup-guide.md)

---

## 🎉 You're Ready!

Your PropMate platform now has **enterprise-level security** and is ready for production use!

**Admin Login**: Use the email/password you configured  
**User Registration**: Open to public with full security protection  
**Monitoring**: Available via `npm run monitor:security`  

**Go live with confidence!** 🚀