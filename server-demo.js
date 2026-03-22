const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// In-memory data (for demo purposes while MongoDB is being set up)
const users = {};
const files = {};

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

// Middleware to verify token
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

// AUTH Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    if (users[email]) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = 'user_' + Date.now();
    users[email] = {
      id: userId,
      email,
      password: hashedPassword
    };
    
    res.json({ message: 'User registered successfully', userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users[email];
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FILE Routes
app.post('/api/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileId = 'file_' + Date.now();
    const fileData = {
      id: fileId,
      userId: req.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      uploadedAt: new Date()
    };
    
    files[fileId] = fileData;
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        id: fileData.id,
        name: fileData.originalName,
        size: fileData.fileSize,
        type: fileData.fileType,
        uploadedAt: fileData.uploadedAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', verifyToken, async (req, res) => {
  try {
    const userFiles = Object.values(files)
      .filter(f => f.userId === req.userId)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    res.json({
      files: userFiles.map(f => ({
        id: f.id,
        name: f.originalName,
        size: f.fileSize,
        type: f.fileType,
        uploadedAt: f.uploadedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/file/:id', verifyToken, async (req, res) => {
  try {
    const file = files[req.params.id];
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.download(file.filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/file/:id', verifyToken, async (req, res) => {
  try {
    const file = files[req.params.id];
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    
    // Delete from memory
    delete files[req.params.id];
    
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage-info', verifyToken, async (req, res) => {
  try {
    const userFiles = Object.values(files).filter(f => f.userId === req.userId);
    const totalSize = userFiles.reduce((sum, f) => sum + f.fileSize, 0);
    const totalQuota = 19 * 1024 * 1024 * 1024; // 19GB
    
    res.json({
      usedStorage: totalSize,
      totalStorage: totalQuota,
      availableStorage: totalQuota - totalSize,
      fileCount: userFiles.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║  🚀 TomarsCloud Backend Running   ║
║  📍 http://localhost:${PORT}            ║
║  💾 Demo Mode (In-Memory) ✅        ║
╚═══════════════════════════════════╝

📝 Note: Running in DEMO mode with in-memory storage.
   Data will be lost when server restarts.
   
⚠️  To use MongoDB:
   1. Visit: https://cloud.mongodb.com
   2. Go to Network Access
   3. Whitelist your IP address
   4. Then run: npm start
  `);
});
