import { CLOSING_LINES } from '../inspire/systemPrompt';
import type { ChatMessage, LocationCoords } from '../inspire/types';
import { getUserLocation } from '../location';
import { generateCompletion, isModelReady, refreshGeminiConfig } from '../llm/geminiService';
import { executeTool } from '../tools';
import { detectNewsIntent } from '../tools/news';
import { detectWeatherIntent } from '../tools/weather';
import {
  buildWebSearchQuery,
  isConversationalMessage,
  shouldUseWebLookup,
} from '../tools/webIntent';
import { detectSearchIntent } from '../tools/webSearch';

function randomClosing(): string {
  return CLOSING_LINES[Math.floor(Math.random() * CLOSING_LINES.length)];
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function needsLocation(message: string): boolean {
  return detectWeatherIntent(message);
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /429|too many requests|resource exhausted|rate limit/i.test(message);
}

async function gatherWebContext(
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

    const wantsSearch =
      detectSearchIntent(userMessage) ||
      (shouldUseWebLookup(userMessage) && !isConversationalMessage(userMessage));

    if (wantsSearch) {
      const query = buildWebSearchQuery(userMessage);
      return await executeTool('web_search', { query }, location);
    }
  } catch {
    return null;
  }
  return null;
}

async function respondFromWeb(
  userMessage: string,
  location: LocationCoords | null
): Promise<string | null> {
  const webContext = await gatherWebContext(userMessage, location);
  if (webContext) {
    return `${webContext}\n\n${randomClosing()}`;
  }
  return null;
}

async function respondWithGemini(
  userMessage: string,
  history: ChatMessage[],
  location: LocationCoords | null
): Promise<string> {
  const recentHistory = history
    .filter((m) => m.id !== 'welcome')
    .slice(-6)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content:
        'You are Spark, a warm motivational assistant. Keep replies to 2-4 friendly sentences.',
    },
    ...recentHistory,
  ];

  if (location?.city) {
    messages[0].content += ` The user is near ${location.city}.`;
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await generateCompletion(messages);
  if (!response) {
    throw new Error('Gemini returned an empty response');
  }
  return response;
}

async function respondLocally(userMessage: string): Promise<string> {
  const greetings = /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i;
  if (greetings.test(userMessage)) {
    return (
      "Hey there — I'm Spark, and I'm glad you're here. " +
      "Whether you need a weather check, today's headlines, or just a boost of encouragement, I've got you. " +
      `What would lift your spirit right now?\n\n${randomClosing()}`
    );
  }

  const inspireMe =
    /\b(inspire|inspiration|motivat|encourage|encouragement|boost|uplift|feeling down|need help)\b/i;
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
  const location = needsLocation(userMessage)
    ? await getUserLocation().catch(() => null)
    : null;

  await refreshGeminiConfig();

  // 1. Web-first — weather, news, and web search (no Gemini API call).
  let content = await respondFromWeb(userMessage, location);

  // 2. Conversational messages — try Gemini when available, otherwise local Spark replies.
  if (!content && isConversationalMessage(userMessage)) {
    if (isModelReady()) {
      try {
        content = await respondWithGemini(userMessage, history, location);
      } catch {
        content = await respondLocally(userMessage);
      }
    } else {
      content = await respondLocally(userMessage);
    }
  }

  // 3. Factual questions — try web search if not already answered.
  if (!content && shouldUseWebLookup(userMessage)) {
    content = await respondFromWeb(userMessage, location);
  }

  // 4. Optional Gemini polish for open-ended chat when under rate limits.
  if (!content && isModelReady() && !shouldUseWebLookup(userMessage)) {
    try {
      content = await respondWithGemini(userMessage, history, location);
    } catch (err) {
      if (!isRateLimitError(err)) {
        content = await respondLocally(userMessage);
      }
    }
  }

  // 5. Rate-limited or no API key — web search last attempt, then local fallback.
  if (!content && shouldUseWebLookup(userMessage)) {
    content = await respondFromWeb(userMessage, location);
  }

  if (!content) {
    content = await respondLocally(userMessage);
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
    "Talk or type — ask about the weather, catch up on headlines, or look up anything on the web.\n\nYou've got this.",
  timestamp: Date.now(),
};
