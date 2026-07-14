import { CLOSING_LINES } from '../inspire/systemPrompt';
import type { ChatMessage, LocationCoords } from '../inspire/types';
import { getUserLocation } from '../location';
import { generateCompletion, isModelReady, refreshGeminiConfig } from '../llm/geminiService';
import { respondLocally, respondOffline } from '../offline/localResponses';
import { isBrowserOnline, isNetworkError } from '../offline/networkStatus';
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
  } catch (err) {
    if (isNetworkError(err) || !isBrowserOnline()) return null;
    return null;
  }
  return null;
}

async function respondFromWeb(
  userMessage: string,
  location: LocationCoords | null
): Promise<string | null> {
  if (!isBrowserOnline()) return null;

  const webContext = await gatherWebContext(userMessage, location);
  if (webContext) {
    return `${webContext}\n\n${randomClosing()}`;
  }
  return null;
}

async function respondWithLlm(
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
    throw new Error('AI returned an empty response');
  }
  return response;
}

export async function generateInspireResponse(
  userMessage: string,
  history: ChatMessage[]
): Promise<ChatMessage> {
  const offline = !isBrowserOnline();

  const location =
    !offline && needsLocation(userMessage)
      ? await getUserLocation().catch(() => null)
      : null;

  if (!offline) {
    await refreshGeminiConfig();
  }

  let content: string | null = null;

  if (offline) {
    content = respondOffline(userMessage);
  } else {
    // 1. Web-first — weather, news, and web search (no LLM API call).
    content = await respondFromWeb(userMessage, location);

    // 2. Conversational messages — try LLM when available, otherwise local Spark replies.
    if (!content && isConversationalMessage(userMessage)) {
      if (isModelReady()) {
        try {
          content = await respondWithLlm(userMessage, history, location);
        } catch (err) {
          content = isNetworkError(err) ? respondOffline(userMessage) : respondLocally(userMessage);
        }
      } else {
        content = respondLocally(userMessage);
      }
    }

    // 3. Factual questions — try web search if not already answered.
    if (!content && shouldUseWebLookup(userMessage)) {
      content = await respondFromWeb(userMessage, location);
    }

    // 4. Optional LLM polish for open-ended chat when under rate limits.
    if (!content && isModelReady() && !shouldUseWebLookup(userMessage)) {
      try {
        content = await respondWithLlm(userMessage, history, location);
      } catch (err) {
        if (isNetworkError(err)) {
          content = respondOffline(userMessage);
        } else if (!isRateLimitError(err)) {
          content = respondLocally(userMessage);
        }
      }
    }

    // 5. Rate-limited or no API key — web search last attempt, then local fallback.
    if (!content && shouldUseWebLookup(userMessage)) {
      content = await respondFromWeb(userMessage, location);
    }

    if (!content) {
      content = respondLocally(userMessage);
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
    "Talk or type — ask about the weather, catch up on headlines, or look up anything on the web. " +
    "Even offline, I've got motivational quotes ready for you.\n\nYou've got this.",
  timestamp: Date.now(),
};
