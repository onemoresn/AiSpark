import type { LlmProviderId } from '../llm/providersConfig';

export type TtsEngine = 'gemini' | 'openai';

export interface SparkVoice {
  identifier: string;
  name: string;
  description: string;
  language: string;
  engine: TtsEngine;
}

export interface VoicePreference {
  voiceId: string;
  styleId: string;
}

export const DEFAULT_VOICE_PREFERENCE: VoicePreference = {
  voiceId: 'nova',
  styleId: 'warm',
};

export const VOICE_STYLES: Array<{
  id: string;
  label: string;
  description: string;
  geminiVoiceId: string;
  openaiVoiceId: string;
  ttsPrompt: string;
  pitch: number;
  rate: number;
}> = [
  {
    id: 'warm',
    label: 'Warm',
    description: 'Friendly and uplifting',
    geminiVoiceId: 'Sulafat',
    openaiVoiceId: 'nova',
    ttsPrompt: 'Speak in a warm, friendly, and uplifting tone',
    pitch: 1.0,
    rate: 0.95,
  },
  {
    id: 'calm',
    label: 'Calm',
    description: 'Soft and reassuring',
    geminiVoiceId: 'Achernar',
    openaiVoiceId: 'shimmer',
    ttsPrompt: 'Speak softly and calmly, with a gentle reassuring pace',
    pitch: 0.95,
    rate: 0.88,
  },
  {
    id: 'bright',
    label: 'Bright',
    description: 'Clear and energetic',
    geminiVoiceId: 'Zephyr',
    openaiVoiceId: 'alloy',
    ttsPrompt: 'Speak with bright, clear, and positive energy',
    pitch: 1.02,
    rate: 1.0,
  },
  {
    id: 'energetic',
    label: 'Energetic & Enthusiastic',
    description: 'Upbeat, lively, and motivating',
    geminiVoiceId: 'Puck',
    openaiVoiceId: 'echo',
    ttsPrompt: 'Speak with enthusiastic, upbeat, and motivating energy',
    pitch: 1.05,
    rate: 1.05,
  },
  {
    id: 'deep',
    label: 'Deep',
    description: 'Grounded and steady',
    geminiVoiceId: 'Gacrux',
    openaiVoiceId: 'onyx',
    ttsPrompt: 'Speak in a grounded, steady, and confident tone',
    pitch: 0.9,
    rate: 0.92,
  },
];

export const GEMINI_VOICES: SparkVoice[] = [
  { identifier: 'Sulafat', name: 'Sulafat', description: 'Warm', language: 'en-US', engine: 'gemini' },
  { identifier: 'Achird', name: 'Achird', description: 'Friendly', language: 'en-US', engine: 'gemini' },
  { identifier: 'Achernar', name: 'Achernar', description: 'Soft', language: 'en-US', engine: 'gemini' },
  { identifier: 'Vindemiatrix', name: 'Vindemiatrix', description: 'Gentle', language: 'en-US', engine: 'gemini' },
  { identifier: 'Zephyr', name: 'Zephyr', description: 'Bright', language: 'en-US', engine: 'gemini' },
  { identifier: 'Autonoe', name: 'Autonoe', description: 'Bright & clear', language: 'en-US', engine: 'gemini' },
  { identifier: 'Puck', name: 'Puck', description: 'Upbeat', language: 'en-US', engine: 'gemini' },
  { identifier: 'Fenrir', name: 'Fenrir', description: 'Excitable', language: 'en-US', engine: 'gemini' },
  { identifier: 'Laomedeia', name: 'Laomedeia', description: 'Upbeat & lively', language: 'en-US', engine: 'gemini' },
  { identifier: 'Kore', name: 'Kore', description: 'Firm & clear', language: 'en-US', engine: 'gemini' },
  { identifier: 'Charon', name: 'Charon', description: 'Informative', language: 'en-US', engine: 'gemini' },
  { identifier: 'Gacrux', name: 'Gacrux', description: 'Mature & grounded', language: 'en-US', engine: 'gemini' },
  { identifier: 'Aoede', name: 'Aoede', description: 'Breezy', language: 'en-US', engine: 'gemini' },
  { identifier: 'Enceladus', name: 'Enceladus', description: 'Breathy & natural', language: 'en-US', engine: 'gemini' },
  { identifier: 'Algieba', name: 'Algieba', description: 'Smooth', language: 'en-US', engine: 'gemini' },
  { identifier: 'Callirrhoe', name: 'Callirrhoe', description: 'Easy-going', language: 'en-US', engine: 'gemini' },
];

