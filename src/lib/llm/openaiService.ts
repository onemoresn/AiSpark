import { llmFetch } from './llmFetch';

type ChatRole = 'system' | 'user' | 'assistant';

export async function generateOpenAiCompletion(
  apiKey: string,
  modelId: string,
  messages: Array<{ role: ChatRole; content: string }>
): Promise<string> {
  const response = await llmFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `OpenAI request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI returned an empty response');
  return text;
}

export async function testOpenAiChat(apiKey: string, modelId: string): Promise<void> {
  const text = await generateOpenAiCompletion(apiKey, modelId, [
    { role: 'user', content: 'Reply with exactly: OK' },
  ]);
  if (!text) {
    throw new Error('Chat API returned an empty response');
  }
}
