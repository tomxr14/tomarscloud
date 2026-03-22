# Cloudflare Pages + Tunnel Deployment for TomarsCloud

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              CLOUDFLARE GLOBAL NETWORK                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐              ┌──────────────────┐ │
│  │ Cloudflare      │              │ Cloudflare       │ │
│  │ Pages           │──────────┐───│ Tunnel           │ │
│  │ (React Frontend)│          │   │ (Backend Proxy)  │ │
│  │ tomarscloud.    │          │   └──────────┬───────┘ │
│  │pages.dev        │          │              │         │
│  └─────────────────┘          │         Encrypted      │
│                               │         Tunnel to      │
│                               │         Laptop         │
│                               │                        │
│                               └────────────────────────┤
└──────────────────────────────────────────────────────────

                    🌍 Accessible Globally
                         from Phone
```

---

## OPTION 1: Frontend on Cloudflare Pages (EASIEST)

### Prerequisites
- GitHub repo with code (tomarscloud-backend)
- Cloudflare account (free tier OK)
- Domain setup (we'll use tomarscloud.pages.dev)

### Step 1: Connect GitHub to Cloudflare Pages

1. **Go to:** https://dash.cloudflare.com
2. **Select:** Pages → "Create a project"
3. **Connect GitHub:** Select your `tomarscloud` repo
4. **Build settings:**
   - **Framework:** Vite (or React)
   - **Build Command:** `npm run build`
   - **Build Output:** `dist/`
   - **Root Directory:** (leave blank)

5. **Environment Variables:**
   ```
   VITE_API_URL=https://api.tomarscloud.com
   ```
   (We'll link backend in Step 2)

6. **Deploy!** Cloudflare auto-builds and deploys to:
   ```
   https://tomarscloud.pages.dev
   ```

---

## OPTION 2: Backend via Cloudflare Tunnel (EXPOSING YOUR LAPTOP)

### This allows your local Node.js server to be accessible globally

### Step 1: Install Cloudflare Tunnel CLI

```powershell
# Download cloudflared
$url = "https://github.com/cloudflare/cloudflared/releases/download/2025.3.0/cloudflared-windows-amd64.msi"
$output = "$env:USERPROFILE\cloudflared-installer.msi"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process $output -Wait

# Verify installation
cloudflared --version
```

### Step 2: Authenticate with Cloudflare

```powershell
cloudflared login
```

This opens a browser → Authorize → Saves cert to `%APPDATA%\cloudflared`

### Step 3: Create Tunnel for Backend

```powershell
# Create tunnel
cloudflared tunnel create tomarscloud-api

# You'll see:
# Tunnel ID: xxxxxxxxxxxxxxxx-xxxxxxxxxxxx
# Tunnel name: tomarscloud-api

# Configure tunnel
echo """
url: http://localhost:3005
""" > %APPDATA%\cloudflared\config.yml

# Create DNS record (via cloudflare dashboard)
# subdomain: api.tomarscloud.com → Your tunnel

# Start tunnel (runs indefinitely)
cloudflared tunnel run tomarscloud-api
```

### Step 4: Link Frontend → Backend API

Update React environment file:

**Create `.env.production` in project root:**
```
VITE_API_URL=https://api.tomarscloud.com/api
```

This makes your frontend (on Pages) call backend (via Tunnel)

---

## OPTION 3: Full Deployment Summary

### What's Public:
✅ Frontend: `https://tomarscloud.pages.dev`  
✅ Backend: `https://api.tomarscloud.com` (via tunnel)  
✅ Status: **GLOBAL ACCESS** - Works from any phone/location  

### What's Private:
🔒 Your Windows laptop runs Node.js locally  
🔒 Cloudflare tunnel encrypts traffic  
🔒 .env NOT public (secrets stay safe)  

### Cost:
- ✅ Cloudflare Pages: **FREE** (unlimited bandwidth)
- ✅ Cloudflare Tunnel: **FREE** (up to 3 tunnels)
- ✅ Node.js server: **FREE** (runs on your laptop)
- ✅ MongoDB: **FREE** (we use in-memory fallback)

---

## Testing After Deployment

### Test Frontend (from Phone)
```
Open browser → https://tomarscloud.pages.dev
Register → test@phone.com / Password123
Login → Should show Dashboard
Upload file → Should store in C:\tomarscloud-backend\uploads
```

### Test Backend API (from Terminal)
```powershell
# Register
curl -X POST https://api.tomarscloud.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'

# Should return: { message: "User registered successfully", ... }
```

---

## Complete Deployment Checklist

- [ ] GitHub repo created and code pushed
- [ ] Frontend deployed to Cloudflare Pages
- [ ] Backend tunnel created via cloudflared
- [ ] Frontend `.env.production` configured
- [ ] Backend responding via tunnel
- [ ] Tested register/login from phone
- [ ] Tested file upload/download
- [ ] Cloudflare analytics dashboard shows traffic

---

## Starting Everything (After Setup)

### Terminal 1: Start Backend
```powershell
cd C:\tomarscloud-backend
$env:PORT=3005; node server.js
```

### Terminal 2: Start Tunnel
```powershell
cloudflared tunnel run tomarscloud-api
```

### Then Access From Phone:
```
https://tomarscloud.pages.dev
```

---

## Troubleshooting

**Problem:** "Tunnel not connecting"  
**Solution:** 
```powershell
cloudflared tunnel list
cloudflared tunnel status tomarscloud-api
```

**Problem:** "Frontend can't reach backend API"  
**Solution:**
- Check `.env.production` has correct URL
- Verify tunnel is running: `cloudflared tunnel run`
- Check Cloudflare dashboard → DNS records

**Problem:** "Get 403 Unauthorized from API"  
**Solution:**
- Make sure JWT token is in `Authorization: Bearer <token>` header
- Check token hasn't expired (expires in 7 days)

---

## Need Custom Domain?

If you own `tomarscloud.com`:

1. Add nameservers to your domain registrar (Cloudflare tells you which ones)
2. In Cloudflare, create DNS records:
   - `tomarscloud.com` → Pages (auto-configured)
   - `api.tomarscloud.com` → Your tunnel

Then use: `https://api.tomarscloud.com` instead of `api.tomarscloud.pages.dev`

---

**🚀 After this, your app is LIVE GLOBALLY!**
