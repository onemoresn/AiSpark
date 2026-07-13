import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  downloadModel,
  initModel,
  isModelDownloaded,
  isOnDeviceLLMSupported,
  releaseModel,
} from '../lib/llm/llamaService';
import { DEFAULT_MODEL, MODELS, type ModelId } from '../lib/llm/modelConfig';
import { getSelectedModel, setSelectedModel as persistModel } from '../lib/storage';

type SetupStatus = 'checking' | 'needs_download' | 'downloading' | 'loading' | 'ready' | 'error';

interface LlamaContextValue {
  status: SetupStatus;
  progress: number;
  error: string | null;
  modelId: ModelId;
  modelName: string;
  isReady: boolean;
  isWeb: boolean;
  selectModel: (id: ModelId) => void;
  downloadAndInit: () => Promise<void>;
  retry: () => void;
}

const LlamaContext = createContext<LlamaContextValue | null>(null);

export function LlamaProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SetupStatus>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState<ModelId>(DEFAULT_MODEL);

  const bootstrap = useCallback(async () => {
    if (!isOnDeviceLLMSupported()) {
      setStatus('ready');
      return;
    }

    setStatus('checking');
    setError(null);

    try {
      const saved = await getSelectedModel();
      const id = saved ?? DEFAULT_MODEL;
      setModelId(id);

      const downloaded = await isModelDownloaded(id);
      if (!downloaded) {
        setStatus('needs_download');
        return;
      }

      setStatus('loading');
      await initModel(id);
      setStatus('ready');
    } catch {
      setError('Something went wrong loading the model. Tap retry to try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    bootstrap();
    return () => {
      releaseModel();
    };
  }, [bootstrap]);

  const downloadAndInit = useCallback(async () => {
    if (!isOnDeviceLLMSupported()) return;

    setError(null);
    setStatus('downloading');
    setProgress(0);

    try {
      await downloadModel(modelId, setProgress);
      setStatus('loading');
      await initModel(modelId);
      setStatus('ready');
    } catch {
      setError('Download interrupted. Check your connection and try again.');
      setStatus('error');
    }
  }, [modelId]);

  const selectModel = useCallback(async (id: ModelId) => {
    await releaseModel();
    await persistModel(id);
    setModelId(id);
    setProgress(0);

    const downloaded = await isModelDownloaded(id);
    setStatus(downloaded ? 'loading' : 'needs_download');

    if (downloaded) {
      try {
        await initModel(id);
        setStatus('ready');
      } catch {
        setError('Could not load the model. Try downloading again.');
        setStatus('error');
      }
    }
  }, []);

  const value = useMemo<LlamaContextValue>(
    () => ({
      status,
      progress,
      error,
      modelId,
      modelName: MODELS[modelId].name,
      isReady: status === 'ready' || Platform.OS === 'web',
      isWeb: Platform.OS === 'web',
      selectModel,
      downloadAndInit,
      retry: bootstrap,
    }),
    [status, progress, error, modelId, selectModel, downloadAndInit, bootstrap]
  );

  return <LlamaContext.Provider value={value}>{children}</LlamaContext.Provider>;
}

export function useLlama(): LlamaContextValue {
  const ctx = useContext(LlamaContext);
  if (!ctx) throw new Error('useLlama must be used within LlamaProvider');
  return ctx;
}
