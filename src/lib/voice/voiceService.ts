import { speakText, getAvailableVoices, primeAudioPlayback, stopSpeaking as stopSpeechOutput } from './speechSettings';

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

export const speak = (
  text: string,
  preference?: import('./voiceConfig').VoicePreference
) => speakText(text, preference);

export function stopSpeaking(): void {
  stopSpeechOutput();
}

export { getAvailableVoices, primeAudioPlayback };
