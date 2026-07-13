# AiSpark — Motivational AI Assistant

**Spark** is a warm, uplifting mobile and web assistant with on-device AI, voice conversation, and motivational tools.

## Features

- **Spark personality** — positive, friendly, motivational responses
- **Voice conversation** — speak to Spark and hear replies (web: Chrome/Edge)
- **Voice customization** — styles and English voice dropdown in Settings
- **On-device AI** — Gemma 2 2B / Gemma 3 4B via llama.rn (iPhone/Android)
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
4. Wait for the first GitHub Actions deploy to finish (Actions tab)

### Add to iPhone Home Screen

1. Open the URL in **Safari**
2. Tap **Share** → **Add to Home Screen**
3. Spark launches full-screen like a native app (PWA)

### Manual deploy

```bash
npm run build:web
npm run deploy
```

## iPhone (On-Device AI)

```bash
npx expo prebuild
npx expo run:ios
```

Requires a development build (not Expo Go). First launch downloads the Gemma model once (~1.7–2.5 GB).

## Voice

- Tap the **mic** to speak (web browsers with speech recognition)
- **Settings → Voice style** — Warm, Calm, Bright, Energetic & Enthusiastic, Deep
- **Settings → Voice dropdown** — pick from English system voices
- Tap **Preview** to test before chatting

## Project Structure

```
src/
  components/     # UI (chat, landing, settings, particles)
  hooks/          # useVoice
  lib/
    chat/         # Spark conversation engine
    llm/          # On-device Gemma (llama.rn)
    voice/        # Speech settings and STT/TTS
    tools/        # Weather, news, search
```

## Privacy

- Chats stored locally (last 50 messages)
- On-device AI runs fully on your phone — no cloud inference
- Location used only for weather requests
