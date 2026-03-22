# TomarsCloud

A professional-grade cloud storage application with real authentication, file management, and MongoDB backend.

## Features

✨ **User Authentication**
- Secure registration and login
- JWT-based authentication
- Password hashing with bcryptjs

📁 **File Management**
- Drag-and-drop file upload
- Download files
- Delete files
- View file list with metadata

💾 **Storage**
- 100GB total allocation
- Real file storage on your Windows laptop
- MongoDB for file metadata
- Storage usage tracking

🌐 **Global Access**
- Access from anywhere via Cloudflare tunnel
- Mobile-friendly responsive design
- Professional iCloud-like interface

## Quick Start

### Backend
```bash
cd C:\tomarscloud-backend
npm install
npm start
```

Backend runs on `http://localhost:5000`

### Frontend
```bash
cd C:\tomarscloud-frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

### Database
MongoDB Atlas cluster already configured:
- Connection: `mongodb+srv://tomarurag:Windows$1$@cluster0.allqvnm.mongodb.net/tomarscloud`
- User: `tomarurag`
- Database: `tomarscloud`

## Project Structure

```
tomarscloud-backend/
├── server.js                 # Express app with all routes
├── package.json              # Dependencies
├── .env                       # Environment variables
├── uploads/                   # User files storage
├── AuthContext.jsx            # React auth context
├── Login.jsx                  # Login component
├── Dashboard.jsx              # Main dashboard
├── App.jsx                    # Root component
├── App.css                    # Styles
├── index.jsx                  # React entry point
├── index.html                 # HTML template
├── DEPLOYMENT_GUIDE.md        # Complete setup guide
└── .gitignore                # Git ignore rules
```

## Technology Stack

**Backend**
- Node.js + Express.js
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- Bcryptjs for password hashing

**Frontend**
- React.js
- Tailwind CSS
- Context API for state management
- Fetch API for HTTP requests

**Infrastructure**
- Windows laptop (100GB storage)
- MongoDB Atlas (free tier)
- Cloudflare Pages (frontend deployment)
- Cloudflare Tunnel (backend exposure)

## API Routes

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - Login and receive JWT
- `GET /api/auth/me` - Get user profile

### Files
- `POST /api/upload` - Upload file
- `GET /api/files` - List all files
- `GET /api/file/:id` - Download file
- `DELETE /api/file/:id` - Delete file

### Storage
- `GET /api/storage-info` - Get storage usage

## Configuration

### Environment Variables (.env)
```
MONGODB_URI=mongodb+srv://tomarurag:Windows$1$@cluster0.allqvnm.mongodb.net/tomarscloud
JWT_SECRET=your_jwt_secret_key_change_this_in_production
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

## Cloud Architecture

```
User Device (React App)
    ↓ (HTTPS)
Cloudflare Pages (Frontend)
    ↓ (API Calls)
Cloudflare Tunnel (Backend Exposed)
    ↓
Windows Laptop (Node.js Server on Port 5000)
    ↓
MongoDB Atlas (Database)
    ↓
C:\tomarscloud-backend\uploads\ (File Storage)
```

## Storage Specs

- **Total Storage**: 100GB on Windows laptop
- **Per-User Quota**: 19GB
- **Storage Path**: C:\tomarscloud-backend\uploads\
- **File Metadata**: Stored in MongoDB
- **Upload Limit**: No limit per file (adjust in multer config if needed)

## Deployment

### Local Development
```bash
# Terminal 1: Start backend
cd C:\tomarscloud-backend
npm start

# Terminal 2: Start frontend
cd C:\tomarscloud-frontend
npm start

# Terminal 3: Run Cloudflare tunnel (optional for testing remote access)
cloudflared tunnel run --url http://localhost:5000
```

### Production
See `DEPLOYMENT_GUIDE.md` for complete production setup instructions with:
- PM2 process manager
- Cloudflare authenticated tunnel
- HTTPS/SSL setup
- MongoDB Atlas security
- Environment configuration

## Security Features

✅ Password hashing (bcryptjs)
✅ JWT token authentication
✅ CORS protection
✅ Environment variables for secrets
✅ MongoDB connection encryption

## Future Enhancements

- [ ] File sharing with other users
- [ ] File versioning and trash
- [ ] Folder organization
- [ ] File preview (images, PDFs, videos)
- [ ] Search functionality
- [ ] User notifications
- [ ] Admin dashboard
- [ ] Automated backups
- [ ] Mobile app (React Native)
- [ ] Offline mode (service workers)

## Troubleshooting

**Backend won't connect to MongoDB?**
- Verify internet connection
- Check MongoDB Atlas cluster status
- Whitelist your IP in MongoDB Atlas

**Frontend can't reach backend?**
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify Cloudflare tunnel is active (if using remote access)

**File upload fails?**
- Check `C:\tomarscloud-backend\uploads\` exists
- Verify folder has write permissions
- Check available disk space

**Cloudflare tunnel disconnects?**
- Restart cloudflared command
- Check internet stability
- Review Cloudflare dashboard logs

## License

MIT

## Contact

For questions or support, refer to the DEPLOYMENT_GUIDE.md file.

---

**TomarsCloud v1.0** - Your professional cloud storage solution 🚀
