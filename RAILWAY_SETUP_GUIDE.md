# Railway Deployment Guide - TomarsCloud Backend

## Quick Setup (3 minutes)

### 1. Create Railway Account
- Go to: https://railway.app
- Sign in with GitHub or email
- Authorize GitHub access

### 2. Create New Project
- Click: "Create New Project"
- Select: "Deploy from GitHub repo"
- Search: "tomarscloud"
- Click: "tomxr14/tomarscloud"
- Click: "Deploy"

### 3. Add Environment Variables
Railway will auto-start building. While it builds, add variables:

1. Go to: **Project Settings** → **Variables**
2. Click: **"Add Variable"**
3. Add these exactly:

```
Name: MONGODB_URI
Value: mongodb+srv://tomaranurag:Window$12@tomar.bllqvnm.mongodb.net/tomarscloud?retryWrites=true&w=majority&appName=tomar
```

```
Name: JWT_SECRET
Value: tomarscloud_secret_key_2026
```

```
Name: PORT
Value: (Railway will assign - leave blank or Railway auto-assigns)
```

```
Name: UPLOAD_DIR
Value: ./uploads
```

4. Click **"Deploy"**
5. Wait 2-3 minutes for build to complete

### 4. Get Your Public URL
- Go to: **Deployments** tab
- Find your active deployment
- Click it to see logs
- Find line like: `Server running on port 3000`
- Your URL will be: **https://tomarscloud-[random].railway.app**

### 5. Update Frontend
After you get your Railway URL, edit Dashboard.jsx:

**File**: https://github.com/tomxr14/tomarscloud/blob/main/Dashboard.jsx
**Line**: 4

Change from:
```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

To (replace with your Railway URL):
```javascript
const API_BASE = 'https://tomarscloud-[your-random-id].railway.app/api';
```

Save and commit. Cloudflare Pages auto-rebuilds.

---

## Testing Backend

Once deployed, test with:

```bash
# Test register
curl -X POST https://tomarscloud-[random].railway.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Test login
curl -X POST https://tomarscloud-[random].railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Common Issues

**Q: Build fails**
A: Check logs in Railway dashboard, usually missing environment variables

**Q: Files lost after restart**
A: Using in-memory fallback. Add MongoDB URI in variables for persistence.

**Q: Connection refused from frontend**
A: Make sure you updated Dashboard.jsx with correct Railway URL

**Q: Port already in use**
A: Railway manages ports. Don't set custom PORT, let it auto-assign.

---

## That's it! 

Your backend is now LIVE globally! 🚀
