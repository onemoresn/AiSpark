import { llmFetch } from './llmFetch';

type ChatRole = 'system' | 'user' | 'assistant';

export async function generateAnthropicCompletion(
  apiKey: string,
  modelId: string,
  messages: Array<{ role: ChatRole; content: string }>
): Promise<string> {
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

  if (chatMessages.length === 0) {
    throw new Error('No user message to send to Claude');
  }

  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: 1024,
    messages: chatMessages,
    temperature: 0.85,
  };

  if (systemParts) {
    body.system = systemParts;
  }

  const response = await llmFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Claude request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data.content
    ?.filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text ?? '')
    .join('')
    .trim();

  if (!text) throw new Error('Claude returned an empty response');
  return text;
}

export async function testAnthropicChat(apiKey: string, modelId: string): Promise<void> {
  const text = await generateAnthropicCompletion(apiKey, modelId, [
    { role: 'user', content: 'Reply with exactly: OK' },
  ]);
  if (!text) {
    throw new Error('Chat API returned an empty response');
  }
}
