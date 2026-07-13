import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from './inspire/types';
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  type GeminiModelId,
} from './llm/geminiConfig';
import type { VoicePreference } from './voice/voiceConfig';
import { DEFAULT_VOICE_PREFERENCE } from './voice/voiceConfig';
import { MAX_CHAT_MESSAGES } from '../constants/chat';

const CHAT_KEY = '@spark_chat_history';
const GEMINI_API_KEY = '@spark_gemini_api_key';
const GEMINI_MODEL_KEY = '@spark_gemini_model';
const VOICE_ENABLED_KEY = '@spark_voice_enabled';
const LANDING_KEY = '@spark_seen_landing';
const VOICE_PREF_KEY = '@spark_voice_preference';

const VALID_MODEL_IDS = new Set(Object.keys(GEMINI_MODELS));

const LEGACY_MODEL_IDS: Record<string, GeminiModelId> = {
  'gemini-3.5-flash-preview': 'gemini-3.5-flash',
};

function isValidModelId(value: string): value is GeminiModelId {
  return VALID_MODEL_IDS.has(value);
}

function resolveModelId(value: string | null): GeminiModelId {
  if (value && isValidModelId(value)) return value;
  if (value && LEGACY_MODEL_IDS[value]) return LEGACY_MODEL_IDS[value];
  return DEFAULT_GEMINI_MODEL;
}

export interface AppSettings {
  apiKey: string;
  modelId: GeminiModelId;
  voiceEnabled: boolean;
  voicePreference: VoicePreference;
}

export async function loadChatHistory(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_CHAT_MESSAGES);
  await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(CHAT_KEY);
}

export async function getGeminiApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(GEMINI_API_KEY);
}

export async function getSelectedGeminiModel(): Promise<GeminiModelId | null> {
  const value = await AsyncStorage.getItem(GEMINI_MODEL_KEY);
  if (!value) return null;
  return resolveModelId(value);
}

export async function getVoiceEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(VOICE_ENABLED_KEY);
  if (value === 'false') return false;
  return true;
}

export async function getStoredVoicePreference(): Promise<VoicePreference> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_PREF_KEY);
    if (!raw) return { ...DEFAULT_VOICE_PREFERENCE };
    const parsed = JSON.parse(raw) as VoicePreference;
    return {
      voiceId: parsed.voiceId ?? null,
      pitch: parsed.pitch ?? DEFAULT_VOICE_PREFERENCE.pitch,
      rate: parsed.rate ?? DEFAULT_VOICE_PREFERENCE.rate,
    };
  } catch {
    return { ...DEFAULT_VOICE_PREFERENCE };
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  const [apiKey, modelId, voiceEnabled, voicePreference] = await Promise.all([
    getGeminiApiKey(),
    getSelectedGeminiModel(),
    getVoiceEnabled(),
    getStoredVoicePreference(),
  ]);

  return {
    apiKey: apiKey ?? '',
    modelId: modelId ?? DEFAULT_GEMINI_MODEL,
    voiceEnabled,
    voicePreference,
  };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const trimmedKey = settings.apiKey.trim();
  if (trimmedKey) {
    await AsyncStorage.setItem(GEMINI_API_KEY, trimmedKey);
  } else {
    await AsyncStorage.removeItem(GEMINI_API_KEY);
  }

  await AsyncStorage.setItem(GEMINI_MODEL_KEY, settings.modelId);
  await AsyncStorage.setItem(
    VOICE_ENABLED_KEY,
    settings.voiceEnabled ? 'true' : 'false'
  );
  await AsyncStorage.setItem(
    VOICE_PREF_KEY,
    JSON.stringify(settings.voicePreference)
  );
}

export async function hasSeenLanding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(LANDING_KEY);
  return value === 'true';
}

export async function setSeenLanding(): Promise<void> {
  await AsyncStorage.setItem(LANDING_KEY, 'true');
}
