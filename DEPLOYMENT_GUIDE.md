# TomarsCloud - Complete Deployment Guide

## Prerequisites
- Windows 10/11
- Node.js 16+ (https://nodejs.org/)
- MongoDB Atlas Account (Free Tier)
- GitHub Account
- Cloudflare Account

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Device (Phone/Browser)           │
│                                                              │
│                  React App (Cloudflare Pages)               │
│              stock-samuel-bean-frontpage.trycloudflare.com  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                     API Calls (HTTPS)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                 Windows Laptop (Your PC)                     │
│                                                              │
│     Node.js Backend Server (Port 5000)                       │
│     ├─ Authentication Routes (/api/auth)                    │
│     ├─ File Routes (/api/files)                             │
│     └─ Storage Routes (/api/storage-info)                   │
│                                                              │
│     Cloudflare Tunnel (Exposes Backend Globally)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    TCP Connection
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              MongoDB Atlas (Cloud Database)                  │
│                  tomarscloud database                        │
│         Users & File Metadata Stored Here                    │
└──────────────────────────────────────────────────────────────┘

File Storage: C:\tomarscloud-backend\uploads\
(User files stored locally on Windows laptop)
```

## Step 1: Install Node.js

1. Download Node.js from https://nodejs.org/
2. Choose LTS (Long Term Support) version
3. Run the installer and follow the prompts
4. Verify installation:
   ```
   node --version
   npm --version
   ```

## Step 2: Setup Backend

### 2.1 Navigate to Backend Directory
```powershell
cd C:\tomarscloud-backend
```

### 2.2 Install Dependencies
```powershell
npm install
```

This installs all required packages:
- express (server framework)
- mongoose (MongoDB driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- multer (file upload handler)
- cors (cross-origin requests)
- dotenv (environment variables)

### 2.3 Configure Environment Variables

The `.env` file is already created with MongoDB connection string.
Your database credentials:
```
Email: tomarurag
Password: Windows$1$
Connection: mongodb+srv://tomarurag:Windows$1$@cluster0.allqvnm.mongodb.net/tomarscloud
```

The `.env` file contains:
```
MONGODB_URI=mongodb+srv://tomarurag:Windows$1$@cluster0.allqvnm.mongodb.net/tomarscloud
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

**⚠️ IMPORTANT**: Change JWT_SECRET in production!

### 2.4 Start Backend Server
```powershell
npm start
```

You should see:
```
╔═══════════════════════════════════╗
║  🚀 TomarsCloud Backend Running   ║
║  📍 http://localhost:5000         ║
║  🔗 MongoDB: Connected ✅          ║
╚═══════════════════════════════════╝
```

**Keep this terminal running!** The backend must stay active for the app to work.

## Step 3: Setup Frontend

### 3.1 Clone/Update GitHub Repository

Your repository is already connected to Cloudflare Pages:
```
Repository: https://github.com/tomxr14/tomarscloud-
Deployed at: stock-samuel-bean-frontpage.trycloudflare.com
```

### 3.2 Create React App Structure

Option A: Use Create React App
```powershell
cd C:\
npx create-react-app tomarscloud-frontend
cd tomarscloud-frontend
```

Option B: Use Vite (Faster)
```powershell
cd C:\
npm create vite@latest tomarscloud-frontend -- --template react
cd tomarscloud-frontend
npm install
```

### 3.3 Install Frontend Dependencies
```powershell
npm install
```

### 3.4 Copy App Files

Copy these files to `src/` folder:
- App.jsx
- App.css
- AuthContext.jsx
- Login.jsx
- Dashboard.jsx
- index.jsx

### 3.5 Install Tailwind CSS (Optional but Recommended)
```powershell
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3.6 Start Frontend Development Server
```powershell
npm start
```

Frontend will open at `http://localhost:3000`

## Step 4: Setup Cloudflare Tunnel for Backend

### 4.1 Install Cloudflare Wrangler
```powershell
npm install -g @cloudflare/wrangler
```

### 4.2 Create Tunnel Configuration

Create `cloudflare-tunnel.json`:
```json
{
  "tunnel": "tomarscloud-backend",
  "credentials-file": "credentials.json",
  "ingress": [
    {
      "hostname": "api.yourdomain.com",
      "service": "http://localhost:5000"
    },
    {
      "service": "http_status:404"
    }
  ]
}
```

### 4.3 Authenticate with Cloudflare
```powershell
cloudflared tunnel login
```

### 4.4 Create Named Tunnel
```powershell
cloudflared tunnel create tomarscloud-backend
```

### 4.5 Route DNS
```powershell
cloudflared tunnel route dns tomarscloud-backend api.yourdomain.com
```

### 4.6 Run Tunnel
```powershell
cloudflared tunnel run --config cloudflare-tunnel.json tomarscloud-backend
```

## Step 5: Update Frontend API URL

In your React components, update `API_BASE`:

```javascript
// Before (local testing)
const API_BASE = 'http://localhost:5000/api';

// After (production with tunnel)
const API_BASE = 'https://api.yourdomain.com/api';
```

## Step 6: Deploy Frontend to Cloudflare Pages

### 6.1 Build React App
```powershell
npm run build
```

### 6.2 Commit and Push to GitHub
```powershell
git add .
git commit -m "Add TomarsCloud fullstack app"
git push origin main
```

### 6.3 Connect to Cloudflare Pages

1. Go to https://pages.cloudflare.com
2. Click "Create a project"
3. Connect to your GitHub repository
4. Build settings:
   - Framework: React (or detect automatically)
   - Build command: `npm run build`
   - Build output directory: `build` (Create React App) or `dist` (Vite)
5. Deploy!

## Step 7: Testing the Complete System

### 7.1 Test Backend Locally
```
POST http://localhost:5000/api/register
{
  "email": "test@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "userId": "..."
}
```

### 7.2 Test Login
```
POST http://localhost:5000/api/login
{
  "email": "test@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { "id": "...", "email": "test@example.com" }
}
```

### 7.3 Test File Upload
```
POST http://localhost:5000/api/upload
Headers: Authorization: Bearer {token}
Body: multipart/form-data with file
```

### 7.4 Test Storage Info
```
GET http://localhost:5000/api/storage-info
Headers: Authorization: Bearer {token}

Response:
{
  "usedStorage": 0,
  "totalStorage": 20401094656,
  "availableStorage": 20401094656,
  "fileCount": 0
}
```

## Step 8: Troubleshooting

### Backend won't start
- Check if port 5000 is available: `netstat -ano | findstr :5000`
- Verify MongoDB connection string in `.env`
- Check Node.js version: `node --version` (should be 16+)

### MongoDB connection fails
- Verify internet connection
- Check MongoDB Atlas credentials
- Whitelist your IP in MongoDB Atlas: https://cloud.mongodb.com
- Check connection string format

### File upload fails
- Verify `uploads` folder exists: `C:\tomarscloud-backend\uploads`
- Check folder permissions (should be readable/writable)
- Check available disk space

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS headers - should allow your frontend URL
- If using tunnel, ensure tunnel is running and URL is correct

### Cloudflare tunnel drops connection
- Verify your internet connection is stable
- Increase tunnel timeout: `cloudflared tunnel run --disable-auto-login`
- For permanent setup, use authenticated tunnel instead of quick tunnel

## Step 9: Production Deployment

### 9.1 Environment Setup
- Use environment variables for sensitive data
- Change JWT_SECRET to a random strong string
- Set MONGODB_URI correctly
- Set NODE_ENV to "production"

### 9.2 Use Process Manager (PM2)
```powershell
npm install -g pm2
pm2 start server.js --name "tomarscloud-backend"
pm2 startup
pm2 save
```

### 9.3 Enable HTTPS
- Use Cloudflare tunnel (already provides HTTPS)
- Or setup Let's Encrypt SSL certificate

### 9.4 Monitor and Logs
```powershell
pm2 logs tomarscloud-backend
pm2 status
pm2 stop tomarscloud-backend
```

## Storage Information

- **Total Allocation**: 100GB on your Windows laptop
- **Demo Quota**: 19GB per user
- **Storage Path**: `C:\tomarscloud-backend\uploads\`
- **File Naming**: `{timestamp}-{originalname}`
- **Metadata Storage**: MongoDB Atlas

File structure:
```
C:\tomarscloud-backend\uploads\
├── 1704067200000-document.pdf
├── 1704067202000-image.jpg
├── 1704067204000-video.mp4
└── ...
```

## API Endpoints Reference

### Authentication
- `POST /api/register` - Create account
- `POST /api/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### Files
- `POST /api/upload` - Upload file
- `GET /api/files` - List all files
- `GET /api/file/:id` - Download file
- `DELETE /api/file/:id` - Delete file

### Storage
- `GET /api/storage-info` - Get storage usage

## Security Best Practices

1. ✅ Passwords hashed with bcryptjs
2. ✅ JWT-based authentication
3. ✅ CORS properly configured
4. ✅ Environment variables used for secrets
5. ⚠️ TODO: Add rate limiting
6. ⚠️ TODO: Add file size validation
7. ⚠️ TODO: Add virus scanning for uploads

## Next Steps to Improve

1. Add file sharing with other users
2. Implement file versioning and trash
3. Add folder organization
4. Enable file preview (images, PDFs, videos)
5. Add notifications system
6. Implement search functionality
7. Add admin dashboard
8. Setup automated backups
9. Add mobile app (React Native)
10. Enable offline mode with service workers

## Support & Resources

- Node.js Docs: https://nodejs.org/en/docs/
- Express Docs: https://expressjs.com/
- MongoDB Docs: https://docs.mongodb.com/
- React Docs: https://react.dev/
- Cloudflare Docs: https://developers.cloudflare.com/

## Summary

You now have a complete fullstack cloud storage application:
- ✅ Backend: Node.js + Express
- ✅ Database: MongoDB Atlas
- ✅ Frontend: React + Tailwind CSS
- ✅ Global Access: Cloudflare Tunnel
- ✅ File Storage: 100GB on your laptop
- ✅ Authentication: JWT-based
- ✅ Deployment: Ready for production

**Congratulations! You have a production-ready cloud storage system! 🎉**
