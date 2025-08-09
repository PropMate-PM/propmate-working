# 🚀 Netlify Deployment Guide for PropMate

## **Step-by-Step Deployment Instructions**

### **Step 1: Create Netlify Account**

1. **Go to Netlify:** https://netlify.com
2. **Click "Sign Up"** (top right)
3. **Choose "Sign up with email"** or use Google/GitHub
4. **Complete registration** with your email and password

### **Step 2: Deploy Your Site**

#### **Option A: Drag & Drop (Easiest)**

1. **Open Netlify Dashboard** after logging in
2. **Drag and drop** the `dist` folder from your project
3. **Wait for deployment** (usually 30-60 seconds)
4. **Your site is live!** 🎉

#### **Option B: Connect GitHub (Recommended for updates)**

1. **Push your code to GitHub** (if you haven't already)
2. **In Netlify Dashboard:** Click "New site from Git"
3. **Choose GitHub** and authorize Netlify
4. **Select your repository:** `propcashback-platform-main`
5. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. **Click "Deploy site"**

### **Step 3: Configure Environment Variables**

1. **In Netlify Dashboard:** Go to your site settings
2. **Click "Environment variables"** (left sidebar)
3. **Add these variables:**

```
VITE_SUPABASE_URL=https://gwpbbzjqharvfuuxxuek.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGJiempxaGFydmZ1dXh4dWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTUzMDcsImV4cCI6MjA2OTE5MTMwN30.LSxPfuzvXOhY_leqIGm7DG7Frw1FLu_acqK6dRQ1g_k
RESEND_API_KEY=re_UCzh7CPC_MkQMg9owHZQ56ZqKtXbFbQYM
ADMIN_EMAIL=admin@propmate.com
ADMIN_PASSWORD=Yawar@Farooq#123
```

### **Step 4: Custom Domain (Optional)**

1. **In Netlify Dashboard:** Go to "Domain settings"
2. **Click "Add custom domain"**
3. **Enter your domain:** `propmate.com` (or your preferred domain)
4. **Follow DNS instructions** to point your domain to Netlify

### **Step 5: Test Your Live Site**

1. **Visit your Netlify URL** (something like `https://amazing-site-123.netlify.app`)
2. **Test admin login:**
   - Email: `admin@propmate.com`
   - Password: `Yawar@Farooq#123`
3. **Test user registration**
4. **Test cashback submission**

## **🔧 Troubleshooting**

### **If Admin Login Doesn't Work:**
- Check that environment variables are set correctly in Netlify
- Make sure the admin user exists in your Supabase database
- Try the password reset script again if needed

### **If Build Fails:**
- Check that all dependencies are in `package.json`
- Make sure the build command is `npm run build`
- Verify the publish directory is `dist`

### **If Site Shows Errors:**
- Check browser console for error messages
- Verify Supabase connection is working
- Test locally first to isolate issues

## **📊 Netlify Features You'll Get**

✅ **Automatic HTTPS** - Secure by default
✅ **Global CDN** - Fast loading worldwide
✅ **Form Handling** - Built-in form submissions
✅ **Analytics** - Visitor tracking
✅ **Preview Deployments** - Test changes before going live
✅ **Rollback** - Easy to revert to previous versions
✅ **Branch Deployments** - Deploy different branches

## **🎯 Next Steps After Deployment**

1. **Set up monitoring** - Enable Netlify Analytics
2. **Configure forms** - Set up form notifications
3. **Add custom domain** - Point your domain to Netlify
4. **Set up notifications** - Get alerts for deployments
5. **Monitor performance** - Use Netlify's built-in tools

## **📞 Support**

- **Netlify Docs:** https://docs.netlify.com
- **Netlify Support:** https://netlify.com/support
- **Community:** https://community.netlify.com

---

**Your PropMate platform will be live and ready for users! 🎉** 