const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getProjectStatus, getUserProjects, downloadProjectFile } = require('../controllers/videoController');

// Multer storage for temporary video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../temp/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for 30min video
});

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/user/:userId', getUserProjects);
router.get('/download/:videoId/:lang', downloadProjectFile);
router.get('/:videoId', getProjectStatus);

module.exports = router;
