import { speakText, getAvailableVoices, primeAudioPlayback, stopSpeaking as stopSpeechOutput } from './speechSettings';

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
  onEnd?: () => void
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    onEnd?.();
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
    onEnd?.();
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();
}

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

export const speak = (
  text: string,
  preference?: import('./voiceConfig').VoicePreference
) => speakText(text, preference);

export function stopSpeaking(): void {
  stopSpeechOutput();
}

export { getAvailableVoices, primeAudioPlayback };
