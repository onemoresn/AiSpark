export const GEMINI_MODELS = {
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    description: 'Newest Flash — best balance of speed and quality',
  },
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Latest Flash model with strong reasoning',
  },
} as const;

export type GeminiModelId = keyof typeof GEMINI_MODELS;

export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-3.5-flash';

/** Models tried in order when the selected chat model fails */
export const CHAT_MODEL_FALLBACKS: GeminiModelId[] = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
];

export const GEMINI_MODEL_IDS = Object.keys(GEMINI_MODELS) as GeminiModelId[];
