import { geminiFetch, parseGeminiError } from '../llm/geminiApi';
import { getGeminiApiKey } from '../storage';
import type { VoicePreference } from './voiceConfig';

/** AI Studio TTS model IDs (not Vertex / Cloud-only names) */
const TTS_MODELS = [
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
] as const;

let preferredTtsModel: string | null = null;

export type GeminiAudioResult = {
  data: string;
  mimeType: string;
};

function extractInlineAudio(data: {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
  }>;
}): GeminiAudioResult | null {
  const inline = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inline?.data) return null;
  return {
    data: inline.data,
    mimeType: inline.mimeType ?? 'audio/L16;codec=pcm;rate=24000',
  };
}

async function requestGenerateContentAudio(
  modelId: string,
  apiKey: string,
  text: string,
  voiceName: string
): Promise<GeminiAudioResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await geminiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Gemini TTS failed (${response.status})`);
  }

  const payload = (await response.json()) as Parameters<typeof extractInlineAudio>[0];
  const audio = extractInlineAudio(payload);
  if (!audio) {
    throw new Error('Gemini TTS returned no audio');
  }
  return audio;
}

async function requestInteractionsAudio(
  modelId: string,
  apiKey: string,
  text: string,
  voiceName: string
): Promise<GeminiAudioResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(apiKey)}`;

  const response = await geminiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      input: text,
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [{ voice: voiceName }],
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Gemini TTS interactions failed (${response.status})`);
  }

  const data = (await response.json()) as {
    output_audio?: { data?: string; mime_type?: string; mimeType?: string };
  };

  const audioData = data.output_audio?.data;
  if (!audioData) {
    throw new Error('Gemini TTS interactions returned no audio');
  }

  return {
    data: audioData,
    mimeType:
      data.output_audio.mimeType ??
      data.output_audio.mime_type ??
      'audio/L16;codec=pcm;rate=24000',
  };
}

export async function synthesizeWithGemini(
  text: string,
  preference: VoicePreference,
  apiKey?: string | null
): Promise<GeminiAudioResult> {
  const key = apiKey?.trim() || (await getGeminiApiKey())?.trim();
  if (!key) {
    throw new Error('No Gemini API key configured');
  }

  const voiceName = preference.voiceId;
  const modelsToTry = preferredTtsModel
    ? [preferredTtsModel, ...TTS_MODELS.filter((m) => m !== preferredTtsModel)]
    : [...TTS_MODELS];

  let lastError: Error | null = null;

  for (const modelId of modelsToTry) {
    try {
      const audio = await requestGenerateContentAudio(modelId, key, text, voiceName);
      preferredTtsModel = modelId;
      return audio;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  for (const modelId of modelsToTry) {
    try {
      const audio = await requestInteractionsAudio(modelId, key, text, voiceName);
      preferredTtsModel = modelId;
      return audio;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(parseGeminiError(lastError, 'Gemini TTS request failed'));
}
