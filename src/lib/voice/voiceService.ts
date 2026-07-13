import * as Speech from 'expo-speech';
import { speakText, getEnglishVoices } from './speechSettings';

export function isVoiceSupported(): boolean {
  return false;
}

export function startListening(
  _onResult: (text: string, isFinal: boolean) => void,
  onEnd?: () => void
): void {
  onEnd?.();
}

export function stopListening(): void {}

export const speak = speakText;

export function stopSpeaking(): void {
  Speech.stop();
}

export { getEnglishVoices };
