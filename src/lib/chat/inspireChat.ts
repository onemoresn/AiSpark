import { SPARK_SYSTEM_PROMPT, CLOSING_LINES } from '../inspire/systemPrompt';
import type { ChatMessage, LocationCoords } from '../inspire/types';
import { getUserLocation } from '../location';
import { executeTool } from '../tools';
import { detectWeatherIntent } from '../tools/weather';
import { detectNewsIntent } from '../tools/news';
import { detectSearchIntent } from '../tools/webSearch';
import { generateCompletion, isModelReady, isOnDeviceLLMSupported } from '../llm/llamaService';

function randomClosing(): string {
  return CLOSING_LINES[Math.floor(Math.random() * CLOSING_LINES.length)];
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function extractSearchQuery(message: string): string {
  return message
    .replace(/\b(what is|who is|when did|how does|tell me about|explain|define|search for)\b/gi, '')
    .replace(/[?]/g, '')
    .trim();
}

async function gatherToolContext(
  userMessage: string,
  location: LocationCoords | null
): Promise<string | null> {
  try {
    if (detectWeatherIntent(userMessage)) {
      return await executeTool('get_weather', {}, location);
    }
    if (detectNewsIntent(userMessage)) {
      return await executeTool('get_news', {}, location);
    }
    if (detectSearchIntent(userMessage)) {
      const query = extractSearchQuery(userMessage) || userMessage;
      return await executeTool('web_search', { query }, location);
    }
  } catch {
    return null;
  }
  return null;
}

async function respondWithOnDeviceLLM(
  userMessage: string,
  history: ChatMessage[],
  location: LocationCoords | null
): Promise<string> {
  const toolContext = await gatherToolContext(userMessage, location);

  const recentHistory = history
    .filter((m) => m.id !== 'welcome')
    .slice(-8)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SPARK_SYSTEM_PROMPT },
    ...recentHistory,
  ];

  if (toolContext) {
    messages.push({
      role: 'system',
      content: `Use this real-time information in your response:\n\n${toolContext}`,
    });
  }

  if (location?.city) {
    messages[0].content += `\n\nUser location: ${location.city}.`;
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await generateCompletion(messages, 350);
  if (!response) {
    return `I'm right here with you. Take a breath and keep moving forward.\n\n${randomClosing()}`;
  }
  return response;
}

async function respondLocally(
  userMessage: string,
  location: LocationCoords | null
): Promise<string> {
  const toolContext = await gatherToolContext(userMessage, location);
  if (toolContext) {
    return `${toolContext}\n\n${randomClosing()}`;
  }

  const greetings = /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i;
  if (greetings.test(userMessage)) {
    return (
      "Hey there — I'm Spark, and I'm glad you're here. " +
      "Whether you need a weather check, today's headlines, or just a boost of encouragement, I've got you. " +
      `What would lift your spirit right now?\n\n${randomClosing()}`
    );
  }

  const inspireMe = /\b(inspire|motivat|encourage|boost|uplift|feeling down|need help)\b/i;
  if (inspireMe.test(userMessage)) {
    const boosts = [
      "You don't have to have it all figured out to move forward. One honest step today is enough to build real momentum.",
      "Progress isn't always loud. Sometimes it's simply showing up, breathing deep, and choosing to try again.",
      "The version of you that's pushing through right now is stronger than you realize. Trust that quiet resilience.",
      "Every small win compounds. Celebrate what you've already handled — it counts more than you think.",
    ];
    return `${boosts[Math.floor(Math.random() * boosts.length)]}\n\n${randomClosing()}`;
  }

  return (
    "I'm here with you. Ask me about today's weather, what's in the news, or anything you're curious about — " +
    "or just tell me how you're feeling and we'll find a spark of momentum together.\n\n" +
    randomClosing()
  );
}

export async function generateInspireResponse(
  userMessage: string,
  history: ChatMessage[]
): Promise<ChatMessage> {
  const location = await getUserLocation().catch(() => null);

  let content: string;
  try {
    if (isOnDeviceLLMSupported() && isModelReady()) {
      content = await respondWithOnDeviceLLM(userMessage, history, location);
    } else {
      content = await respondLocally(userMessage, location);
    }
  } catch {
    try {
      content = await respondLocally(userMessage, location);
    } catch {
      content =
        "Even when things don't go perfectly, your willingness to show up still matters. " +
        `Take a breath, reset, and keep going.\n\n${randomClosing()}`;
    }
  }

  return {
    id: createId(),
    role: 'assistant',
    content,
    timestamp: Date.now(),
  };
}

export function createUserMessage(text: string): ChatMessage {
  return {
    id: createId(),
    role: 'user',
    content: text.trim(),
    timestamp: Date.now(),
  };
}

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey — I'm Spark, your AI companion for warmth and encouragement. " +
    "Talk or type — ask about the weather, catch up on headlines, or just tell me how you're feeling.\n\nYou've got this.",
  timestamp: Date.now(),
};
