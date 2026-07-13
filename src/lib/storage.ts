import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from './inspire/types';
import { DEFAULT_MODEL, MODELS, type ModelId } from './llm/modelConfig';
import type { VoicePreference } from './voice/voiceConfig';
import { DEFAULT_VOICE_PREFERENCE } from './voice/voiceConfig';
import { MAX_CHAT_MESSAGES } from '../constants/chat';

const CHAT_KEY = '@spark_chat_history';
const MODEL_KEY = '@spark_selected_model';
const LANDING_KEY = '@spark_seen_landing';
const VOICE_PREF_KEY = '@spark_voice_preference';

const VALID_MODEL_IDS = new Set(Object.keys(MODELS));

function isValidModelId(value: string): value is ModelId {
  return VALID_MODEL_IDS.has(value);
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

export async function getSelectedModel(): Promise<ModelId | null> {
  const value = await AsyncStorage.getItem(MODEL_KEY);
  if (value && isValidModelId(value)) return value;
  return null;
}

export async function setSelectedModel(modelId: ModelId): Promise<void> {
  await AsyncStorage.setItem(MODEL_KEY, modelId);
}

export async function hasSeenLanding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(LANDING_KEY);
  return value === 'true';
}

export async function setSeenLanding(): Promise<void> {
  await AsyncStorage.setItem(LANDING_KEY, 'true');
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

export async function saveVoicePreference(pref: VoicePreference): Promise<void> {
  await AsyncStorage.setItem(VOICE_PREF_KEY, JSON.stringify(pref));
}

export { DEFAULT_MODEL };
