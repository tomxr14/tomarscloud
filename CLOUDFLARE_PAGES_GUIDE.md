# Cloudflare Pages Deployment - TomarsCloud Frontend

## Quick Setup (3 minutes)

### 1. Access Cloudflare Pages
- Go to: https://pages.cloudflare.com
- Sign in with your Cloudflare account

### 2. Create New Project
- Click: "Create a project"
- Select: "Connect to Git"
- Authorize GitHub
- Search: "tomarscloud"
- Select: **tomxr14/tomarscloud**

### 3. Configure Build
The form auto-fills correctly:

```
Build command: npm run build
Output directory: dist
Root directory: (leave blank)
Framework: None
```

All auto-detected! Just click **"Save and Deploy"**

### 4. Wait for Deployment
- Cloudflare builds and deploys
- Takes 1-2 minutes
- You'll see your site at: **https://tomarscloud.pages.dev**

### 5. Update to Point to Live Backend
This is the CRITICAL step!

Go to: https://github.com/tomxr14/tomarscloud/edit/main/Dashboard.jsx

Find line 4:
```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

Change to your Railway backend URL:
```javascript
const API_BASE = 'https://tomarscloud-[your-id].railway.app/api';
```

**Commit the change** → Cloudflare auto-rebuilds (~1 minute)

---

## Testing Frontend

1. Visit: **https://tomarscloud.pages.dev**
2. Create account
3. Login
4. Upload a file
5. Try share, trash, search, sort

Everything should work! ✅

---

## Environment Variables (Optional)

If you want to use environment variables instead of hardcoding URL:

1. Go to **Pages project** → **Settings** → **Environment**
2. Add variable:
   ```
   Name: VITE_API_URL
   Value: https://tomarscloud-[id].railway.app/api
   ```
3. Update Dashboard.jsx:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
   ```
4. Redeploy

---

## Troubleshooting

**Q: Build fails**
A: Most likely missing node_modules. Run `npm install` in GitHub before deploying, or Cloudflare handles it automatically.

**Q: "Cannot find module" error**
A: Check package.json has all dependencies. Should be fine - all are included.

**Q: Frontend loads but API calls fail**
A: Dashboard.jsx API_BASE URL is wrong. Must point to live Railway backend.

**Q: Domain 404?**
A: Wait a few minutes for DNS propagation. Try refreshing.

---

## Custom Domain (Optional)

Want your own domain? 

1. In Cloudflare Pages project → **Custom domains**
2. Add your domain (must be on Cloudflare)
3. Points auto-configure
4. Takes 5-10 minutes

Then access at: **https://yourdomain.com** instead of pages.dev

---

## Auto-Redeploy on Push

Cloudflare auto-rebuilds whenever you push to GitHub main branch!

No manual redeploy needed. Every commit = automatic new build.

---

## That's it!

Your frontend is LIVE at: **https://tomarscloud.pages.dev** 🎉
