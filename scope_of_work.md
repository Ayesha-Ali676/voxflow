# Project Scope: AI Video Dubbing SaaS Platform

## 1. Project Objective
To provide a cost-effective, high-quality AI dubbing solution for content creators, leveraging the ElevenLabs Scale Plan for voice generation while utilizing free/local tools for transcription and translation.

## 2. In-Scope Features (MVP)

### Core Pipeline
- **Video Upload**: Support for MP4/MOV files up to 30 minutes.
- **Audio Extraction**: Automated extraction using FFmpeg.
- **Transcription & Translation**: Automated speech-to-speech translation via **ElevenLabs Native Dubbing**.
- **Voice Overlay**: High-fidelity voice cloning that preserves original background sounds.
- **Podcast Translator**: Support for audio-only dubbing (MP3/WAV).
- **Voice Generation**: Automated **Instant Voice Cloning** for every video/podcast via ElevenLabs.
- **Auto-Publishing**: Initial support for local download and optional platform upload (social media links).

### Dashboard & UI
- **Project Management**: List of uploaded videos and their processing status.
- **Language Selection**: Simple dropdown to choose target languages.
- **Preview Player**: View original vs. dubbed video.
- **Download Center**: Export final video and subtitle files.

## 3. Technical Constraints & Costs
- **Storage**: Firebase Cloud Storage (Files **deleted automatically** after processing).
- **Processing**: Node.js backend using **ElevenLabs Native Dubbing** for an all-in-one professional pipeline.

## 4. Out of Scope (Future Phases)
- **Lip-Sync AI**: Adjusting video facial movements to match new audio (e.g., Wav2Lip).
- **Advanced Video Editing**: Cutting, trimming, or adding effects within the platform.
- **Social Media Auto-Post**: Direct API integration with YouTube/TikTok (to be added after MVP).
- **Team Collaboration**: Multiple users per project account.
