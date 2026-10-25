
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'videos.json');

fs.mkdirSync(uploadDir, { recursive: true });

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' +
      path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Sirf MP4 video allowed hai'));
    }
  }
});

// Main server page
app.get('/', (req, res) => {
  res.send('VICKY FLIX server is running!');
});

// Admin upload page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Video list API
app.get('/api/videos', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(dataFile, 'utf8')));
});

// Admin upload API
app.post('/api/admin/upload', (req, res, next) => {
  if (!ADMIN_TOKEN ||
      req.get('Authorization') !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Video file missing' });
  }

  const videos = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  const video = {
    id: Date.now().toString(),
    title: path.parse(req.file.originalname).name,
    url: `/videos/${req.file.filename}`
  };

  videos.push(video);
  fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2));

  res.status(201).json({
    message: 'Video added',
    video
  });
});

// Serve uploaded videos
app.use('/videos', express.static(uploadDir));

// Error handler
app.use((err, req, res, next) => {
  res.status(400).json({
    error: err.message || 'Request failed'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VICKY FLIX server running on port ${PORT}`);
});
    
