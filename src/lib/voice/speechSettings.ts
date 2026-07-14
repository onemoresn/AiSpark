import {
  canPlayGeminiAudio,
  playGeminiAudio,
  primeAudioPlayback,
  stopAudioPlayback,
} from './audioPlayback';
import { synthesizeWithGemini } from './geminiTtsService';
import { synthesizeWithOpenAi } from './openaiTtsService';
import { getTtsApiKey, resolveTtsEngine } from './ttsRouter';
import {
  DEFAULT_VOICE_PREFERENCE,
  getAvailableVoices,
  resolveVoicePreference,
  type TtsEngine,
  type VoicePreference,
} from './voiceConfig';
import { getAppSettings, getStoredVoicePreference } from '../storage';

let preference: VoicePreference = { ...DEFAULT_VOICE_PREFERENCE };
let lastSpeakError: string | null = null;
let cachedEngine: TtsEngine | null = null;

export function getVoicePreference(): VoicePreference {
  return { ...preference };
}

export function getLastSpeakError(): string | null {
  return lastSpeakError;
}

export function setVoicePreference(next: VoicePreference): void {
  preference = { ...next };
}

export async function syncVoicePreferenceFromStorage(): Promise<VoicePreference> {
  const settings = await getAppSettings();
  const engine = (await resolveTtsEngine(settings)) ?? 'openai';
  cachedEngine = engine;
  const stored = await getStoredVoicePreference();
  preference = resolveVoicePreference(stored, engine);
  return preference;
}

export async function getActiveTtsEngine(): Promise<TtsEngine | null> {
  if (cachedEngine) return cachedEngine;
  return resolveTtsEngine();
}

export function getAvailableVoicesForSettings(engine: TtsEngine): ReturnType<typeof getAvailableVoices> {
  return getAvailableVoices(engine);
}

export { getAvailableVoices, primeAudioPlayback };

export async function speakText(
  text: string,
  preferenceOverride?: VoicePreference
): Promise<void> {
  const clean = text.replace(/\n+/g, '. ').slice(0, 500);
  const settings = await getAppSettings();
  const engine = await resolveTtsEngine(settings);

  if (!engine) {
    lastSpeakError =
      settings.providerId === 'anthropic'
        ? 'Add a ChatGPT API key in Settings for natural voice (OpenAI TTS).'
        : 'Add a Gemini or ChatGPT API key in Settings for natural voice.';
    throw new Error(lastSpeakError);
  }

  cachedEngine = engine;
  const pref =
    preferenceOverride ??
    resolveVoicePreference(await getStoredVoicePreference(), engine);
  preference = pref;
  lastSpeakError = null;

  if (!canPlayGeminiAudio()) {
    lastSpeakError = 'Natural voice playback requires the web app.';
    throw new Error(lastSpeakError);
  }

  const apiKey = await getTtsApiKey(engine, settings);
  if (!apiKey) {
    lastSpeakError = 'No API key available for natural voice.';
    throw new Error(lastSpeakError);
  }

  const audio =
    engine === 'openai'
      ? await synthesizeWithOpenAi(clean, pref, apiKey)
      : await synthesizeWithGemini(clean, pref, apiKey);

  await playGeminiAudio(audio.data, audio.mimeType);
}

export function stopSpeaking(): void {
  stopAudioPlayback();
}
