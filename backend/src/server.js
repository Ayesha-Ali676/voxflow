const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { admin } = require('./config/firebase');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve output video files for download
app.use('/outputs', express.static(require('path').join(__dirname, '../outputs')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('AI Video Dubbing API is running...');
});

// Import and use routes
const videoRoutes = require('./routes/videoRoutes');
app.use('/api/videos', videoRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔴 GLOBAL ERROR:", err);
  res.status(500).json({ error: "Global internal server error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
