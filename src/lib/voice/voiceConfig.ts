export interface SparkVoice {
  identifier: string;
  name: string;
  description: string;
  language: string;
}

export interface VoicePreference {
  voiceId: string;
  styleId: string;
}

export const DEFAULT_VOICE_PREFERENCE: VoicePreference = {
  voiceId: 'Sulafat',
  styleId: 'warm',
};

export const VOICE_STYLES: Array<{
  id: string;
  label: string;
  description: string;
  voiceId: string;
  ttsPrompt: string;
  /** Fallback pitch/rate when Gemini TTS is unavailable */
  pitch: number;
  rate: number;
}> = [
  {
    id: 'warm',
    label: 'Warm',
    description: 'Friendly and uplifting',
    voiceId: 'Sulafat',
    ttsPrompt: 'Speak in a warm, friendly, and uplifting tone',
    pitch: 1.0,
    rate: 0.95,
  },
  {
    id: 'calm',
    label: 'Calm',
    description: 'Soft and reassuring',
    voiceId: 'Achernar',
    ttsPrompt: 'Speak softly and calmly, with a gentle reassuring pace',
    pitch: 0.95,
    rate: 0.88,
  },
  {
    id: 'bright',
    label: 'Bright',
    description: 'Clear and energetic',
    voiceId: 'Zephyr',
    ttsPrompt: 'Speak with bright, clear, and positive energy',
    pitch: 1.02,
    rate: 1.0,
  },
  {
    id: 'energetic',
    label: 'Energetic & Enthusiastic',
    description: 'Upbeat, lively, and motivating',
    voiceId: 'Puck',
    ttsPrompt: 'Speak with enthusiastic, upbeat, and motivating energy',
    pitch: 1.05,
    rate: 1.05,
  },
  {
    id: 'deep',
    label: 'Deep',
    description: 'Grounded and steady',
    voiceId: 'Gacrux',
    ttsPrompt: 'Speak in a grounded, steady, and confident tone',
    pitch: 0.9,
    rate: 0.92,
  },
];

/** Curated Gemini neural voices — natural-sounding, motivational-friendly */
export const GEMINI_VOICES: SparkVoice[] = [
  { identifier: 'Sulafat', name: 'Sulafat', description: 'Warm', language: 'en-US' },
  { identifier: 'Achird', name: 'Achird', description: 'Friendly', language: 'en-US' },
  { identifier: 'Achernar', name: 'Achernar', description: 'Soft', language: 'en-US' },
  { identifier: 'Vindemiatrix', name: 'Vindemiatrix', description: 'Gentle', language: 'en-US' },
  { identifier: 'Zephyr', name: 'Zephyr', description: 'Bright', language: 'en-US' },
  { identifier: 'Autonoe', name: 'Autonoe', description: 'Bright & clear', language: 'en-US' },
  { identifier: 'Puck', name: 'Puck', description: 'Upbeat', language: 'en-US' },
  { identifier: 'Fenrir', name: 'Fenrir', description: 'Excitable', language: 'en-US' },
  { identifier: 'Laomedeia', name: 'Laomedeia', description: 'Upbeat & lively', language: 'en-US' },
  { identifier: 'Kore', name: 'Kore', description: 'Firm & clear', language: 'en-US' },
  { identifier: 'Charon', name: 'Charon', description: 'Informative', language: 'en-US' },
  { identifier: 'Gacrux', name: 'Gacrux', description: 'Mature & grounded', language: 'en-US' },
  { identifier: 'Aoede', name: 'Aoede', description: 'Breezy', language: 'en-US' },
  { identifier: 'Enceladus', name: 'Enceladus', description: 'Breathy & natural', language: 'en-US' },
  { identifier: 'Algieba', name: 'Algieba', description: 'Smooth', language: 'en-US' },
  { identifier: 'Callirrhoe', name: 'Callirrhoe', description: 'Easy-going', language: 'en-US' },
];

const GEMINI_VOICE_IDS = new Set(GEMINI_VOICES.map((v) => v.identifier));
const STYLE_IDS = new Set(VOICE_STYLES.map((s) => s.id));

export function getAvailableVoices(): SparkVoice[] {
  return GEMINI_VOICES;
}

export function formatVoiceLabel(voice: SparkVoice): string {
  return `${voice.name} — ${voice.description}`;
}

export function resolveVoicePreference(raw: unknown): VoicePreference {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_VOICE_PREFERENCE };
  }

  const parsed = raw as Partial<VoicePreference> & { pitch?: number; rate?: number };
  const styleId =
    parsed.styleId && STYLE_IDS.has(parsed.styleId)
      ? parsed.styleId
      : DEFAULT_VOICE_PREFERENCE.styleId;

  if (parsed.voiceId && GEMINI_VOICE_IDS.has(parsed.voiceId)) {
    return { voiceId: parsed.voiceId, styleId };
  }

  const style = VOICE_STYLES.find((s) => s.id === styleId);
  return {
    voiceId: style?.voiceId ?? DEFAULT_VOICE_PREFERENCE.voiceId,
    styleId,
  };
}

export function getStyleForPreference(preference: VoicePreference) {
  return (
    VOICE_STYLES.find((s) => s.id === preference.styleId) ??
    VOICE_STYLES.find((s) => s.id === DEFAULT_VOICE_PREFERENCE.styleId)!
  );
}

export const VOICE_PREVIEW_TEXT = "Hey — I'm Spark. I'm here to lift your spirit today.";
