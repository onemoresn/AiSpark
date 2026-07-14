import type { LlmProviderId } from './providersConfig';
import {
  DEFAULT_LLM_PROVIDER,
  DEFAULT_MODELS,
  getModelName,
  getProviderName,
  resolveModelId,
} from './providersConfig';
import { generateAnthropicCompletion, testAnthropicChat } from './anthropicService';
import { generateOpenAiCompletion, testOpenAiChat } from './openaiService';
import { generateCompletion as generateGeminiCompletion, refreshGeminiConfig } from './geminiService';
import { validateGeminiApiKey, type ApiKeyValidation } from './geminiApi';
import { parseLlmError } from './llmFetch';
import { testOpenAiVoice } from '../voice/openaiTtsService';
import { resolveTtsEngineSync } from '../voice/ttsRouter';
import {
  getActiveLlmSettings,
  getGeminiApiKey,
  type LlmSettings,
} from '../storage';

export type { ApiKeyValidation };

type ChatRole = 'system' | 'user' | 'assistant';

let cachedSettings: LlmSettings | null = null;

export async function refreshLlmConfig(): Promise<void> {
  cachedSettings = await getActiveLlmSettings();
  await refreshGeminiConfig();
}

export function isModelReady(): boolean {
  return !!cachedSettings?.apiKey?.trim();
}

export function getActiveProviderId(): LlmProviderId {
  return cachedSettings?.providerId ?? DEFAULT_LLM_PROVIDER;
}

export function getActiveModelName(): string {
  if (!cachedSettings) return getModelName(DEFAULT_LLM_PROVIDER, DEFAULT_MODELS[DEFAULT_LLM_PROVIDER]);
  return getModelName(cachedSettings.providerId, cachedSettings.modelId);
}

export function getActiveProviderName(): string {
  return getProviderName(cachedSettings?.providerId ?? DEFAULT_LLM_PROVIDER);
}

export async function generateCompletion(
  messages: Array<{ role: ChatRole; content: string }>
): Promise<string> {
  if (!cachedSettings) await refreshLlmConfig();
  const settings = cachedSettings!;
  const apiKey = settings.apiKey.trim();
  if (!apiKey) throw new Error('No API key configured for the selected provider');

  switch (settings.providerId) {
    case 'openai':
      return generateOpenAiCompletion(apiKey, settings.modelId, messages);
    case 'anthropic':
      return generateAnthropicCompletion(apiKey, settings.modelId, messages);
    case 'gemini':
    default:
      return generateGeminiCompletion(messages);
  }
}

export async function validateProviderApiKey(
  providerId: LlmProviderId,
  apiKey: string,
  modelId: string,
  allApiKeys?: Record<LlmProviderId, string>
): Promise<ApiKeyValidation> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return {
      chatOk: false,
      voiceOk: false,
      status: 'empty',
      message: `Paste your ${getProviderName(providerId)} API key above.`,
    };
  }

  if (providerId === 'gemini') {
    return validateGeminiApiKey(
      trimmed,
      resolveModelId(providerId, modelId) as 'gemini-3.5-flash' | 'gemini-3-flash-preview'
    );
  }

  let chatOk = false;
  let chatError = '';
  const resolvedModel = resolveModelId(providerId, modelId);

  try {
    if (providerId === 'openai') {
      await testOpenAiChat(trimmed, resolvedModel);
    } else {
      await testAnthropicChat(trimmed, resolvedModel);
    }
    chatOk = true;
  } catch (err) {
    chatError = parseLlmError(err, 'Chat API check failed');
  }

  const keys = allApiKeys ?? { gemini: '', openai: '', anthropic: '' };
  const ttsEngine = resolveTtsEngineSync(providerId, keys);

  let voiceOk = false;
  let voiceError = '';

  if (ttsEngine === 'openai' && keys.openai.trim()) {
    try {
      await testOpenAiVoice(keys.openai.trim());
      voiceOk = true;
    } catch (err) {
      voiceError = parseLlmError(err, 'Natural voice check failed');
    }
  } else if (ttsEngine === 'gemini' && keys.gemini.trim()) {
    try {
      const { testGeminiVoice } = await import('./geminiApi');
      await testGeminiVoice(keys.gemini.trim());
      voiceOk = true;
    } catch (err) {
      voiceError = parseLlmError(err, 'Natural voice check failed');
    }
  }

  if (chatOk && voiceOk) {
    const voiceLabel = ttsEngine === 'openai' ? 'OpenAI TTS' : 'Gemini TTS';
    return {
      chatOk: true,
      voiceOk: true,
      status: 'ok',
      message: `${getProviderName(providerId)} chat works — natural voice is ready (${voiceLabel}).`,
    };
  }

  if (chatOk && !voiceOk) {
    return {
      chatOk: true,
      voiceOk: false,
      status: 'partial',
      message: ttsEngine
        ? `${getProviderName(providerId)} chat works. Voice failed: ${voiceError}`
        : `${getProviderName(providerId)} chat works. Add a ChatGPT API key for natural voice (Claude users).`,
    };
  }

  return {
    chatOk: false,
    voiceOk,
    status: 'fail',
    message: chatError || 'API key is not working.',
  };
}

export async function hasGeminiVoiceKey(): Promise<boolean> {
  const key = await getGeminiApiKey();
  return !!key?.trim();
}
