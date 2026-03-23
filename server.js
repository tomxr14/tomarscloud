const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// ===== IN-MEMORY DATABASE (Fallback Mode) =====
const memoryDB = {
  users: {},
  files: {},
  shares: {} // For file sharing
};

// ===== MONGODB MODE =====
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // NEW: Admin flag
  createdAt: { type: Date, default: Date.now }
});

const fileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  originalName: String,
  fileSize: Number,
  fileType: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null } // null = active, Date = deleted (soft-delete)
});

const shareSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  shareToken: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: String, // email address (optional, for future private shares)
  access: { type: String, default: 'view' }, // 'view' or 'download'
  expiresAt: Date, // optional expiration date
  createdAt: { type: Date, default: Date.now },
  revokedAt: Date // null = active, Date = revoked
});

const User = mongoose.model('User', userSchema);
const File = mongoose.model('File', fileSchema);
const Share = mongoose.model('Share', shareSchema);

// Track connection mode
let mongoConnected = false;

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// JWT Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Verification Middleware
const verifyAdmin = async (req, res, next) => {
  try {
    let user;
    if (mongoConnected) {
      user = await User.findById(req.userId);
    } else {
      user = Object.values(memoryDB.users).find(u => u.id === req.userId);
    }
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Utility: Generate unique share token
const generateShareToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// ===== API ENDPOINTS =====

// Helper function to generate username from email
const generateUsername = (email) => {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
};

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username required' });
    }

    // Validate username length
    if (username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    
    const cleanUsername = username.trim();
    let user;
    let userId;

    if (mongoConnected) {
      // MongoDB Mode
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const existingUsername = await User.findOne({ username: cleanUsername });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email, password: hashedPassword, username: cleanUsername });
      await user.save();
      userId = user._id.toString();
    } else {
      // IN-MEMORY Mode
      if (memoryDB.users[email]) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userExists = Object.values(memoryDB.users).some(u => u.username === cleanUsername);
      if (userExists) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      userId = 'user_' + Date.now();
      memoryDB.users[email] = {
        id: userId,
        email,
        username: cleanUsername,
        password: hashedPassword,
        createdAt: new Date()
      };
    }
    
    // Generate JWT token immediately after registration
    const token = jwt.sign(
      { userId, email, username: cleanUsername },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'User registered successfully',
      token,
      user: { id: userId, email, username: cleanUsername }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    let { email, username, password } = req.body;
    
    // If username contains @ and email is empty, treat username as email
    if (!email && username && username.includes('@')) {
      email = username;
      username = null;
    }
    
    // Allow login with either email or username
    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Username/Email and password required' });
    }
    
    let user;
    
    if (mongoConnected) {
      // MongoDB Mode - search by email or username
      user = await User.findOne({
        $or: [
          email ? { email: email } : null,
          username ? { username: username } : null
        ].filter(Boolean)
      });
    } else {
      // IN-MEMORY Mode - search by email or username
      if (email) {
        user = memoryDB.users[email];
      } else if (username) {
        // Search by username in memory
        user = Object.values(memoryDB.users).find(u => u.username === username);
      }
    }
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const userId = mongoConnected ? user._id.toString() : user.id;
    const userEmail = mongoConnected ? user.email : user.email;
    const userUsername = user.username || generateUsername(userEmail);
    const token = jwt.sign(
      { userId, email: userEmail, username: userUsername },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: userId, email: userEmail, username: userUsername }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INITIALIZE FIRST ADMIN (Only works if no admins exist)
