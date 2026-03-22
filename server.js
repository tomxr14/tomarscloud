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
  files: {}
};

// ===== MONGODB MODE =====
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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

const User = mongoose.model('User', userSchema);
const File = mongoose.model('File', fileSchema);

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
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== API ENDPOINTS =====

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (mongoConnected) {
      // MongoDB Mode
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      
      res.json({ 
        message: 'User registered successfully', 
        userId: user._id,
        email: user.email 
      });
    } else {
      // IN-MEMORY Mode
      if (memoryDB.users[email]) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = 'user_' + Date.now();
      memoryDB.users[email] = {
        id: userId,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };
      
      res.json({ 
        message: 'User registered successfully', 
        userId,
        email 
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    let user;
    
    if (mongoConnected) {
      // MongoDB Mode
      user = await User.findOne({ email });
    } else {
      // IN-MEMORY Mode
      user = memoryDB.users[email];
    }
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const userId = mongoConnected ? user._id.toString() : user.id;
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: userId, email }
    });
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
    let files;
    
    if (mongoConnected) {
      // MongoDB Mode
      files = await File.find({ userId: req.userId });
    } else {
      // IN-MEMORY Mode
      files = Object.values(memoryDB.files).filter(f => f.userId === req.userId);
    }
    
    const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);
    const totalQuota = 19 * 1024 * 1024 * 1024;
    
    res.json({
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
