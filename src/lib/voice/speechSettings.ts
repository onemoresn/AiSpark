import { getGeminiApiKey, getStoredVoicePreference } from '../storage';
import {
  canPlayGeminiAudio,
  playGeminiAudio,
  primeAudioPlayback,
  stopAudioPlayback,
} from './audioPlayback';
import { synthesizeWithGemini } from './geminiTtsService';
import {
  DEFAULT_VOICE_PREFERENCE,
  getAvailableVoices,
  type VoicePreference,
} from './voiceConfig';

let preference: VoicePreference = { ...DEFAULT_VOICE_PREFERENCE };
let lastSpeakError: string | null = null;

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
  const stored = await getStoredVoicePreference();
  preference = stored;
  return stored;
}

export { getAvailableVoices, primeAudioPlayback };

export async function speakText(
  text: string,
  preferenceOverride?: VoicePreference
): Promise<void> {
  const clean = text.replace(/\n+/g, '. ').slice(0, 500);
  const pref = preferenceOverride ?? (await syncVoicePreferenceFromStorage());
  preference = pref;
  lastSpeakError = null;

  const apiKey = await getGeminiApiKey();

  if (!apiKey?.trim()) {
    lastSpeakError = 'Add your Gemini API key in Settings for natural voice.';
    throw new Error(lastSpeakError);
  }

  if (!canPlayGeminiAudio()) {
    lastSpeakError = 'Natural voice playback requires the web app.';
    throw new Error(lastSpeakError);
  }

  const audio = await synthesizeWithGemini(clean, pref, apiKey);
  await playGeminiAudio(audio.data, audio.mimeType);
}

export function stopSpeaking(): void {
  stopAudioPlayback();
}
