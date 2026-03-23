# TomarsCloud - System Architecture & Setup Documentation

## Project Summary

TomarsCloud is a modern, full-stack file management application with the following stack:

**Frontend**: React + TypeScript + Vite  
**Backend**: Node.js + Express + Cloudinary (CDN)  
**Database**: MongoDB (Atlas)  
**Deployment**: Cloudflare (Frontend) + Railway (Backend)  
**Admin System**: Complete dashboard for managing users and files

## System Overview

```
┌─────────────────────┐
│   Frontend (React)  │
│  Cloudflare Pages   │
│ tomarscloud....     │
└──────────┬──────────┘
           │ API calls
           ↓
┌─────────────────────────────┐
│  Backend (Express.js)       │
│  Railway Deployment         │
│  /api endpoints             │
└──────────┬──────────────────┘
           │
           ├─→ MongoDB Atlas (Data)
           ├─→ Cloudinary (File Storage)
           └─→ Email Service (Nodemailer)
```

## Key Features

### User Authentication
- Email/Password registration and login
- JWT token-based authentication
- Secure password hashing (bcrypt)
- Automatic token refresh

### File Management
- Upload files via drag-and-drop or file picker
- View all uploaded files in a grid
- Download files anytime
- Delete files with confirmation
- Real-time file list updates

### File Sharing
- Generate shareable links for any file
- Share via email with custom messages
- Track who has access to shared files
- Revoke share links anytime

### Admin Dashboard (NEW)
- View system statistics and metrics
- User management (create, edit, delete, promote to admin)
- File management across all users
- Admin user tracking

## File Structure

### Frontend (`C:\tomarscloud-frontend`)
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Upload.tsx         # File upload
│   ├── Files.tsx          # File listing
│   ├── FileSharing.tsx    # Share interactions
│   └── AdminPanel.tsx     # Admin dashboard [NEW]
├── pages/
│   ├── Login.tsx          # Login page
│   ├── Signup.tsx         # Registration page
│   └── MainApp.tsx        # Main app view
├── services/
│   ├── api.ts             # API calls
│   └── auth.ts            # Auth service
├── types/
│   ├── auth.ts            # Auth types
│   ├── file.ts            # File types
│   └── admin.ts           # Admin types [NEW]
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

### Backend (`C:\tomarscloud-backend`)
```
src/
├── models/
│   ├── User.ts            # User schema
│   ├── File.ts            # File schema
│   ├── Share.ts           # File sharing
│   └── Admin.ts           # Admin tracking [NEW]
├── routes/
│   ├── auth.ts            # Auth routes
│   ├── files.ts           # File routes
│   ├── share.ts           # Share routes
│   └── admin.ts           # Admin routes [NEW]
├── middleware/
│   ├── auth.ts            # Auth verification
│   ├── errorHandler.ts    # Error handling
│   └── adminAuth.ts       # Admin verification [NEW]
├── controllers/
│   ├── authController.ts
│   ├── fileController.ts
│   ├── shareController.ts
│   └── adminController.ts [NEW]
├── config/
│   └── database.ts        # DB configuration
├── types/
│   └── index.ts           # TypeScript types
├── app.ts                 # Express app setup
└── server.ts              # Main server file
```

## Environment Setup

### Frontend Setup
Create `.env.local`:
```
VITE_API_URL=https://web-production-57dae.up.railway.app/api
```

### Backend Setup
Create `.env`:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_NAME=your-cloudinary
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://tomarscloud.odd-leaf-4538.workers.dev
NODE_ENV=production
JWT_EXPIRES_IN=7d
```

## Deployment Status

### ✅ Frontend
- **Status**: Live and deployed
- **Platform**: Cloudflare Pages
- **URL**: https://tomarscloud.odd-leaf-4538.workers.dev
- **Auto-deploy**: Yes (on git push)

### ✅ Backend
- **Status**: Live and deployed
- **Platform**: Railway
- **API Base**: https://web-production-57dae.up.railway.app/api
- **Database**: MongoDB Atlas (Connected)

## Core API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/verify-token   - Verify JWT token
POST   /api/auth/refresh-token  - Get new token
POST   /api/auth/logout         - Logout user
```

