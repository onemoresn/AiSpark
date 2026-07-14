import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from './inspire/types';
import {
  DEFAULT_LLM_PROVIDER,
  DEFAULT_MODELS,
  LLM_PROVIDER_IDS,
  resolveModelId,
  type LlmProviderId,
} from './llm/providersConfig';
import type { VoicePreference } from './voice/voiceConfig';
import { DEFAULT_VOICE_PREFERENCE, resolveVoicePreference } from './voice/voiceConfig';
import { MAX_CHAT_MESSAGES } from '../constants/chat';

const CHAT_KEY = '@spark_chat_history';
const PROVIDER_KEY = '@spark_llm_provider';
const MODELS_KEY = '@spark_llm_models';
const GEMINI_API_KEY = '@spark_gemini_api_key';
const OPENAI_API_KEY = '@spark_openai_api_key';
const ANTHROPIC_API_KEY = '@spark_anthropic_api_key';
const VOICE_ENABLED_KEY = '@spark_voice_enabled';
const LANDING_KEY = '@spark_seen_landing';
const VOICE_PREF_KEY = '@spark_voice_preference';

const LEGACY_GEMINI_MODEL_KEY = '@spark_gemini_model';

const API_KEY_BY_PROVIDER: Record<LlmProviderId, string> = {
  gemini: GEMINI_API_KEY,
  openai: OPENAI_API_KEY,
  anthropic: ANTHROPIC_API_KEY,
};

export interface LlmSettings {
  providerId: LlmProviderId;
  apiKey: string;
  modelId: string;
}

export interface AppSettings extends LlmSettings {
  apiKeys: Record<LlmProviderId, string>;
  modelIds: Record<LlmProviderId, string>;
  voiceEnabled: boolean;
  voicePreference: VoicePreference;
}

function emptyApiKeys(): Record<LlmProviderId, string> {
  return { gemini: '', openai: '', anthropic: '' };
}

function defaultModelIds(): Record<LlmProviderId, string> {
  return { ...DEFAULT_MODELS };
}

async function loadModelIds(): Promise<Record<LlmProviderId, string>> {
  const models = { ...DEFAULT_MODELS };

  try {
    const raw = await AsyncStorage.getItem(MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<LlmProviderId, string>>;
      for (const providerId of LLM_PROVIDER_IDS) {
        if (parsed[providerId]) {
          models[providerId] = resolveModelId(providerId, parsed[providerId] ?? null);
        }
      }
      return models;
    }
  } catch {
    // Fall through to legacy migration.
  }

  const legacyGeminiModel = await AsyncStorage.getItem(LEGACY_GEMINI_MODEL_KEY);
  if (legacyGeminiModel) {
    models.gemini = resolveModelId('gemini', legacyGeminiModel);
  }

  return models;
}

async function loadProviderId(): Promise<LlmProviderId> {
  const saved = await AsyncStorage.getItem(PROVIDER_KEY);
  if (saved && LLM_PROVIDER_IDS.includes(saved as LlmProviderId)) {
    return saved as LlmProviderId;
  }

  const geminiKey = await AsyncStorage.getItem(GEMINI_API_KEY);
  if (geminiKey?.trim()) return 'gemini';

  return DEFAULT_LLM_PROVIDER;
}

async function loadAllApiKeys(): Promise<Record<LlmProviderId, string>> {
  const entries = await Promise.all(
    LLM_PROVIDER_IDS.map(async (providerId) => {
      const value = await AsyncStorage.getItem(API_KEY_BY_PROVIDER[providerId]);
      return [providerId, value ?? ''] as const;
    })
  );
  return Object.fromEntries(entries) as Record<LlmProviderId, string>;
}

export async function getGeminiApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(GEMINI_API_KEY);
}

export async function getActiveLlmSettings(): Promise<LlmSettings> {
  const [providerId, apiKeys, modelIds] = await Promise.all([
    loadProviderId(),
    loadAllApiKeys(),
    loadModelIds(),
  ]);

  return {
    providerId,
    apiKey: apiKeys[providerId] ?? '',
    modelId: modelIds[providerId] ?? DEFAULT_MODELS[providerId],
  };
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

export async function getVoiceEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(VOICE_ENABLED_KEY);
  if (value === 'false') return false;
  return true;
}

export async function getStoredVoicePreference(): Promise<VoicePreference> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_PREF_KEY);
    if (!raw) return { ...DEFAULT_VOICE_PREFERENCE };
    return resolveVoicePreference(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_VOICE_PREFERENCE };
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  const [providerId, apiKeys, modelIds, voiceEnabled, voicePreference] = await Promise.all([
    loadProviderId(),
    loadAllApiKeys(),
    loadModelIds(),
    getVoiceEnabled(),
    getStoredVoicePreference(),
  ]);

  return {
    providerId,
    apiKey: apiKeys[providerId] ?? '',
    modelId: modelIds[providerId] ?? DEFAULT_MODELS[providerId],
    apiKeys,
    modelIds,
    voiceEnabled,
    voicePreference,
  };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(PROVIDER_KEY, settings.providerId);

  const nextApiKeys = {
    ...emptyApiKeys(),
    ...settings.apiKeys,
    [settings.providerId]: settings.apiKey.trim(),
  };

  for (const providerId of LLM_PROVIDER_IDS) {
    const trimmed = nextApiKeys[providerId].trim();
    const storageKey = API_KEY_BY_PROVIDER[providerId];
    if (trimmed) {
      await AsyncStorage.setItem(storageKey, trimmed);
    } else {
      await AsyncStorage.removeItem(storageKey);
    }
  }

  const nextModelIds = {
    ...defaultModelIds(),
    ...settings.modelIds,
    [settings.providerId]: settings.modelId,
  };
  await AsyncStorage.setItem(MODELS_KEY, JSON.stringify(nextModelIds));

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

// Legacy helpers used by geminiService
export async function getSelectedGeminiModel(): Promise<string | null> {
  const modelIds = await loadModelIds();
  return modelIds.gemini;
}
