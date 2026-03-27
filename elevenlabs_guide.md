# ElevenLabs Integration Guide (Scale Plan)

This guide outlines how to leverage your **Scale Plan** for the AI Video Dubbing SaaS platform.

## 1. Get Your API Key
1.  Log in to [ElevenLabs](https://elevenlabs.io/).
2.  Go to **Profile Settings** -> **API Key**.
3.  Copy the key and store it in your `.env` file as `ELEVENLABS_API_KEY`.

## 2. Setting Up Voice Cloning (Scale Plan Benefits)
With the Scale Plan, you have access to **Professional Voice Cloning (PVC)** and high-quality models.

### Option A: Instant Voice Cloning (Fastest)
Use this to clone the original speaker's voice in seconds.
-   **Endpoint**: `/v1/voices/add`
-   **Usage**: Upload the audio extracted via FFmpeg to create a temporary or permanent voice ID.

### Option B: Professional Voice Cloning (Highest Quality)
Requires more data but provides the most realistic results.
-   **Note**: Best for recurring creators on your platform.

## 3. API Implementation (Node.js)

We'll use the `elevenlabs` official SDK or direct `axios` calls.

```javascript
const axios = require('axios');

async function generateDubbedAudio(text, voiceId) {
  const response = await axios({
    method: 'post',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    data: {
      text: text,
      model_id: "eleven_multilingual_v2", // Scale plan access
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    },
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'accept': 'audio/mpeg'
    },
    responseType: 'arraybuffer'
  });

  return response.data;
}
```

## 4. Why Scale Plan is Better for this SaaS
1.  **High Char Limits**: Essential for 30-minute videos (approx. 4,500 - 6,000 words).
2.  **Concurrency**: Process multiple dubbing jobs simultaneously.
3.  **Advanced Models**: `eleven_multilingual_v2` provides superior emotional tone across all supported languages.
4.  **Commercial Rights**: Full ownership of the generated content.

## 5. Cost-Saving Strategy
-   **Audio Extraction**: Done locally via FFmpeg (Free).
-   **Transcription**: Done locally using OpenAI Whisper (Free).
-   **Translation**: Done via Argos Translate or Google Translate Free Tier (Free).
-   **Only $ Spend**: ElevenLabs character usage (covered by your Scale plan).
