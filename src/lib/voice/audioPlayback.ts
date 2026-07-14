export function primeAudioPlayback(): void {}

export function stopAudioPlayback(): void {}

export async function playGeminiAudio(_data: string, _mimeType: string): Promise<void> {
  throw new Error('Gemini audio playback is only supported on web');
}

export async function playPcmBase64(_base64Pcm: string): Promise<void> {
  throw new Error('Gemini audio playback is only supported on web');
}

export function canPlayGeminiAudio(): boolean {
  return false;
}
