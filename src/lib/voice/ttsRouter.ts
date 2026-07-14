import type { LlmProviderId } from '../llm/providersConfig';
import { getAppSettings, type AppSettings } from '../storage';
import type { TtsEngine } from './voiceConfig';

export async function resolveTtsEngine(settings?: AppSettings): Promise<TtsEngine | null> {
  const config = settings ?? (await getAppSettings());
  const { providerId, apiKeys } = config;

  if (providerId === 'gemini' && apiKeys.gemini.trim()) {
    return 'gemini';
  }

  if (providerId === 'anthropic' && apiKeys.openai.trim()) {
    return 'openai';
  }

  if (providerId === 'openai' && apiKeys.openai.trim()) {
    return 'openai';
  }

  if (apiKeys.openai.trim()) return 'openai';
  if (apiKeys.gemini.trim()) return 'gemini';

  return null;
}

export function resolveTtsEngineSync(
  providerId: LlmProviderId,
  apiKeys: Record<LlmProviderId, string>
): TtsEngine | null {
  if (providerId === 'gemini' && apiKeys.gemini.trim()) return 'gemini';
  if (providerId === 'anthropic' && apiKeys.openai.trim()) return 'openai';
  if (providerId === 'openai' && apiKeys.openai.trim()) return 'openai';
  if (apiKeys.openai.trim()) return 'openai';
  if (apiKeys.gemini.trim()) return 'gemini';
  return null;
}

export async function getTtsApiKey(engine: TtsEngine, settings?: AppSettings): Promise<string | null> {
  const config = settings ?? (await getAppSettings());
  const key = engine === 'openai' ? config.apiKeys.openai : config.apiKeys.gemini;
  return key.trim() || null;
}

export function describeTtsSetup(
  providerId: LlmProviderId,
  apiKeys: Record<LlmProviderId, string>
): string {
  const engine = resolveTtsEngineSync(providerId, apiKeys);
  if (engine === 'openai') {
    return providerId === 'anthropic'
      ? 'Natural voice uses OpenAI TTS with your ChatGPT API key.'
      : 'Natural voice uses OpenAI TTS.';
  }
  if (engine === 'gemini') {
    return 'Natural voice uses Gemini TTS.';
  }
  if (providerId === 'anthropic') {
    return 'Add a ChatGPT API key (switch provider) for natural voice without Gemini.';
  }
  return 'Add an API key that supports natural voice (Gemini or ChatGPT).';
}
