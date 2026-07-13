# Inspire — On-Device Motivational Assistant

A warm, uplifting mobile app powered by **Gemma running entirely on your iPhone** — free, private, and unlimited. No API keys. No token limits. No cloud.

## Features

- **100% on-device AI** — Gemma 2 2B or Gemma 3 4B via [llama.rn](https://github.com/mybigday/llama.rn)
- **Unlimited conversations** — no API costs, no rate limits
- **Fully private** — your chats never leave your phone
- **Weather awareness** — location-based weather with motivational interpretations
- **News summaries** — calm, clear headlines
- **Web search** — factual lookups with encouraging takeaways
- **Offline chat** — works without internet after the one-time model download

## Model Options

| Model | Size | Best For |
|-------|------|----------|
| **Gemma 2 2B** (default) | 1.7 GB | Most iPhones — fast and smooth |
| **Gemma 3 4B** | 2.5 GB | iPhone 12+ with 6 GB RAM — smarter responses |

## Requirements

- **iPhone** with 3 GB+ RAM (Gemma 2 2B) or 6 GB+ RAM (Gemma 3 4B)
- **macOS** for building the iOS app (or EAS Build in the cloud)
- **Development build** — this app uses native on-device AI and does **not** run in Expo Go

## Get Started

### Web (fastest — works on Windows)

```bash
npm install
npm run web
```

Opens in your browser at `http://localhost:8081`. No prebuild, no Mac, no API keys needed.

> **Note:** Web uses the built-in assistant with weather, news, and search tools. On-device Gemma runs on iPhone/Android only.

### iPhone (on-device Gemma)

```bash
npx expo prebuild
npx expo run:ios
```

Or use [EAS Build](https://docs.expo.dev/build/introduction/) if you don't have a Mac:

```bash
npx eas build --platform ios --profile development
```

### 3. First launch

On first open, Inspire downloads your chosen Gemma model (one-time, ~1.7–2.5 GB). After that, everything runs locally on your phone.

### 4. Start developing

```bash
npm start
```

## How It Works

```
User message
    ↓
Intent detection (weather / news / search)
    ↓
Tool execution (if needed) — still uses network for live data
    ↓
Gemma on-device (llama.rn + Metal GPU)
    ↓
Warm, motivational response
```

| Trigger | Tool | Source |
|---------|------|--------|
| Weather | `get_weather` | Open-Meteo (free) |
| News | `get_news` | BBC World RSS |
| Facts | `web_search` | DuckDuckGo |

Chat inference is fully on-device. Weather, news, and search still need internet when you ask for live data.

## Project Structure

```
src/
  components/       # Chat UI, model setup screen
  context/          # LlamaProvider — model lifecycle
  lib/
    llm/            # Gemma download + inference (llama.rn)
    chat/           # Inspire conversation engine
    tools/          # Weather, news, search
```

## Privacy

- Chats stored locally on your device only
- AI runs on your iPhone's GPU (Metal) — zero cloud inference
- Location used only when you ask about weather
