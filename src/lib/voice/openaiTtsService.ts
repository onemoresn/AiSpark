import { llmFetch } from '../llm/llmFetch';
import { getStyleForPreference, type VoicePreference } from './voiceConfig';

export type TtsAudioResult = {
  data: string;
  mimeType: string;
};

const OPENAI_TTS_MODELS = ['gpt-4o-mini-tts', 'tts-1-hd', 'tts-1'] as const;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function synthesizeWithOpenAi(
  text: string,
  preference: VoicePreference,
  apiKey: string
): Promise<TtsAudioResult> {
  const style = getStyleForPreference(preference);
  const voice = style.openaiVoiceId ?? preference.voiceId ?? 'nova';
  const instructions = style.ttsPrompt;

  let lastError: Error | null = null;

  for (const model of OPENAI_TTS_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        input: text,
        voice,
        response_format: 'mp3',
      };

      if (model.includes('mini-tts') && instructions) {
        body.instructions = instructions;
      }

      const response = await llmFetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `OpenAI TTS failed (${response.status})`);
      }

      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength) {
        throw new Error('OpenAI TTS returned no audio');
      }

      return {
        data: arrayBufferToBase64(buffer),
        mimeType: 'audio/mpeg',
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('OpenAI TTS request failed');
}

export async function testOpenAiVoice(apiKey: string, voiceId = 'nova'): Promise<void> {
  const audio = await synthesizeWithOpenAi(
    'Voice check.',
    { voiceId, styleId: 'warm' },
    apiKey
  );
  if (!audio.data) {
    throw new Error('Voice API returned no audio');
  }
}
