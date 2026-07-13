import type { Voice } from 'expo-speech';

export interface VoicePreference {
  voiceId: string | null;
  pitch: number;
  rate: number;
}

export const DEFAULT_VOICE_PREFERENCE: VoicePreference = {
  voiceId: null,
  pitch: 1.05,
  rate: 0.92,
};

export const VOICE_STYLES: Array<{
  id: string;
  label: string;
  description: string;
  pitch: number;
  rate: number;
}> = [
  { id: 'warm', label: 'Warm', description: 'Friendly and uplifting', pitch: 1.05, rate: 0.92 },
  { id: 'calm', label: 'Calm', description: 'Soft and reassuring', pitch: 0.92, rate: 0.82 },
  { id: 'bright', label: 'Bright', description: 'Clear and energetic', pitch: 1.12, rate: 1.0 },
  {
    id: 'energetic',
    label: 'Energetic & Enthusiastic',
    description: 'Upbeat, lively, and motivating',
    pitch: 1.18,
    rate: 1.08,
  },
  { id: 'deep', label: 'Deep', description: 'Grounded and steady', pitch: 0.85, rate: 0.88 },
];

export function formatVoiceLabel(voice: Voice): string {
  const lang = voice.language.replace('_', '-').toUpperCase();
  return `${voice.name} (${lang})`;
}

export const VOICE_PREVIEW_TEXT = "Hey — I'm Spark. I'm here to lift your spirit today.";
