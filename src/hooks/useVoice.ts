import { useCallback, useEffect, useRef, useState } from 'react';
import type { Voice } from 'expo-speech';
import * as VoiceService from '../lib/voice/voiceService';
import {
  DEFAULT_VOICE_PREFERENCE,
  VOICE_PREVIEW_TEXT,
  type VoicePreference,
} from '../lib/voice/voiceConfig';
import {
  getStoredVoicePreference,
  saveVoicePreference,
} from '../lib/storage';
import {
  getVoicePreference,
  setVoicePreference as applyVoicePreference,
} from '../lib/voice/speechSettings';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voicePreference, setVoicePreferenceState] = useState<VoicePreference>(
    DEFAULT_VOICE_PREFERENCE
  );
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  const supported = VoiceService.isVoiceSupported();

  useEffect(() => {
    (async () => {
      const stored = await getStoredVoicePreference();
      applyVoicePreference(stored);
      setVoicePreferenceState(stored);

      try {
        const voices = await VoiceService.getEnglishVoices();
        setAvailableVoices(voices);
      } catch {
        setAvailableVoices([]);
      }
    })();
  }, []);

  const updateVoicePreference = useCallback(async (next: VoicePreference) => {
    applyVoicePreference(next);
    setVoicePreferenceState(next);
    await saveVoicePreference(next);
  }, []);

  const selectVoice = useCallback(
    async (voiceId: string | null) => {
      await updateVoicePreference({ ...getVoicePreference(), voiceId });
    },
    [updateVoicePreference]
  );

  const selectVoiceStyle = useCallback(
    async (pitch: number, rate: number) => {
      await updateVoicePreference({ ...getVoicePreference(), pitch, rate });
    },
    [updateVoicePreference]
  );

  const previewVoice = useCallback(async () => {
    setIsPreviewing(true);
    VoiceService.stopSpeaking();
    await VoiceService.speak(VOICE_PREVIEW_TEXT);
    setIsPreviewing(false);
  }, []);

  const startListening = useCallback((onFinal?: (text: string) => void) => {
    if (!supported) return;
    onFinalRef.current = onFinal ?? null;
    setTranscript('');
    setIsListening(true);

    VoiceService.startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim()) {
          onFinalRef.current?.(text.trim());
          setTranscript('');
        }
      },
      () => setIsListening(false)
    );
  }, [supported]);

  const stopListening = useCallback(() => {
    VoiceService.stopListening();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceEnabled || !text.trim()) return;
      setIsSpeaking(true);
      VoiceService.stopSpeaking();
      await VoiceService.speak(text);
      setIsSpeaking(false);
    },
    [voiceEnabled]
  );

  const toggleListening = useCallback(
    (onFinal?: (text: string) => void) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(onFinal);
      }
    },
    [isListening, startListening, stopListening]
  );

  useEffect(() => {
    return () => {
      VoiceService.stopListening();
      VoiceService.stopSpeaking();
    };
  }, []);

  return {
    supported,
    isListening,
    isSpeaking,
    isPreviewing,
    transcript,
    voiceEnabled,
    setVoiceEnabled,
    availableVoices,
    voicePreference,
    selectVoice,
    selectVoiceStyle,
    previewVoice,
    startListening,
    stopListening,
    toggleListening,
    speak,
  };
}
