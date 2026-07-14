export const LLM_PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    brand: 'Google',
    keyPlaceholder: 'Paste your Gemini API key',
    keyHint: 'Get a free key at Google AI Studio. Stored locally on your device.',
    keyUrl: 'https://aistudio.google.com/apikey',
    minKeyLength: 20,
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT',
    brand: 'OpenAI',
    keyPlaceholder: 'Paste your OpenAI API key',
    keyHint: 'Get a key at platform.openai.com. Stored locally on your device.',
    keyUrl: 'https://platform.openai.com/api-keys',
    minKeyLength: 20,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Claude',
    brand: 'Anthropic',
    keyPlaceholder: 'Paste your Anthropic API key',
    keyHint: 'Get a key at console.anthropic.com. Stored locally on your device.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    minKeyLength: 20,
  },
} as const;

export type LlmProviderId = keyof typeof LLM_PROVIDERS;

export const LLM_PROVIDER_IDS = Object.keys(LLM_PROVIDERS) as LlmProviderId[];

export const DEFAULT_LLM_PROVIDER: LlmProviderId = 'anthropic';

export const PROVIDER_MODELS = {
  gemini: {
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
  },
  openai: {
    'gpt-4o': {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Flagship multimodal model — strong and versatile',
    },
    'gpt-4o-mini': {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      description: 'Fast and affordable for everyday chat',
    },
    'gpt-4.1-mini': {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 mini',
      description: 'Latest mini model with improved reasoning',
    },
  },
  anthropic: {
    'claude-sonnet-4-20250514': {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      description: 'Best balance of intelligence and speed',
    },
    'claude-opus-4-20250514': {
      id: 'claude-opus-4-20250514',
      name: 'Claude Opus 4',
      description: 'Most capable — for complex reasoning',
    },
    'claude-3-5-haiku-20241022': {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Fastest responses at lower cost',
    },
  },
} as const;

export type ProviderModelId<P extends LlmProviderId = LlmProviderId> =
  keyof (typeof PROVIDER_MODELS)[P];

export const DEFAULT_MODELS: Record<LlmProviderId, string> = {
  gemini: 'gemini-3.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
};

export function getProviderModelIds(providerId: LlmProviderId): string[] {
  return Object.keys(PROVIDER_MODELS[providerId]);
}

export function resolveModelId(providerId: LlmProviderId, modelId: string | null): string {
  const catalog = PROVIDER_MODELS[providerId];
  if (modelId && modelId in catalog) return modelId;
  return DEFAULT_MODELS[providerId];
}

export function getModelName(providerId: LlmProviderId, modelId: string): string {
  const catalog = PROVIDER_MODELS[providerId] as Record<
    string,
    { name: string; description: string }
  >;
  return catalog[modelId]?.name ?? catalog[DEFAULT_MODELS[providerId]]?.name ?? modelId;
}

export function getProviderName(providerId: LlmProviderId): string {
  return LLM_PROVIDERS[providerId].name;
}
