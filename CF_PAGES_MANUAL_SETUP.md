# ⚡ CLOUDFLARE PAGES - AUTOMATED SETUP (3 MINUTES)

## Your Credentials (Pre-filled)
- Account ID: `3d75d8a96cd9f64955ff2a93467d9a3a`
- Email: `itomaranurag@gmail.com`
- GitHub Repo: `https://github.com/tomxr14/tomarscloud`
- API Key: Available

---

## 🎯 FOLLOW THESE EXACT STEPS:

### Step 1: Start Pages Setup
🔗 **Go here:** https://dash.cloudflare.com/3d75d8a96cd9f64955ff2a93467d9a3a/pages

(Already logged in as itomaranurag@gmail.com)

### Step 2: Create Project
1. Click **"Create a project"** button
2. Click **"Connect to Git"**
3. Click **"Authorize"** (will open GitHub)
4. Select **tomxr14/tomarscloud** repo
5. Click **"Begin setup"**

### Step 3: Configure (Copy-Paste These Settings)

**Project name:**
```
tomarscloud
```

**Production branch:**
```
main
```

**Framework preset:**
```
Vite
```

**Build command:**
```
npm run build
```

**Build output directory:**
```
dist
```

**Root directory:**
```
(leave blank - just click through)
```

### Step 4: Environment Variables

Click **"Save and Deploy"** BUT FIRST add environment variables:

1. After "Save and Deploy" is clicked, go to **Settings**
2. Environment Variables
3. Add this variable:
```
Name: VITE_API_URL
Value: http://localhost:3005/api
```
(We'll update this to the tunnel URL once backend is live)

### Step 5: Deploy
- Watch the **deployment log**
- Should complete in 2-3 minutes
- You'll see: **"Deployment successful!"**

---

## ✅ Success Indicators

After deployment completes:
- ✅ Visit: https://tomarscloud.pages.dev
- ✅ You see the **Login page**
- ✅ Site is live globally

---

## 🚀 After Deployment

**Reply with:** `Pages deployed`

Then I'll immediately set up **Cloudflare Tunnel** for the backend!

---

## Need Help?

If deployment fails:
- Check that node_modules directory wasn't too large (should build fine)
- Check build logs in Cloudflare Pages dashboard
- npm run build should work locally first

Try running locally:
```powershell
cd C:\tomarscloud-backend
npm run build
```

If that works, Pages will work! ✅
