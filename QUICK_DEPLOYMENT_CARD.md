# 🚀 Quick Deployment Card

## **Netlify Deployment - 5 Minutes**

### **Step 1: Create Account**
- Go to: https://netlify.com
- Sign up with email or GitHub

### **Step 2: Deploy**
- **Option A (Easiest):** Drag `dist` folder to Netlify
- **Option B (GitHub):** Connect GitHub repo → Build: `npm run build` → Publish: `dist`

### **Step 3: Environment Variables**
Add these in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://gwpbbzjqharvfuuxxuek.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGJiempxaGFydmZ1dXh4dWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTUzMDcsImV4cCI6MjA2OTE5MTMwN30.LSxPfuzvXOhY_leqIGm7DG7Frw1FLu_acqK6dRQ1g_k
RESEND_API_KEY=re_UCzh7CPC_MkQMg9owHZQ56ZqKtXbFbQYM
ADMIN_EMAIL=admin@propmate.site
ADMIN_PASSWORD=Yawar@Farooq#123
```

### **Step 4: Test**
- Visit your Netlify URL
- Login as admin: `admin@propmate.site` / `Yawar@Farooq#123`
- Test user features

### **Step 5: Custom Domain (Optional)**
- Add domain in Netlify Dashboard
- Update DNS records

---

**🎉 Your PropMate platform will be live!** 