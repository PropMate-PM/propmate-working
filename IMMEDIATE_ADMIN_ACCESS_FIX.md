# 🚨 IMMEDIATE FIX: Get Admin Access Right Now

## 🎯 **The Problem**
Password reset emails show "Page not found" because Supabase redirect URLs aren't configured correctly.

## ⚡ **FASTEST SOLUTION: Manual Password Reset**

### **Step 1: Reset Admin Password in Supabase Dashboard**

**Do this RIGHT NOW to get admin access:**

1. **Open this link:** https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/users

2. **Find the admin user:**
   - Look for email: `admin@propmate.com`
   - (This is your current admin user)

3. **Click on the admin user**

4. **Reset the password:**
   - Look for "Reset Password" or "Change Password" option
   - Set new password to: `Admin@PropMate2024!`
   - Save the changes

5. **Login to your website:**
   - Go to: https://propmate.site
   - Click "Sign In"
   - Email: `admin@propmate.com`
   - Password: `Admin@PropMate2024!`
   - You should now have admin access! ✅

## 🔧 **Step 2: Fix Email Reset Links (Optional)**

**To fix the "page not found" error for future password resets:**

1. **In the same Supabase dashboard, go to:**
   https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/auth/url-configuration

2. **Update these settings:**
   
   **Site URL:**
   ```
   https://propmate.site
   ```
   
   **Add to Redirect URLs:**
   ```
   https://propmate.site/reset-password.html
   https://propmate.site/auth/reset-password.html
   https://propmate.site
   ```

3. **Save changes**

## 🧪 **Test Everything**

### **Test 1: Admin Login**
1. Go to your website
2. Sign in with `admin@propmate.com` / `Admin@PropMate2024!`
3. Should see admin dashboard ✅

### **Test 2: Password Reset (After Step 2)**
1. Sign out
2. Click "Forgot Password"
3. Enter any email
4. Check if email link works (should not show "page not found")

## 🎯 **Why This Happened**

The issue is with Supabase configuration:
- **Your site:** `https://propmate.site` (HTTPS)
- **Supabase config:** `http://propmate.site` (HTTP)
- **Result:** Redirects fail due to protocol mismatch

## ✅ **Summary**

**IMMEDIATE ACCESS:** Use Step 1 above to login as admin right now.

**LONG-TERM FIX:** Complete Step 2 to fix email reset links for the future.

**Your admin credentials after Step 1:**
- Email: `admin@propmate.com`
- Password: `Admin@PropMate2024!`

**This will get you back into your admin dashboard immediately!** 🚀
