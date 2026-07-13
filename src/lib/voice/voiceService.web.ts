import * as Speech from 'expo-speech';
import { getSpeechOptions } from './speechSettings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognition: any = null;

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startListening(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (message: string) => void
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    onError?.('Voice is not supported in this browser. Try Chrome or Edge.');
    return;
  }

  stopListening();

  recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    onResult(transcript.trim(), isFinal);
  };

  recognition.onerror = () => {
    onError?.('Could not hear you clearly. Try again.');
  };

  recognition.start();
}

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

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
