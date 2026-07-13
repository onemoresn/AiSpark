import * as Speech from 'expo-speech';
import { getSpeechOptions } from './speechSettings';

export function isVoiceSupported(): boolean {
  return true;
}

export function startListening(
  _onResult: (text: string, isFinal: boolean) => void,
  onError?: (message: string) => void
): void {
  onError?.('Voice input works on web. On mobile, type or use the web version in Chrome.');
}

export function stopListening(): void {}

export async function speak(text: string): Promise<void> {
  const clean = text.replace(/\n+/g, '. ').slice(0, 500);
  return new Promise((resolve) => {
    Speech.speak(clean, {
      ...getSpeechOptions(),
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export { getEnglishVoices } from './speechSettings';
