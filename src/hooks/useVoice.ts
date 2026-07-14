import { useCallback, useEffect, useRef, useState } from 'react';
import * as VoiceService from '../lib/voice/voiceService';
import {
  DEFAULT_VOICE_PREFERENCE,
  VOICE_PREVIEW_TEXT,
  type SparkVoice,
  type VoicePreference,
} from '../lib/voice/voiceConfig';
import { getAppSettings } from '../lib/storage';
import {
  setVoicePreference as applyVoicePreference,
  syncVoicePreferenceFromStorage,
  getAvailableVoicesForSettings,
} from '../lib/voice/speechSettings';
import { resolveTtsEngine } from '../lib/voice/ttsRouter';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SparkVoice[]>([]);
  const [voicePreference, setVoicePreferenceState] = useState<VoicePreference>(
    DEFAULT_VOICE_PREFERENCE
  );
  const voicePreferenceRef = useRef(voicePreference);
  const voiceEnabledRef = useRef(voiceEnabled);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  voicePreferenceRef.current = voicePreference;
  voiceEnabledRef.current = voiceEnabled;

  const supported = VoiceService.isVoiceSupported();

  const loadVoiceSettings = useCallback(async () => {
    const settings = await getAppSettings();
    const engine = (await resolveTtsEngine(settings)) ?? 'openai';
    setAvailableVoices(getAvailableVoicesForSettings(engine));
    const pref = await syncVoicePreferenceFromStorage();
    setVoicePreferenceState(pref);
    setVoiceEnabled(settings.voiceEnabled);
  }, []);

  useEffect(() => {
    loadVoiceSettings();
  }, [loadVoiceSettings]);

  const applyConfiguration = useCallback(
    async (voiceEnabledNext: boolean, voicePreferenceNext: VoicePreference) => {
      applyVoicePreference(voicePreferenceNext);
      setVoicePreferenceState(voicePreferenceNext);
      setVoiceEnabled(voiceEnabledNext);
      const settings = await getAppSettings();
      const engine = (await resolveTtsEngine(settings)) ?? 'openai';
      setAvailableVoices(getAvailableVoicesForSettings(engine));
    },
    []
  );

  const previewVoice = useCallback(async (preference?: VoicePreference) => {
    VoiceService.primeAudioPlayback();
    const saved = await syncVoicePreferenceFromStorage();
    const previewPref = preference ?? saved;

    applyVoicePreference(previewPref);
    setIsPreviewing(true);
    VoiceService.stopSpeaking();

    try {
      await VoiceService.speak(VOICE_PREVIEW_TEXT, previewPref);
    } catch {
      // Preview failed — API key status in Settings shows details.
    } finally {
      setIsPreviewing(false);
      applyVoicePreference(saved);
      setVoicePreferenceState(saved);
    }
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

  const speak = useCallback(async (text: string, preference?: VoicePreference) => {
    if (!voiceEnabledRef.current || !text.trim()) return;

    VoiceService.primeAudioPlayback();
    setIsSpeaking(true);
    VoiceService.stopSpeaking();

    try {
      const pref = preference ?? voicePreferenceRef.current;
      await VoiceService.speak(text, pref);
    } catch {
      // Reply still visible — voice errors surface in Settings API test.
    } finally {
      setIsSpeaking(false);
    }
  }, []);

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