app.post('/api/init-admin', async (req, res) => {
  try {
    let hasAdmins;
    
    if (mongoConnected) {
      hasAdmins = await User.countDocuments({ isAdmin: true });
    } else {
      hasAdmins = Object.values(memoryDB.users).some(u => u.isAdmin);
    }
    
    if (hasAdmins) {
      return res.status(403).json({ error: 'Admin already exists. Contact current admin to promote you.' });
    }
    
    // Get user ID from body
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    if (mongoConnected) {
      const user = await User.findByIdAndUpdate(userId, { isAdmin: true }, { new: true });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'First admin created!', user: { email: user.email, username: user.username, isAdmin: user.isAdmin } });
    } else {
      const user = Object.values(memoryDB.users).find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.isAdmin = true;
      res.json({ message: 'First admin created!', user: { email: user.email, username: user.username, isAdmin: user.isAdmin } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD FILE
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (mongoConnected) {
      // MongoDB Mode
      const file = new File({
        userId: req.userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path
      });
      await file.save();
      
      res.json({
        message: 'File uploaded successfully',
        file: {
          id: file._id,
          name: file.originalName,
          size: file.fileSize,
          type: file.fileType,
          uploadedAt: file.uploadedAt
        }
      });
    } else {
      // IN-MEMORY Mode
      const fileId = 'file_' + Date.now();
      memoryDB.files[fileId] = {
        id: fileId,
        userId: req.userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        uploadedAt: new Date()
      };
      
      res.json({
        message: 'File uploaded successfully',
        file: {
          id: fileId,
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          uploadedAt: new Date()
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET FILES
app.get('/api/files', verifyToken, async (req, res) => {
  try {
    let files;
    
    if (mongoConnected) {
      // MongoDB Mode - Exclude deleted files
      files = await File.find({ userId: req.userId, deletedAt: null }).sort({ uploadedAt: -1 });
      res.json({
        files: files.map(f => ({
          _id: f._id,
          filename: f.originalName,
          size: f.fileSize,
          type: f.fileType,
          uploadedAt: f.uploadedAt
        }))
      });
    } else {
      // IN-MEMORY Mode - Exclude deleted files
      files = Object.values(memoryDB.files)
        .filter(f => f.userId === req.userId && !f.deletedAt)
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
      
      res.json({
        files: files.map(f => ({
          _id: f.id,
          filename: f.originalName,
          size: f.fileSize,
          type: f.fileType,
          uploadedAt: f.uploadedAt
        }))
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD FILE
app.get('/api/file/:id', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      // MongoDB Mode
      file = await File.findById(req.params.id);
    } else {
      // IN-MEMORY Mode
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.download(file.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE FILE (Soft Delete - Move to Trash)
app.delete('/api/file/:id', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      // MongoDB Mode
      file = await File.findById(req.params.id);
    } else {
      // IN-MEMORY Mode
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // SOFT DELETE: Mark as deleted instead of removing
    if (mongoConnected) {
      await File.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    } else {
      file.deletedAt = new Date();
      memoryDB.files[req.params.id] = file;
    }
    
    res.json({ message: 'File moved to trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STORAGE INFO
app.get('/api/storage-info', verifyToken, async (req, res) => {
  try {
    let files, isAdmin;
    
    if (mongoConnected) {
      // MongoDB Mode
      files = await File.find({ userId: req.userId });
      const user = await User.findById(req.userId);
      isAdmin = user?.isAdmin || false;
    } else {
      // IN-MEMORY Mode
      files = Object.values(memoryDB.files).filter(f => f.userId === req.userId);
      const user = Object.values(memoryDB.users).find(u => u.id === req.userId);
      isAdmin = user?.isAdmin || false;
    }
    
    const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);
    const totalQuota = 19 * 1024 * 1024 * 1024;
    
    res.json({
      username: req.username,
      email: req.email,
      isAdmin,
      usedStorage: totalSize,
      totalStorage: totalQuota,
      availableStorage: totalQuota - totalSize,
      fileCount: files.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET TRASH - List all deleted files
app.get('/api/trash', verifyToken, async (req, res) => {
  try {
    let files;
    
    if (mongoConnected) {
      // MongoDB Mode - Only get deleted files
      files = await File.find({ userId: req.userId, deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
      res.json({
        files: files.map(f => ({
          _id: f._id,
          filename: f.originalName,
          size: f.fileSize,
          type: f.fileType,
          deletedAt: f.deletedAt,
          uploadedAt: f.uploadedAt
        }))
      });
    } else {
      // IN-MEMORY Mode - Only get deleted files
      files = Object.values(memoryDB.files)
        .filter(f => f.userId === req.userId && f.deletedAt)
        .sort((a, b) => b.deletedAt - a.deletedAt);
      
      res.json({
        files: files.map(f => ({
          _id: f.id,
          filename: f.originalName,
          size: f.fileSize,
          type: f.fileType,
          deletedAt: f.deletedAt,
          uploadedAt: f.uploadedAt
        }))
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESTORE FILE from Trash
app.put('/api/file/:id/restore', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      file = await File.findById(req.params.id);
    } else {
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (mongoConnected) {
      await File.findByIdAndUpdate(req.params.id, { deletedAt: null });
    } else {
      file.deletedAt = null;
      memoryDB.files[req.params.id] = file;
    }
    
    res.json({ message: 'File restored from trash' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PERMANENTLY DELETE FILE
app.delete('/api/file/:id/permanent', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      file = await File.findById(req.params.id);
    } else {
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    
    // Delete from database
    if (mongoConnected) {
      await File.findByIdAndDelete(req.params.id);
    } else {
      delete memoryDB.files[req.params.id];
    }
    
    res.json({ message: 'File permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== FILE SHARING ENDPOINTS =====

// CREATE SHARE - Generate shareable link
app.post('/api/file/:id/share', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      file = await File.findById(req.params.id);
    } else {
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const shareToken = generateShareToken();
    
    if (mongoConnected) {
      const share = new Share({
        fileId: req.params.id,
        shareToken,
        createdBy: req.userId,
        access: req.body.access || 'download'
      });
      await share.save();
      res.json({
        shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/share/${shareToken}`,
        message: 'Share link created'
      });
    } else {
      const shareId = Date.now().toString();
      memoryDB.shares[shareId] = {
        id: shareId,
        fileId: req.params.id,
        shareToken,
        createdBy: req.userId,
        access: req.body.access || 'download',
        createdAt: new Date(),
        revokedAt: null
      };
      res.json({
        shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/share/${shareToken}`,
        message: 'Share link created'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SHARED FILE (Public - no auth needed)
app.get('/api/share/:token', async (req, res) => {
  try {
    let share, file;
    
    if (mongoConnected) {
      share = await Share.findOne({ shareToken: req.params.token, revokedAt: null });
      if (share) {
        file = await File.findById(share.fileId);
      }
    } else {
      share = Object.values(memoryDB.shares).find(s => s.shareToken === req.params.token && !s.revokedAt);
      if (share) {
        file = memoryDB.files[share.fileId];
      }
    }
    
    if (!share || !file) {
      return res.status(404).json({ error: 'Share link not found or revoked' });
    }
    
    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Share link expired' });
    }
    
    res.json({
      filename: file.originalName,
      size: file.fileSize,
      type: file.fileType,
      createdAt: share.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD SHARED FILE (Public - no auth needed)
app.get('/api/share/:token/download', async (req, res) => {
  try {
    let share, file;
    
    if (mongoConnected) {
      share = await Share.findOne({ shareToken: req.params.token, revokedAt: null });
      if (share) {
        file = await File.findById(share.fileId);
      }
    } else {
      share = Object.values(memoryDB.shares).find(s => s.shareToken === req.params.token && !s.revokedAt);
      if (share) {
        file = memoryDB.files[share.fileId];
      }
    }
    
    if (!share || !file) {
      return res.status(404).json({ error: 'Share link not found or revoked' });
    }
    
    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Share link expired' });
    }
    
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.download(file.filePath, file.originalName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST SHARES for a file
app.get('/api/file/:id/shares', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      file = await File.findById(req.params.id);
    } else {
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    let shares;
    
    if (mongoConnected) {
      shares = await Share.find({ fileId: req.params.id, revokedAt: null });
      res.json({
        shares: shares.map(s => ({
          id: s._id,
          shareToken: s.shareToken,
          shareUrl: `${req.protocol}://${req.get('host')}/share/${s.shareToken}`,
          access: s.access,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt
        }))
      });
    } else {
      shares = Object.values(memoryDB.shares).filter(s => s.fileId === req.params.id && !s.revokedAt);
      res.json({
        shares: shares.map(s => ({
          id: s.id,
          shareToken: s.shareToken,
          shareUrl: `${req.protocol}://${req.get('host')}/share/${s.shareToken}`,
          access: s.access,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt
        }))
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REVOKE SHARE
app.delete('/api/file/:id/share/:shareId', verifyToken, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      file = await File.findById(req.params.id);
    } else {
      file = memoryDB.files[req.params.id];
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const userId = mongoConnected ? file.userId.toString() : file.userId;
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (mongoConnected) {
      await Share.findByIdAndUpdate(req.params.shareId, { revokedAt: new Date() });
    } else {
      const share = memoryDB.shares[req.params.shareId];
      if (share) {
        share.revokedAt = new Date();
      }
    }
    
    res.json({ message: 'Share revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN ENDPOINTS =====

// GET ALL USERS (Admin only)
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let users;
    
    if (mongoConnected) {
      users = await User.find({}, { password: 0 });
      users = users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        username: u.username,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt
      }));
    } else {
      users = Object.values(memoryDB.users).map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt
      }));
    }
    
    res.json({ users, totalUsers: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET USER DETAILS (Admin only)
app.get('/api/admin/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let user, files, fileCount, storageUsed;
    
    if (mongoConnected) {
      user = await User.findById(req.params.userId, { password: 0 });
      files = await File.find({ userId: req.params.userId, deletedAt: null });
    } else {
      user = Object.values(memoryDB.users).find(u => u.id === req.params.userId);
      files = Object.values(memoryDB.files).filter(f => f.userId === req.params.userId && !f.deletedAt);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    storageUsed = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
    
    res.json({
      user: {
        id: mongoConnected ? user._id.toString() : user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      },
      fileCount: files.length,
      storageUsed: storageUsed,
      files: files.map(f => ({
        id: mongoConnected ? f._id.toString() : f.id,
        name: f.originalName,
        size: f.fileSize,
        uploadedAt: f.uploadedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (Admin only)
app.delete('/api/admin/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (mongoConnected) {
      // Find and delete all user files
      const files = await File.find({ userId: req.params.userId });
      for (let file of files) {
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
      }
      await File.deleteMany({ userId: req.params.userId });
      
      // Delete user
      await User.findByIdAndDelete(req.params.userId);
    } else {
      // Memory mode
      const userEmail = Object.keys(memoryDB.users).find(email => memoryDB.users[email].id === req.params.userId);
      if (userEmail) {
        // Delete user files
        Object.keys(memoryDB.files).forEach(fileId => {
          if (memoryDB.files[fileId].userId === req.params.userId && fs.existsSync(memoryDB.files[fileId].filePath)) {
            fs.unlinkSync(memoryDB.files[fileId].filePath);
            delete memoryDB.files[fileId];
          }
        });
        delete memoryDB.users[userEmail];
      }
    }
    
    res.json({ message: 'User and associated files deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL FILES (Admin only)
app.get('/api/admin/files', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let files;
    
    if (mongoConnected) {
      files = await File.find({ deletedAt: null }).populate('userId', 'username email');
      files = files.map(f => ({
        id: f._id.toString(),
        userId: mongoConnected ? f.userId._id.toString() : f.userId,
        username: f.userId.username,
        email: f.userId.email,
        name: f.originalName,
        size: f.fileSize,
        uploadedAt: f.uploadedAt
      }));
    } else {
      files = Object.values(memoryDB.files)
        .filter(f => !f.deletedAt)
        .map(f => {
          const user = Object.values(memoryDB.users).find(u => u.id === f.userId);
          return {
            id: f.id,
            userId: f.userId,
            username: user?.username || 'Unknown',
            email: user?.email || 'Unknown',
            name: f.originalName,
            size: f.fileSize,
            uploadedAt: f.uploadedAt
          };
        });
    }
    
    res.json({ files, totalFiles: files.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE FILE (Admin only)
app.delete('/api/admin/files/:fileId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let file;
    
    if (mongoConnected) {
      file = await File.findById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      
      await File.findByIdAndDelete(req.params.fileId);
    } else {
      file = memoryDB.files[req.params.fileId];
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      
      delete memoryDB.files[req.params.fileId];
    }
    
    res.json({ message: 'File deleted by admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SYSTEM STATS (Admin only)
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    let totalUsers, totalFiles, totalStorage;
    
    if (mongoConnected) {
      totalUsers = await User.countDocuments();
      const files = await File.find({ deletedAt: null });
      totalFiles = files.length;
      totalStorage = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
      
      const adminCount = await User.countDocuments({ isAdmin: true });
      const adminUsers = await User.find({ isAdmin: true }, { email: 1, username: 1 });
      
      res.json({
        totalUsers,
        totalAdmin: adminCount,
        adminUsers: adminUsers.map(u => ({ email: u.email, username: u.username })),
        totalFiles,
        totalStorage: totalStorage,
        storageInGB: (totalStorage / (1024 ** 3)).toFixed(2)
      });
    } else {
      totalUsers = Object.values(memoryDB.users).length;
      const files = Object.values(memoryDB.files).filter(f => !f.deletedAt);
      totalFiles = files.length;
      totalStorage = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
      
      const adminUsers = Object.values(memoryDB.users).filter(u => u.isAdmin);
      
      res.json({
        totalUsers,
        totalAdmin: adminUsers.length,
        adminUsers: adminUsers.map(u => ({ email: u.email, username: u.username })),
        totalFiles,
        totalStorage: totalStorage,
        storageInGB: (totalStorage / (1024 ** 3)).toFixed(2)
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MAKE USER ADMIN (Admin only)
app.post('/api/admin/make-admin/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (mongoConnected) {
      await User.findByIdAndUpdate(req.params.userId, { isAdmin: true });
    } else {
      const user = Object.values(memoryDB.users).find(u => u.id === req.params.userId);
      if (user) {
        user.isAdmin = true;
      }
    }
    
    res.json({ message: 'User is now an admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE ADMIN ROLE (Admin only)
app.post('/api/admin/remove-admin/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (mongoConnected) {
      await User.findByIdAndUpdate(req.params.userId, { isAdmin: false });
    } else {
      const user = Object.values(memoryDB.users).find(u => u.id === req.params.userId);
      if (user) {
        user.isAdmin = false;
      }
    }
    
    res.json({ message: 'Admin role removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SERVER STARTUP =====
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('⏳ Attempting MongoDB Atlas connection...');
    
    try {
      await Promise.race([
        mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
      ]);
      
      mongoConnected = true;
      console.log('✅ MongoDB Atlas Connected!');
    } catch (mongoErr) {
      mongoConnected = false;
      console.log('⚠️  MongoDB Connection Failed - Using IN-MEMORY DATABASE');
      console.log('   Error:', mongoErr.message);
    }
    
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║  🚀 TomarsCloud Backend Running                ║
║  📍 http://localhost:${PORT}                         ║
║  💾 Database: ${mongoConnected ? 'MongoDB Atlas ✅' : 'IN-MEMORY 📝'}          ║
║  🌐 Mode: ${mongoConnected ? 'Production' : 'Testing'}                       ║
╚════════════════════════════════════════════════╝

📋 Test Credentials:
   Email: test@example.com  Password: TestPassword123

✅ Ready for API Testing!
      `);
    });
  } catch (err) {
    console.error('❌ Server Startup Failed:', err.message);
    process.exit(1);
  }
}

startServer();
