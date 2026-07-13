export const GEMINI_MODELS = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast, capable, and cost-efficient',
  },
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Latest Flash model with strong reasoning',
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    description: 'Newest Flash — best balance of speed and quality',
  },
} as const;

export type GeminiModelId = keyof typeof GEMINI_MODELS;

export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-2.5-flash';

export const GEMINI_MODEL_IDS = Object.keys(GEMINI_MODELS) as GeminiModelId[];
