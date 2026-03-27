# Project Walkthrough: AI Video Dubbing SaaS

This document provides a walkthrough of the completed AI Video Dubbing SaaS platform, designed for your college/hackathon project.

## 1. Project Structure

The project is divided into two main parts:

### Backend (`/backend`)
- `src/server.js`: Entry point for the Express server.
- `src/controllers/videoController.js`: Manages uploads and the 6-step processing pipeline.
- `src/services/ai_orchestrator.js`: Orchestrates Google Gemini and ElevenLabs.
- `src/utils/ffmpeg_utils.js`: Wrapper for FFmpeg audio/video operations.
- `src/config/firebase.js`: Unified Firebase configuration (Firestore + Storage).

### Frontend (`/frontend`)
- `src/App.jsx`: Premium Dashboard with glassmorphism and real-time status tracking.
- `src/index.css`: Design system and global styles.

---

## 2. The 7-Step AI Pipeline

Every video you upload follows this automated professional workflow:

1.  **Upload**: The video is uploaded to the backend and sent to **ElevenLabs**.
2.  **Dubbing Job**: ElevenLabs automatically transcribes, translates, and clones the voice.
3.  **Preservation**: Background music and sound effects are perfectly preserved.
4.  **Download**: The localized video file is downloaded and served to the user.
7.  **Subtitles**: Automated SRT files are generated for captions and accessibility.

---

## 3. Setup & Secrets

### Prerequisites
- **FFmpeg**: Required for audio/video processing.
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html), extract, and add the `bin` folder to your System PATH.
  - **Verification**: Run `ffmpeg -version` in your terminal.
- **Node.js**: v16 or higher.

### Backend Setup
1.  Navigate to `/backend`.
2.  Create a `.env` file based on `.env.example`.
3.  Add your API keys:
    - `ELEVENLABS_API_KEY` (from your Scale plan)
    - `GEMINI_API_KEY`
    - Firebase Service Account credentials.

### Frontend Setup
1.  Navigate to `/frontend`.
2.  Run `npm install`.
3.  Run `npm run dev` to launch the dashboard.

---

## 4. Visualizing the Result

Your premium dashboard allows you to select languages, track processing in real-time, and download your dubbed videos instantly.

> [!TIP]
> **Hackathon Winning Strategy**: Ensure your video demo is under 5 minutes for the fastest processing and maximum impact during your presentation!

---

> [!IMPORTANT]
> **Large File Handling**: We've optimized the audio extraction at **128kbps** to keep processing fast and efficient. For extremely long videos, consider chunking the audio before sending it to the APIs.

## 5. Deployment Recommendation
For your hackathon, you can host the backend on **Vercel/Render** and the frontend on **Firebase Hosting**. Both offer free tiers that work perfectly with this architecture.