### Files
```
GET    /api/files               - Get user's files
POST   /api/files/upload        - Upload file
GET    /api/files/:fileId       - Get file details
DELETE /api/files/:fileId       - Delete file
GET    /api/files/:fileId/download - Download file
```

### File Sharing
```
POST   /api/shares/generate     - Create share link
GET    /api/shares/:shareId     - Get shared file
POST   /api/shares/:shareId/email - Email share link
DELETE /api/shares/:shareId     - Revoke share link
GET    /api/shares              - Get user's shares
```

### Admin (Requires Auth Header + Admin Status)
```
GET    /api/admin/stats         - Statistics
GET    /api/admin/users         - All users
DELETE /api/admin/users/:userId - Delete user
POST   /api/admin/make-admin/:userId - Promote user
POST   /api/admin/remove-admin/:userId - Demote user
GET    /api/admin/files         - All files
DELETE /api/admin/files/:fileId - Delete file
```

## How to Use TomarsCloud

### For Regular Users

1. **Sign Up**
   - Visit the app
   - Click "Create new account"
   - Fill in email, name, password
   - Account is created immediately

2. **Upload Files**
   - Click "Upload File" button
   - Drag and drop or select from computer
   - Files upload to cloud storage (Cloudinary)

3. **Download Files**
   - Click file in your dashboard
   - Click "Download" button
   - File downloads to your computer

4. **Share Files**
   - Click file and select "Share"
   - Copy link or email to recipients
   - Recipients can view without login

### For Admins

1. **Get Admin Access**
   - Ask another admin to promote you
   - Or use: `node admin-setup.js your-email@gmail.com`
   - Click "👑 Admin Panel" button in sidebar

2. **View Statistics**
   - See total users, admins, files, storage
   - Monitor system health

3. **Manage Users**
   - View all accounts
   - Promote/demote admin status
   - Delete users (removes all their files)

4. **Manage Files**
   - See all files in system
   - Delete files as needed
   - Monitor storage usage

## Development Commands

### Frontend
```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend
```bash
# Install dependencies
npm install

# Start production server
npm start

# Start with auto-reload (development)
npm run dev

# Setup admin access
node admin-setup.js user@email.com
```

## Troubleshooting

### Login Issues
- Verify email and password are correct
- Check if account exists (sign up if needed)
- Clear browser cache and try again

### Upload Failures
- Check file size (within limits)
- Verify internet connection
- Check Cloudinary is properly configured

### Share Link Not Working
- Verify link is not expired
- Check if recipient has correct URL
- Clear browser cache

### Admin Panel Not Visible
- Confirm you're logged in as admin
- Reload page
- Check if account has admin privileges

## Security Best Practices

1. **Use Strong Passwords**: At least 8 characters, mixed case, numbers
2. **Protect Share Links**: Only share with intended recipients
3. **Admin Access**: Keep admin credentials secure
4. **Regular Updates**: Keep dependencies updated
5. **HTTPS Only**: Always use HTTPS in production

## Performance Metrics

- **Frontend**: ~2.5s initial load (optimized)
- **API Response**: <500ms average
- **File Upload**: ~5-30s depending on size
- **CDN Cache**: 24-hour cache policy

## Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI framework |
| Bundler | Vite | Fast build tool |
| Styling | Tailwind CSS | Utility-first CSS |
| HTTP Client | Axios | API calls |
| Backend | Express.js | API server |
| Runtime | Node.js | JavaScript runtime |
| Database | MongoDB | Data storage |
| Auth | JWT | Token authentication |
| Storage | Cloudinary | File CDN |
| Deployment | Cloudflare | Frontend hosting |
| Deployment | Railway | Backend hosting |

## Future Enhancements

- [ ] File versioning
- [ ] Folder organization
- [ ] Advanced permissions
- [ ] File preview (images, docs)
- [ ] Bandwidth throttling
- [ ] Activity logging
- [ ] Mobile app
- [ ] Two-factor authentication
- [ ] SAML/OAuth integration

## Support & Contacts

For issues or questions:
1. Check the troubleshooting section
2. Review admin guide for admin features
3. Check browser console for error messages
4. Review backend logs for API errors

---

**Last Updated**: March 23, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
