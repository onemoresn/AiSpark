export type ModelId = 'gemma-2-2b' | 'gemma-3-4b';

export interface ModelOption {
  id: ModelId;
  name: string;
  fileName: string;
  sizeLabel: string;
  description: string;
  minRam: string;
  url: string;
}

export const MODELS: Record<ModelId, ModelOption> = {
  'gemma-2-2b': {
    id: 'gemma-2-2b',
    name: 'Gemma 2 2B',
    fileName: 'gemma-2-2b-it-Q4_K_M.gguf',
    sizeLabel: '1.7 GB',
    description: 'Recommended — fast and smooth on most iPhones (6s and newer).',
    minRam: '3 GB RAM',
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
  },
  'gemma-3-4b': {
    id: 'gemma-3-4b',
    name: 'Gemma 3 4B',
    fileName: 'gemma-3-4b-it-Q4_K_M.gguf',
    sizeLabel: '2.5 GB',
    description: 'Smarter responses — best on iPhone 12 and newer with 6 GB RAM.',
    minRam: '6 GB RAM',
    url: 'https://huggingface.co/bartowski/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf',
  },
};

export const DEFAULT_MODEL: ModelId = 'gemma-2-2b';

export const STOP_WORDS = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|end_of_turn|>',
  '<|endoftext|>',
];
