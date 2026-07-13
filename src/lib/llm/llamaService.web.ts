import { DEFAULT_MODEL, type ModelId } from './modelConfig';

export function isOnDeviceLLMSupported(): boolean {
  return false;
}

export async function getModelPath(_modelId: ModelId = DEFAULT_MODEL): Promise<string | null> {
  return null;
}

export async function isModelDownloaded(_modelId?: ModelId): Promise<boolean> {
  return false;
}

export async function downloadModel(
  _modelId: ModelId,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(1);
  return '';
}

export async function initModel(): Promise<never> {
  throw new Error('On-device models are not available on web');
}

export function isModelReady(): boolean {
  return false;
}

export async function releaseModel(): Promise<void> {}

interface CompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCompletion(
  _messages: CompletionMessage[],
  _maxTokens = 350
): Promise<string> {
  return '';
}
