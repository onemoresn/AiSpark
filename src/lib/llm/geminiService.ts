import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  type GeminiModelId,
} from './geminiConfig';
import { getGeminiApiKey, getSelectedGeminiModel } from '../storage';

type ChatRole = 'system' | 'user' | 'assistant';

type GeminiContent = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

let cachedApiKey: string | null = null;
let cachedModelId: GeminiModelId = DEFAULT_GEMINI_MODEL;

const MODEL_FALLBACKS: GeminiModelId[] = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
];

export async function refreshGeminiConfig(): Promise<void> {
  cachedApiKey = await getGeminiApiKey();
  const saved = await getSelectedGeminiModel();
  cachedModelId = saved ?? DEFAULT_GEMINI_MODEL;
}

export function isModelReady(): boolean {
  return !!cachedApiKey?.trim();
}

export function getActiveModelName(): string {
  return GEMINI_MODELS[cachedModelId]?.name ?? GEMINI_MODELS[DEFAULT_GEMINI_MODEL].name;
}

function toGeminiContents(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): GeminiContent[] {
  let contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  const merged: GeminiContent[] = [];
  for (const item of contents) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === item.role) {
      prev.parts[0].text += `\n\n${item.parts[0].text}`;
    } else {
      merged.push({
        role: item.role,
        parts: [{ text: item.parts[0].text }],
      });
    }
  }

  return merged;
}

async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    return fetch(proxyUrl, init);
  }
}

async function callGemini(
  modelId: string,
  apiKey: string,
  systemParts: string,
  contents: GeminiContent[],
  maxTokens: number
): Promise<string> {
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

  const response = await geminiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
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

  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const contents = toGeminiContents(chatMessages);
  if (contents.length === 0) {
    throw new Error('No user message to send to Gemini');
  }

  const modelsToTry = [
    cachedModelId,
    ...MODEL_FALLBACKS.filter((id) => id !== cachedModelId),
  ];

  let lastError: Error | null = null;
  for (const modelId of modelsToTry) {
    try {
      const text = await callGemini(modelId, apiKey, systemParts, contents, maxTokens);
      if (text) return text;
      lastError = new Error('Gemini returned an empty response');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Gemini request failed');
}
