import { CHAT_MODEL_FALLBACKS, type GeminiModelId } from './geminiConfig';

const REQUEST_TIMEOUT_MS = 25_000;

function chatModelsToTry(preferred?: GeminiModelId): GeminiModelId[] {
  const ordered = preferred
    ? [preferred, ...CHAT_MODEL_FALLBACKS.filter((id) => id !== preferred)]
    : [...CHAT_MODEL_FALLBACKS];
  return [...new Set(ordered)];
}

export type ApiKeyValidation = {
  chatOk: boolean;
  voiceOk: boolean;
  status: 'empty' | 'testing' | 'ok' | 'partial' | 'fail';
  message: string;
};

export function parseGeminiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as {
        error?: { message?: string };
      };
      if (parsed.error?.message) return parsed.error.message;
    } catch {
      if (err.message) return err.message;
    }
  }
  return fallback;
}

export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out');
    }

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const proxyController = new AbortController();
    const proxyTimeout = setTimeout(() => proxyController.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(proxyUrl, { ...init, signal: proxyController.signal });
      clearTimeout(proxyTimeout);
      return response;
    } catch (proxyErr) {
      clearTimeout(proxyTimeout);
      throw proxyErr;
    }
  }
}

async function readGeminiResponse(response: Response, label: string): Promise<Response> {
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `${label} failed (${response.status})`);
  }
  return response;
}

export async function testGeminiChat(
  apiKey: string,
  preferredModel?: GeminiModelId
): Promise<void> {
  let lastError: Error | null = null;

  for (const modelId of chatModelsToTry(preferredModel)) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await geminiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
          generationConfig: { maxOutputTokens: 8, temperature: 0 },
        }),
      });

      await readGeminiResponse(response, 'Chat API');
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        throw new Error('Chat API returned an empty response');
      }
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Chat API check failed');
}

export async function testGeminiVoice(apiKey: string, voiceName = 'Sulafat'): Promise<void> {
  const { synthesizeWithGemini } = await import('../voice/geminiTtsService');
  const audio = await synthesizeWithGemini(
    'Voice check.',
    { voiceId: voiceName, styleId: 'warm' },
    apiKey
  );
  if (!audio.data) {
    throw new Error('Voice API returned no audio');
  }
}

export async function validateGeminiApiKey(
  apiKey: string,
  chatModelId?: GeminiModelId
): Promise<ApiKeyValidation> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return {
      chatOk: false,
      voiceOk: false,
      status: 'empty',
      message: 'Paste your Gemini API key above.',
    };
  }

  let chatOk = false;
  let voiceOk = false;
  let chatError = '';
  let voiceError = '';

  try {
    await testGeminiChat(trimmed, chatModelId);
    chatOk = true;
  } catch (err) {
    chatError = parseGeminiError(err, 'Chat API check failed');
  }

  try {
    await testGeminiVoice(trimmed);
    voiceOk = true;
  } catch (err) {
    voiceError = parseGeminiError(err, 'Natural voice check failed');
  }

  if (chatOk && voiceOk) {
    return {
      chatOk: true,
      voiceOk: true,
      status: 'ok',
      message: 'API key works — chat and natural voice are ready.',
    };
  }

  if (chatOk && !voiceOk) {
    return {
      chatOk: true,
      voiceOk: false,
      status: 'partial',
      message: `Chat works, but natural voice failed: ${voiceError}`,
    };
  }

  if (!chatOk && voiceOk) {
    return {
      chatOk: false,
      voiceOk: true,
      status: 'partial',
      message: `Voice works, but chat failed: ${chatError}`,
    };
  }

  return {
    chatOk: false,
    voiceOk: false,
    status: 'fail',
    message: chatError || voiceError || 'API key is not working.',
  };
}
