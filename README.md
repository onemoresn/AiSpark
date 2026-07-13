# AiSpark — Motivational AI Assistant

**Spark** is a warm, uplifting mobile and web assistant with Gemini AI, voice conversation, and motivational tools.

## Features

- **Spark personality** — positive, friendly, motivational responses
- **Voice conversation** — speak to Spark and hear replies (web: Chrome/Edge)
- **Voice customization** — styles and English voice dropdown in Settings
- **Gemini AI** — Gemini 2.5 Flash, Gemini 3 Flash, or Gemini 3.5 Flash (your API key)
- **Weather, news, search** — live tools with motivational framing
- **Dark neon-purple UI** — robot mascot with animated particles

## Quick Start (Web)

```bash
npm install
npm run web
```

Open `http://localhost:8081`

## Live Web App (GitHub Pages)

**URL:** [https://onemoresn.github.io/AiSpark/](https://onemoresn.github.io/AiSpark/)

Pushes to `master` automatically build and deploy the web app to the `gh-pages` branch.

### One-time GitHub setup

1. Open **Settings → Pages** on [github.com/onemoresn/AiSpark](https://github.com/onemoresn/AiSpark)
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Choose branch **`gh-pages`**, folder **`/ (root)`**, then **Save**

### Add to iPhone Home Screen

1. Open the URL in **Safari**
2. Tap **Share** → **Add to Home Screen**
3. Spark launches full-screen like a native app (PWA)

## Gemini API Setup

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Open Spark → **Settings** (gear icon)
3. Paste your API key, pick a Gemini model, adjust voice options
4. Tap **Save configuration**

Without an API key, Spark still works with built-in motivational fallbacks and live weather/news tools.

## Voice

- Tap the **mic** to speak (web browsers with speech recognition)
- **Settings → Voice style** — Warm, Calm, Bright, Energetic & Enthusiastic, Deep
- **Settings → Voice dropdown** — pick from English system voices
- Tap **Preview** to test before saving

## Project Structure

```
src/
  components/     # UI (chat, landing, settings, particles)
  context/        # Gemini settings context
  hooks/          # useVoice
  lib/
    chat/         # Spark conversation engine
    llm/          # Gemini API service
    voice/        # Speech settings and STT/TTS
    tools/        # Weather, news, search
```

## Privacy

- Chats stored locally (last 50 messages)
- API key stored locally on your device
- Gemini requests go to Google's API using your key
- Location used only for weather requests
