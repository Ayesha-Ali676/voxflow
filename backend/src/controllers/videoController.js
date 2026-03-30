const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { startDubbingJob, getDubbingStatus, downloadDubbedFile, downloadSubtitleFile } = require('../services/ai_orchestrator');

// Local paths for storing outputs
const TEMP_DIR = path.join(__dirname, '../../temp');
const OUTPUTS_DIR = path.join(__dirname, '../../outputs');

// Ensure directories exist
[TEMP_DIR, OUTPUTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));



const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No video file uploaded.');
    }

    const videoId = uuidv4();
    const tempVideoPath = req.file.path;
    const originalName = req.file.originalname;
    const extension = path.extname(originalName);

    const userId = req.body.userId || 'anonymous';
    console.log(`📝 Creating Firestore record for ${videoId} (User: ${userId})...`);
    const projectRef = db.collection('projects').doc(videoId);
    await projectRef.set({
      id: videoId,
      userId,
      originalName,
      status: 'uploaded',
      createdAt: new Date(),
      updatedAt: new Date(),
      localVideoPath: tempVideoPath,
    });

    const targetLanguages = req.body.languages ? JSON.parse(req.body.languages) : ['es'];
    const sourceLanguage = req.body.sourceLanguage || 'auto';

    res.status(202).json({
      message: 'Video uploaded successfully. ElevenLabs Dubbing started.',
      videoId
    });

    processVideoPipeline(videoId, tempVideoPath, extension, targetLanguages, sourceLanguage);

  } catch (error) {
    console.error('Error in uploadVideo:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};

const processVideoPipeline = async (videoId, tempVideoPath, extension, targetLanguages = ['es'], sourceLanguage = 'auto') => {
  try {
    const projectRef = db.collection('projects').doc(videoId);
    const outputsDir = path.join(OUTPUTS_DIR, videoId);
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

    const dubbedVersions = {};
    const subtitleVersions = {};

    for (const lang of targetLanguages) {
      await projectRef.update({ status: `dubbing_${lang}_started` });

      // 1. Start Dubbing Job
      const dubbingId = await startDubbingJob(tempVideoPath, lang, sourceLanguage);

      // 2. Poll for completion
      let jobStatus = 'dubbing';
      let attempts = 0;
      const maxAttempts = 240;

      while (jobStatus !== 'dubbed' && jobStatus !== 'completed' && attempts < maxAttempts) {
        await sleep(5000);
        jobStatus = await getDubbingStatus(dubbingId);
        console.log(`⏳ Job ${dubbingId} status: ${jobStatus} (Attempt ${attempts + 1})`);

        if (jobStatus === 'failed') {
          throw new Error(`ElevenLabs Dubbing failed for language: ${lang}`);
        }
        attempts++;
      }

      if (jobStatus !== 'dubbed' && jobStatus !== 'completed') {
        throw new Error(`Dubbing timed out for language: ${lang}`);
      }

      // 3. Download Dubbed Video
      await projectRef.update({ status: `downloading_${lang}` });
      const finalVideoName = `video_${lang}_${videoId}${extension}`;
      const finalVideoPath = path.join(outputsDir, finalVideoName);
      await downloadDubbedFile(dubbingId, lang, finalVideoPath);

      // 4. Download WebVTT Subtitles for the browser player
      try {
        const vttName = `subtitle_${lang}_${videoId}.vtt`;
        const vttPath = path.join(outputsDir, vttName);
        await downloadSubtitleFile(dubbingId, lang, vttPath);
        subtitleVersions[lang] = `/outputs/${videoId}/${vttName}`;
        console.log(`📝 WebVTT subtitles downloaded natively.`);
      } catch (err) {
        console.warn(`⚠️ VTT Subtitle download failed for ${lang}: ${err.message}`);
      }

      dubbedVersions[lang] = `/outputs/${videoId}/${finalVideoName}`;
      console.log(`✅ Completed ${lang} for project: ${videoId}`);
    }

    // 5. Final Update
    await projectRef.update({
      status: 'completed',
      dubbedVersions,
      subtitleVersions,
      updatedAt: new Date()
    });

    console.log(`🎉 Pipeline complete for project: ${videoId}`);

  } catch (error) {
    console.error('Processing Pipeline Error:', error);
    await db.collection('projects').doc(videoId).update({
      status: 'failed',
      error: error.message
    });
  } finally {
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
      console.log(`🗑️ Cleaned up temp file: ${tempVideoPath}`);
    }
  }
};

const getProjectStatus = async (req, res) => {
  try {
    const { videoId } = req.params;
    const projectDoc = await db.collection('projects').doc(videoId).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(projectDoc.data());
  } catch (error) {
    console.error('Error in getProjectStatus:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).send('User ID required');

    const projectsSnapshot = await db.collection('projects')
      .where('userId', '==', userId)
      .get();

    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    res.json(projects);
  } catch (error) {
    console.error('Error in getUserProjects:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const downloadProjectFile = async (req, res) => {
  try {
    const { videoId, lang } = req.params;
    const projectDoc = await db.collection('projects').doc(videoId).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data = projectDoc.data();
    const relativePath = data.dubbedVersions[lang];

    if (!relativePath) {
      return res.status(404).json({ error: `Language version '${lang}' not found` });
    }

    // Convert relative path (/outputs/ID/file.mp4) to absolute local path
    const absolutePath = path.join(OUTPUTS_DIR, relativePath.replace('/outputs/', ''));

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Physical file not found on server' });
    }

    // Set professional friendly filename for the download
    const downloadName = `VoxFlow_${lang.toUpperCase()}_${data.originalName || 'video'}.mp4`;
    
    console.log(`📥 Serving download: ${downloadName}`);
    res.download(absolutePath, downloadName);

  } catch (error) {
    console.error('Error in downloadProjectFile:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  uploadVideo,
  getProjectStatus,
  getUserProjects,
  downloadProjectFile
};
