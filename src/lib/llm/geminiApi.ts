import { CHAT_MODEL_FALLBACKS, type GeminiModelId } from './geminiConfig';
import { llmFetch } from './llmFetch';

export type ApiKeyValidation = {
  chatOk: boolean;
  voiceOk: boolean;
  status: 'empty' | 'testing' | 'ok' | 'partial' | 'fail';
  message: string;
};

export function parseGeminiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const raw = err.message;
    if (/429|too many requests|resource exhausted|rate limit/i.test(raw)) {
      return 'Rate limit exceeded — wait a minute, then try again. (Free tier has request limits per minute.)';
    }
    try {
      const parsed = JSON.parse(raw) as {
        error?: { message?: string; code?: number; status?: string };
      };
      const msg = parsed.error?.message;
      if (msg) {
        if (/429|too many requests|resource exhausted|rate limit/i.test(msg)) {
          return 'Rate limit exceeded — wait a minute, then try again. (Free tier has request limits per minute.)';
        }
        return msg;
      }
    } catch {
      if (raw) return raw;
    }
  }
  return fallback;
}

function extractVisibleText(data: {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => p.text && p.thought !== true)
    .map((p) => p.text ?? '')
    .join('')
    .trim();

  if (text) return text;

  const finishReason = data.candidates?.[0]?.finishReason;
  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Request blocked: ${blockReason}`);
  }
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`Model stopped early (${finishReason})`);
  }

  return '';
}

export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  return llmFetch(url, init);
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
  const modelId = preferredModel ?? CHAT_MODEL_FALLBACKS[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0,
  };
  if (modelId.includes('gemini-3')) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const response = await geminiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
      generationConfig,
    }),
  });

  await readGeminiResponse(response, 'Chat API');
  const data = (await response.json()) as Parameters<typeof extractVisibleText>[0];

  const text = extractVisibleText(data);
  if (!text) {
    throw new Error('Chat API returned an empty response — you may be rate-limited. Wait a minute and retry.');
  }
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

  if (chatOk) {
    try {
      await testGeminiVoice(trimmed);
      voiceOk = true;
    } catch (err) {
      voiceError = parseGeminiError(err, 'Natural voice check failed');
    }
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
