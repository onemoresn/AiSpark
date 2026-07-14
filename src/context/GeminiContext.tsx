import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  refreshLlmConfig,
  isModelReady,
} from '../lib/llm/llmService';
import {
  DEFAULT_LLM_PROVIDER,
  DEFAULT_MODELS,
  getModelName,
  getProviderName,
  type LlmProviderId,
} from '../lib/llm/providersConfig';
import {
  getAppSettings,
  saveAppSettings,
  type AppSettings,
} from '../lib/storage';

interface GeminiContextValue {
  providerId: LlmProviderId;
  providerName: string;
  modelId: string;
  modelName: string;
  hasApiKey: boolean;
  isReady: boolean;
  reloadSettings: () => Promise<void>;
  saveConfiguration: (settings: AppSettings) => Promise<void>;
}

const GeminiContext = createContext<GeminiContextValue | null>(null);

export function GeminiProvider({ children }: { children: React.ReactNode }) {
  const [providerId, setProviderId] = useState<LlmProviderId>(DEFAULT_LLM_PROVIDER);
  const [modelId, setModelId] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  const reloadSettings = useCallback(async () => {
    const settings = await getAppSettings();
    setProviderId(settings.providerId);
    setModelId(settings.modelId);
    await refreshLlmConfig();
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
      providerId,
      providerName: getProviderName(providerId),
      modelId,
      modelName: getModelName(providerId, modelId || DEFAULT_MODELS[providerId]),
      hasApiKey,
      isReady: hasApiKey,
      reloadSettings,
      saveConfiguration,
    }),
    [providerId, modelId, hasApiKey, reloadSettings, saveConfiguration]
  );

  return <GeminiContext.Provider value={value}>{children}</GeminiContext.Provider>;
}

export function useGemini(): GeminiContextValue {
  const ctx = useContext(GeminiContext);
  if (!ctx) throw new Error('useGemini must be used within GeminiProvider');
  return ctx;
}
