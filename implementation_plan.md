# AI Video Dubbing SaaS Platform - Implementation Plan

## Goal Description
Build a SaaS platform for automatic video/podcast dubbing. The system will handle a 6-step workflow: Upload -> Transcribe -> Translate -> Voice Clone (ElevenLabs) -> Sync -> Multilingual Export (e.g., video_en.mp4, video_es.mp4).

## User Review Required
> [!IMPORTANT]
> **ElevenLabs Scale Plan**: We'll use **Instant Voice Cloning** to automatically match the original speaker's voice for every video.
> 
> **AI Services for Hackathon**: For college/hackathon projects, **reliability is key**. We'll use **OpenAI Whisper API** ($0.006/min) and **Google Translate API** (Free Tier). This ensures the demo works perfectly without requiring a high-end server with GPU.
> 
> **Storage Management**: To keep the Firebase tier free, **videos will be deleted from storage** immediately after the final processing and download tokens are generated.

## Proposed Changes

### Core Architecture
The system will follow a distributed architecture with a clear separation between the React frontend and the Node.js backend, using **Firebase** as the unified platform for storage, authentication, and database (Firestore).

---

### Backend (Node.js + Express)
Responsible for API endpoints, job scheduling, and orchestration of AI services.

#### [NEW] [server.js](file:///d:/elevenlabs/backend/src/server.js)
Entry point for the backend.
#### [NEW] [jobs.js](file:///d:/elevenlabs/backend/src/services/jobs.js)
Job queue management for video processing.
#### [NEW] [ffmpeg_utils.js](file:///d:/elevenlabs/backend/src/utils/ffmpeg_utils.js)
Wrapper for FFmpeg operations (audio extraction, merging).
#### [NEW] [ai_orchestrator.js](file:///d:/elevenlabs/backend/src/services/ai_orchestrator.js)
Handles the pipeline: Whisper API -> Google Translate -> ElevenLabs PVC/IVC.
#### [NEW] [export_manager.js](file:///d:/elevenlabs/backend/src/services/export_manager.js)
Manages the generation of multiple language versions (video_en.mp4, video_es.mp4, etc.) and cleanup.

---

### Frontend (React + Vite)
Modern dashboard for uploading and managing video projects.

#### [NEW] [App.jsx](file:///d:/elevenlabs/frontend/src/App.jsx)
Main dashboard UI with project management and upload forms.
#### [NEW] [VideoPreview.jsx](file:///d:/elevenlabs/frontend/src/components/VideoPreview.jsx)
Component to compare original and dubbed videos.

---

### Database & Storage (Unified Firebase)
- **Firebase Firestore**: Projects, User metadata, Dubbing job statuses.
- **Firebase Storage**: Audio/Video assets.
- **Firebase Auth**: User authentication.

## Verification Plan

### Automated Tests
- Unit tests for `ffmpeg_utils.js` using mock audio files.
- Integration tests for AI pipeline (mocking API calls).
- Frontend tests using Vitest/Playwright.

### Manual Verification
1. Upload a 30s MP4 video.
2. Verify audio extraction and transcription accuracy.
3. Check translation into Spanish.
4. Preview the generated ElevenLabs audio.
5. Watch the final merged video and verify sync.
