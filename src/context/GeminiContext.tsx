import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  type GeminiModelId,
} from '../lib/llm/geminiConfig';
import {
  refreshGeminiConfig,
  isModelReady,
} from '../lib/llm/geminiService';
import {
  getAppSettings,
  saveAppSettings,
  type AppSettings,
} from '../lib/storage';

interface GeminiContextValue {
  modelId: GeminiModelId;
  modelName: string;
  hasApiKey: boolean;
  isReady: boolean;
  reloadSettings: () => Promise<void>;
  saveConfiguration: (settings: AppSettings) => Promise<void>;
}

const GeminiContext = createContext<GeminiContextValue | null>(null);

export function GeminiProvider({ children }: { children: React.ReactNode }) {
  const [modelId, setModelId] = useState<GeminiModelId>(DEFAULT_GEMINI_MODEL);
  const [hasApiKey, setHasApiKey] = useState(false);

  const reloadSettings = useCallback(async () => {
    const settings = await getAppSettings();
    setModelId(settings.modelId);
    await refreshGeminiConfig();
    setHasApiKey(isModelReady());
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  const saveConfiguration = useCallback(
    async (settings: AppSettings) => {
      await saveAppSettings(settings);
      await reloadSettings();
    },
    [reloadSettings]
  );

  const value = useMemo<GeminiContextValue>(
    () => ({
      modelId,
      modelName: GEMINI_MODELS[modelId].name,
      hasApiKey,
      isReady: hasApiKey,
      reloadSettings,
      saveConfiguration,
    }),
    [modelId, hasApiKey, reloadSettings, saveConfiguration]
  );

  return <GeminiContext.Provider value={value}>{children}</GeminiContext.Provider>;
}

export function useGemini(): GeminiContextValue {
  const ctx = useContext(GeminiContext);
  if (!ctx) throw new Error('useGemini must be used within GeminiProvider');
  return ctx;
}
