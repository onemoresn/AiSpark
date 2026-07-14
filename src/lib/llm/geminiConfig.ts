import { DEFAULT_MODELS, PROVIDER_MODELS } from './providersConfig';

export const GEMINI_MODELS = PROVIDER_MODELS.gemini;

export type GeminiModelId = keyof typeof GEMINI_MODELS;

export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-3.5-flash';

export const CHAT_MODEL_FALLBACKS: GeminiModelId[] = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
];

export const GEMINI_MODEL_IDS = CHAT_MODEL_FALLBACKS;

export { DEFAULT_MODELS };
