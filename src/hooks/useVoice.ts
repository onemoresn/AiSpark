import { useCallback, useEffect, useRef, useState } from 'react';
import type { Voice } from 'expo-speech';
import * as VoiceService from '../lib/voice/voiceService';
import {
  DEFAULT_VOICE_PREFERENCE,
  VOICE_PREVIEW_TEXT,
  type VoicePreference,
} from '../lib/voice/voiceConfig';
import { getAppSettings } from '../lib/storage';
import {
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

  const loadVoiceSettings = useCallback(async () => {
    const settings = await getAppSettings();
    applyVoicePreference(settings.voicePreference);
    setVoicePreferenceState(settings.voicePreference);
    setVoiceEnabled(settings.voiceEnabled);
  }, []);

  useEffect(() => {
    loadVoiceSettings();

    (async () => {
      try {
        const voices = await VoiceService.getEnglishVoices();
        setAvailableVoices(voices);
      } catch {
        setAvailableVoices([]);
      }
    })();
  }, [loadVoiceSettings]);

  const applyConfiguration = useCallback(
    async (voiceEnabledNext: boolean, voicePreferenceNext: VoicePreference) => {
      applyVoicePreference(voicePreferenceNext);
      setVoicePreferenceState(voicePreferenceNext);
      setVoiceEnabled(voiceEnabledNext);
    },
    []
  );

  const previewVoice = useCallback(
    async (preference?: VoicePreference) => {
      if (preference) {
        applyVoicePreference(preference);
      }
      setIsPreviewing(true);
      VoiceService.stopSpeaking();
      await VoiceService.speak(VOICE_PREVIEW_TEXT);
      setIsPreviewing(false);
      applyVoicePreference(voicePreference);
    },
    [voicePreference]
  );

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
    availableVoices,
    voicePreference,
    applyConfiguration,
    previewVoice,
    startListening,
    stopListening,
    toggleListening,
    speak,
    reloadVoiceSettings: loadVoiceSettings,
  };
}
