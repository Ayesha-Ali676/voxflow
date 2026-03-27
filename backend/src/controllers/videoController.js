const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { startDubbingJob, getDubbingStatus, downloadDubbedFile } = require('../services/ai_orchestrator');

// Local paths for storing outputs
const TEMP_DIR = path.join(__dirname, '../../temp');
const OUTPUTS_DIR = path.join(__dirname, '../../outputs');

// Ensure directories exist
[TEMP_DIR, OUTPUTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Helper to wait for a specific duration
 */
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

    // Save metadata to Firestore
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
    
    res.status(202).json({
      message: 'Video uploaded successfully. ElevenLabs Dubbing started.',
      videoId
    });

    // Start processing asynchronously
    processVideoPipeline(videoId, tempVideoPath, extension, targetLanguages);

  } catch (error) {
    console.error('Error in uploadVideo:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};

const processVideoPipeline = async (videoId, tempVideoPath, extension, targetLanguages = ['es']) => {
  try {
    const projectRef = db.collection('projects').doc(videoId);
    const outputsDir = path.join(OUTPUTS_DIR, videoId);
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
    
    const dubbedVersions = {};

    for (const lang of targetLanguages) {
      await projectRef.update({ status: `dubbing_${lang}_started` });
      
      // 1. Start Dubbing Job
      const dubbingId = await startDubbingJob(tempVideoPath, lang);
      
      // 2. Poll for completion
      let status = 'dubbing';
      let attempts = 0;
      const maxAttempts = 240; // 20 minutes max (5s * 240)
      
      while (status !== 'dubbed' && status !== 'completed' && attempts < maxAttempts) {
        await sleep(5000); // Wait 5 seconds
        status = await getDubbingStatus(dubbingId);
        console.log(`⏳ Job ${dubbingId} status: ${status} (Attempt ${attempts + 1})`);
        
        if (status === 'failed') {
          throw new Error(`ElevenLabs Dubbing failed for language: ${lang}`);
        }
        attempts++;
      }

      if (status !== 'dubbed' && status !== 'completed') {
        throw new Error(`Dubbing timed out for language: ${lang}`);
      }

      // 3. Download Dubbed Video
      await projectRef.update({ status: `downloading_${lang}` });
      const finalVideoName = `video_${lang}_${videoId}${extension}`;
      const finalVideoPath = path.join(outputsDir, finalVideoName);
      
      await downloadDubbedFile(dubbingId, lang, finalVideoPath);

      // Store local path for download
      dubbedVersions[lang] = `/outputs/${videoId}/${finalVideoName}`;
      console.log(`✅ Completed ${lang} for project: ${videoId}`);
    }

    // 4. Final Update
    await projectRef.update({ 
      status: 'completed',
      dubbedVersions,
      updatedAt: new Date()
    });

    console.log(`🎉 Pipeline complete for project: ${videoId}`);

  } catch (error) {
    console.error('Processing Pipeline Error:', error);
    await db.collection('projects').doc(videoId).update({
      status: 'failed',
      error: error.message
    });
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

module.exports = {
  uploadVideo,
  getProjectStatus,
  getUserProjects
};

