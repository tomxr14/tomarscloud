# 🚀 CLOUDFLARE TUNNEL - BACKEND SETUP

## What This Does
Exposes your local **Node.js server** (running on port 3005) to the internet as:
```
https://api.tomarscloud.com
```

Anyone worldwide can access your backend without port forwarding! ✅

---

## INSTALLATION & SETUP (10 minutes)

### Step 1: Download cloudflared

```powershell
# Create temp folder
$tempDir = "$env:USERPROFILE\Downloads\cloudflared"
if(!(Test-Path $tempDir)){mkdir $tempDir}

# Download latest cloudflared
$url = "https://github.com/cloudflare/cloudflared/releases/download/2025.3.0/cloudflared-windows-amd64.msi"
$installer = "$env:USERPROFILE\Downloads\cloudflared-installer.msi"
(New-Object Net.WebClient).DownloadFile($url, $installer)

# Run installer (follow prompts)
Start-Process $installer -Wait
```

### Step 2: Verify Installation

```powershell
cloudflared --version
# Should output: cloudflared version X.X.X
```

### Step 3: Authenticate with Cloudflare

```powershell
cloudflared login
```

This will:
1. Open your browser
2. Ask to authorize (click "Authorize")
3. Save certificate to `%APPDATA%\cloudflared\config.yml`

### Step 4: Create Tunnel

```powershell
cloudflared tunnel create tomarscloud-api
```

You'll see output like:
```
Tunnel credentials written to: C:\Users\YourName\AppData\Roaming\cloudflared\tomarscloud-api.json
Tunnel ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Tunnel name: tomarscloud-api
```

**Copy the Tunnel ID** - you'll need it in Step 6.

### Step 5: Configure Tunnel

Create config file at: `%APPDATA%\cloudflared\config.yml`

**OR run this:**

```powershell
$configPath = "$env:APPDATA\cloudflared\config.yml"
$config = @"
tunnel: tomarscloud-api
credentials-file: $env:APPDATA\cloudflared\tomarscloud-api.json

ingress:
  - hostname: api.tomarscloud.com
    service: http://localhost:3005
  - service: http_status:404
"@
$config | Out-File -FilePath $configPath -Encoding utf8
```

### Step 6: Route Traffic to Tunnel

Go to Cloudflare dashboard:

1. **Left sidebar:** Cloudflare Tunnel → tomarscloud-api
2. **Public Hostname** tab → **"Create public hostname"**
3. **Subdomain:** `api`
4. **Domain:** Choose your domain (or `tomarscloud.com`)
5. **Service:** http://localhost:3005
6. Click **"Save"**

---

## START THE TUNNEL

### Terminal 1: Start Backend Server

```powershell
cd C:\tomarscloud-backend
$env:PORT=3005
node server.js
```

Output should show:
```
🚀 TomarsCloud Backend Running
📍 http://localhost:3005
💾 Database: IN-MEMORY 📝
```

### Terminal 2: Start Cloudflare Tunnel

```powershell
cloudflared tunnel run tomarscloud-api
```

Output should show:
```
2026-03-22T12:00:00Z INF Thank you for trying Cloudflare Tunnel. Improvements and bugs should be reported at https://github.com/cloudflare/cloudflared/issues/new/choose
2026-03-22T12:00:00Z INF Tunnel registered successfully with id XXXXXXXX
2026-03-22T12:00:00Z INF Each request from your origin is now authenticated with the certificate in the file...
```

---

## ✅ TEST IT

Now your backend is live!

```powershell
# Test registration
curl -X POST https://api.tomarscloud.com/api/register `
  -H "Content-Type: application/json" `
  -d '{"email":"testapi@example.com","password":"TestPassword123"}'

# Should return: { "message": "User registered successfully", ... }
```

---

## 🔗 UPDATE FRONTEND

Once tunnel is running, update the frontend environment:

In Cloudflare Pages settings:
```
VITE_API_URL = https://api.tomarscloud.com/api
```

Then redeploy frontend (Pages will auto-rebuild)

---

## 🚨 TROUBLESHOOTING

**Tunnel won't start?**
```powershell
cloudflared tunnel list
cloudflared tunnel status tomarscloud-api
```

**Backend not responding?**
```powershell
# Verify backend is running:
node C:\tomarscloud-backend\server.js

# Check if port 3005 is listening:
netstat -ano | findstr :3005
```

**API returns 404?**
- Check tunnel config has correct hostname and service
- Verify backend is actually running
- Check firewall isn't blocking

---

## 🎉 YOU'RE DONE!

Your app is now **FULLY DEPLOYED GLOBALLY:**
- ✅ Frontend: https://tomarscloud.pages.dev
- ✅ Backend: https://api.tomarscloud.com
- ✅ Database: In-memory (works worldwide)

**Share this link with friends:**
```
https://tomarscloud.pages.dev
```

---

**After you've done this, reply:** `Tunnel running`

And I'll help you test everything end-to-end! 🚀
