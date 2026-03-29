const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

/**
 * Starts a dubbing job using ElevenLabs Video Dubbing API.
 * @param {string} videoPath - Local path to the video file.
 * @param {string} targetLanguage - Target language code (iso-639-1).
 * @param {string} sourceLanguage - Optional source language code.
 * @returns {Promise<string>} - The dubbing_id.
 */
const startDubbingJob = async (videoPath, targetLanguage, sourceLanguage = 'auto') => {
  console.log(`🎬 Starting ElevenLabs Dubbing Job for: ${videoPath} (${targetLanguage})`);

  const formData = new FormData();
  formData.append('file', fs.createReadStream(videoPath));
  formData.append('name', `Dub_${path.basename(videoPath)}_${Date.now()}`);
  formData.append('target_lang', targetLanguage);

  if (sourceLanguage !== 'auto') {
    formData.append('source_lang', sourceLanguage);
  }

  const response = await axios.post('https://api.elevenlabs.io/v1/dubbing', formData, {
    headers: {
      ...formData.getHeaders(),
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const dubbingId = response.data.dubbing_id;
  console.log(`✅ Dubbing job created: ${dubbingId}`);
  return dubbingId;
};

/**
 * Polls for the status of a dubbing job.
 * @param {string} dubbingId - The dubbing job ID.
 * @returns {Promise<string>} - The status ('completed', 'dubbing', etc.).
 */
const getDubbingStatus = async (dubbingId) => {
  const response = await axios.get(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}`, {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  });
  return response.data.status;
};

/**
 * Downloads the dubbed video/audio file.
 * @param {string} dubbingId - The dubbing job ID.
 * @param {string} languageCode - The language code.
 * @param {string} outputPath - Local path to save the output.
 */
const downloadDubbedFile = async (dubbingId, languageCode, outputPath) => {
  console.log(`📥 Downloading dubbed file (${languageCode}) for job ${dubbingId}...`);

  const response = await axios.get(
    `https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${languageCode}`,
    {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      responseType: 'stream',
    }
  );

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

/**
 * Legacy stubs for backward compatibility if needed, 
 * but primarily we move to the native workflow.
 */
const transcribeAudio = async () => { throw new Error("Deprecated: Use startDubbingJob instead."); };
const translateText = async () => { throw new Error("Deprecated: Use startDubbingJob instead."); };
const generateClonedVoice = async () => { throw new Error("Deprecated: Use startDubbingJob instead."); };
const generateSubtitles = async () => { throw new Error("Deprecated: Use ElevenLabs metadata instead."); };

module.exports = {
  startDubbingJob,
  getDubbingStatus,
  downloadDubbedFile,
  // Legacy stubs to prevent immediate crashes in controller
  transcribeAudio,
  translateText,
  generateClonedVoice,
  generateSubtitles,
};

