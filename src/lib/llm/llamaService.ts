import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { DEFAULT_MODEL, MODELS, STOP_WORDS, type ModelId } from './modelConfig';
import { getSelectedModel, setSelectedModel } from '../storage';

type LlamaContext = Awaited<ReturnType<typeof import('llama.rn')['initLlama']>>;

let llamaContext: LlamaContext | null = null;
let initPromise: Promise<LlamaContext> | null = null;
let loadedModelId: ModelId | null = null;

export function isOnDeviceLLMSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function getModelsDir(): Directory {
  return new Directory(Paths.document, 'models');
}

function getModelFile(modelId: ModelId): File {
  const config = MODELS[modelId];
  return new File(getModelsDir(), config.fileName);
}

export async function getModelPath(modelId: ModelId = DEFAULT_MODEL): Promise<string | null> {
  const file = getModelFile(modelId);
  return file.exists ? file.uri : null;
}

export async function isModelDownloaded(modelId?: ModelId): Promise<boolean> {
  const id = modelId ?? (await getSelectedModel()) ?? DEFAULT_MODEL;
  return getModelFile(id).exists;
}

export async function downloadModel(
  modelId: ModelId,
  onProgress?: (progress: number) => void
): Promise<string> {
  const config = MODELS[modelId];
  const dir = getModelsDir();

  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const dest = getModelFile(modelId);
  if (dest.exists) {
    onProgress?.(1);
    await setSelectedModel(modelId);
    return dest.uri;
  }

  const task = File.createDownloadTask(config.url, dest, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) {
        onProgress?.(bytesWritten / totalBytes);
      }
    },
  });

  await task.downloadAsync();
  onProgress?.(1);
  await setSelectedModel(modelId);
  return dest.uri;
}

export async function initModel(modelId?: ModelId): Promise<LlamaContext> {
  const id = modelId ?? (await getSelectedModel()) ?? DEFAULT_MODEL;

  if (llamaContext && loadedModelId === id) return llamaContext;
  if (llamaContext) await releaseModel();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { initLlama } = await import('llama.rn');
    const path = await getModelPath(id);

    if (!path) {
      throw new Error('Model not downloaded');
    }

    llamaContext = await initLlama({
      model: path,
      use_mlock: true,
      n_ctx: 2048,
      n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
    });

    loadedModelId = id;
    return llamaContext;
  })();

  try {
    return await initPromise;
  } catch (err) {
    initPromise = null;
    loadedModelId = null;
    throw err;
  }
}

export function isModelReady(): boolean {
  return llamaContext !== null;
}

export async function releaseModel(): Promise<void> {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }
  initPromise = null;
  loadedModelId = null;
}

interface CompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCompletion(
  messages: CompletionMessage[],
  maxTokens = 350
): Promise<string> {
  const ctx = llamaContext ?? (await initModel());

  const result = await ctx.completion({
    messages,
    n_predict: maxTokens,
    temperature: 0.75,
    top_p: 0.9,
    stop: STOP_WORDS,
  });

  return result.text.trim();
}
