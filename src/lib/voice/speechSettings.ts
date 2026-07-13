import * as Speech from 'expo-speech';
import type { SpeechOptions } from 'expo-speech';
import {
  DEFAULT_VOICE_PREFERENCE,
  type VoicePreference,
} from './voiceConfig';

let preference: VoicePreference = { ...DEFAULT_VOICE_PREFERENCE };

export function getVoicePreference(): VoicePreference {
  return { ...preference };
}

export function setVoicePreference(next: VoicePreference): void {
  preference = { ...next };
}

export function getSpeechOptions(): SpeechOptions {
  return {
    language: 'en-US',
    pitch: preference.pitch,
    rate: preference.rate,
    ...(preference.voiceId ? { voice: preference.voiceId } : {}),
  };
}

export async function getEnglishVoices() {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((v) => v.language.toLowerCase().startsWith('en'))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function speakText(text: string): Promise<void> {
  const clean = text.replace(/\n+/g, '. ').slice(0, 500);
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(finish, 60_000);

    Speech.speak(clean, {
      ...getSpeechOptions(),
      onDone: finish,
      onStopped: finish,
      onError: finish,
    });
  });
}
