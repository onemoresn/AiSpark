import { Platform } from 'react-native';

export function isOnDeviceLLMSupported(): boolean {
  return false;
}

export async function getModelPath(): Promise<string | null> {
  return null;
}

export async function isModelDownloaded(): Promise<boolean> {
  return false;
}

export async function downloadModel(
  _modelId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(1);
  return '';
}

export async function deleteModel(): Promise<void> {}

export async function initModel(): Promise<never> {
  throw new Error('On-device models are not available on web');
}

export function isModelReady(): boolean {
  return false;
}

export async function releaseModel(): Promise<void> {}

export async function generateCompletion(): Promise<string> {
  return '';
}

export const isWebPlatform = Platform.OS === 'web';