export const OPENAI_VOICES: SparkVoice[] = [
  { identifier: 'nova', name: 'Nova', description: 'Warm & friendly', language: 'en-US', engine: 'openai' },
  { identifier: 'shimmer', name: 'Shimmer', description: 'Soft & calm', language: 'en-US', engine: 'openai' },
  { identifier: 'alloy', name: 'Alloy', description: 'Bright & neutral', language: 'en-US', engine: 'openai' },
  { identifier: 'echo', name: 'Echo', description: 'Upbeat & clear', language: 'en-US', engine: 'openai' },
  { identifier: 'fable', name: 'Fable', description: 'Expressive & warm', language: 'en-US', engine: 'openai' },
  { identifier: 'onyx', name: 'Onyx', description: 'Deep & grounded', language: 'en-US', engine: 'openai' },
];

const GEMINI_VOICE_IDS = new Set(GEMINI_VOICES.map((v) => v.identifier));
const OPENAI_VOICE_IDS = new Set(OPENAI_VOICES.map((v) => v.identifier));
const STYLE_IDS = new Set(VOICE_STYLES.map((s) => s.id));

export function getAvailableVoices(engine: TtsEngine = 'openai'): SparkVoice[] {
  return engine === 'gemini' ? GEMINI_VOICES : OPENAI_VOICES;
}

export function formatVoiceLabel(voice: SparkVoice): string {
  return `${voice.name} — ${voice.description}`;
}

export function resolveVoicePreference(raw: unknown, engine: TtsEngine = 'openai'): VoicePreference {
  if (!raw || typeof raw !== 'object') {
    return voicePreferenceForEngine(DEFAULT_VOICE_PREFERENCE.styleId, engine);
  }

  const parsed = raw as Partial<VoicePreference>;
  const styleId =
    parsed.styleId && STYLE_IDS.has(parsed.styleId)
      ? parsed.styleId
      : DEFAULT_VOICE_PREFERENCE.styleId;

  const style = VOICE_STYLES.find((s) => s.id === styleId)!;

  if (engine === 'gemini') {
    if (parsed.voiceId && GEMINI_VOICE_IDS.has(parsed.voiceId)) {
      return { voiceId: parsed.voiceId, styleId };
    }
    return { voiceId: style.geminiVoiceId, styleId };
  }

  if (parsed.voiceId && OPENAI_VOICE_IDS.has(parsed.voiceId)) {
    return { voiceId: parsed.voiceId, styleId };
  }

  return { voiceId: style.openaiVoiceId, styleId };
}

export function voicePreferenceForEngine(styleId: string, engine: TtsEngine): VoicePreference {
  const style = VOICE_STYLES.find((s) => s.id === styleId) ?? VOICE_STYLES[0];
  return {
    voiceId: engine === 'gemini' ? style.geminiVoiceId : style.openaiVoiceId,
    styleId: style.id,
  };
}

export function getStyleForPreference(preference: VoicePreference) {
  const style =
    VOICE_STYLES.find((s) => s.id === preference.styleId) ??
    VOICE_STYLES.find((s) => s.id === DEFAULT_VOICE_PREFERENCE.styleId)!;

  return {
    ...style,
    voiceId: style.geminiVoiceId,
    openaiVoiceId: style.openaiVoiceId,
  };
}

export const VOICE_PREVIEW_TEXT = "Hey — I'm Spark. I'm here to lift your spirit today.";
