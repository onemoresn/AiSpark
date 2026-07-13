import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  type GeminiModelId,
} from './geminiConfig';
import { getGeminiApiKey, getSelectedGeminiModel } from '../storage';

type ChatRole = 'system' | 'user' | 'assistant';

let cachedApiKey: string | null = null;
let cachedModelId: GeminiModelId = DEFAULT_GEMINI_MODEL;

export async function refreshGeminiConfig(): Promise<void> {
  cachedApiKey = await getGeminiApiKey();
  const saved = await getSelectedGeminiModel();
  cachedModelId = saved ?? DEFAULT_GEMINI_MODEL;
}

export function isModelReady(): boolean {
  return !!cachedApiKey?.trim();
}

export function getActiveModelName(): string {
  return GEMINI_MODELS[cachedModelId].name;
}

export async function generateCompletion(
  messages: Array<{ role: ChatRole; content: string }>,
  maxTokens = 350
): Promise<string> {
  if (!cachedApiKey) await refreshGeminiConfig();
  const apiKey = cachedApiKey?.trim();
  if (!apiKey) throw new Error('No Gemini API key configured');

  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const modelId = cachedModelId;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.85,
      topP: 0.9,
    },
  };

  if (systemParts) {
    body.systemInstruction = { parts: [{ text: systemParts }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 400 || response.status === 403) {
      throw new Error('Invalid API key or model. Check Settings and try again.');
    }
    throw new Error(errText || `Gemini request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();

  return text ?? '';
}
