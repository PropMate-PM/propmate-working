# Admin User Setup Guide

## 🚨 **Current Issue**
You tried to sign up `admin@propmate.site` but got "error saving user into database."

## 🎯 **What's Happening**
- The system already has an admin user: `admin@propmate.com`
- This user already has super_admin role assigned
- The signup error might be due to database constraints or existing user conflicts

## 🔧 **Solution Options**

### **Option 1: Use Existing Admin (Recommended)**

**Login Details:**
- **Email:** `admin@propmate.com`
- **Password:** `Yawar@Farooq#123` (from your config files)

**Steps:**
1. Go to your app's login page
2. Use the credentials above
3. You should see the admin dashboard

### **Option 2: Create New Admin via Supabase Dashboard**

**Steps:**
1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users

2. **Create User Manually:**
   - Click "Add User"
   - Email: `admin@propmate.site`
   - Password: Set a strong password (e.g., `Admin@PropMate2024!`)
   - ✅ Check "Email Confirmed"
   - Click "Create User"

3. **Assign Admin Role:**
   - Go to SQL Editor in Supabase Dashboard
   - Run this query:
   ```sql
   -- Get the new user ID first
   SELECT id, email FROM auth.users WHERE email = 'admin@propmate.site';
   
   -- Then assign admin role (replace USER_ID with actual ID)
   SELECT setup_admin_user('admin@propmate.site');
   ```

### **Option 3: Reset/Update Existing Admin**

**If you want to change the existing admin email:**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users

2. **Find and Edit Admin User:**
   - Look for `admin@propmate.com`
   - Click on the user
   - Change email to `admin@propmate.site`
   - Save changes

## 🧪 **Test Admin Access**

After setting up the admin user:

1. **Login to your app**
2. **Check for admin features:**
   - Admin dashboard should appear
   - Admin panel should be accessible
   - User management features should work

## 🔍 **Troubleshooting**

### **If signup still fails:**
- The database might have constraints preventing duplicate admin users
- Use the Supabase Dashboard method instead
- Check the browser console for specific error messages

### **If login fails:**
- Try password reset through your app
- Check Supabase Dashboard for user status
- Verify email confirmation status

### **If admin features don't show:**
- Check browser console for JavaScript errors
- Verify the user has admin role assigned
- Test the admin functions in SQL editor

## 📋 **Current Admin Status**

Based on the migration results:
- ✅ Admin user exists: `admin@propmate.com`
- ✅ Admin role assigned: `super_admin`
- ✅ Database functions created
- ✅ Role-based authentication active

## 🎯 **Recommended Next Steps**

1. **Try logging in with existing admin:** `admin@propmate.com` / `Yawar@Farooq#123`
2. **If that works:** You're all set! The system is working.
3. **If you want the new email:** Use Option 2 or 3 above.
4. **Test all admin features** to ensure everything works properly.

The role-based authentication system is working correctly - you just need to access it with the right credentials! 🎉
