import { detectNewsIntent } from './news';
import { detectSearchIntent } from './webSearch';
import { detectWeatherIntent } from './weather';

export function isConversationalMessage(message: string): boolean {
  return /\b(inspire|inspiration|motivat|encourage|encouragement|boost|uplift|feeling down|need help|thank you|thanks|grateful|anxious|stressed|overwhelmed|lonely|sad|depressed|hello|hi there|^hi\b|^hey\b|good morning|good afternoon|good evening)\b/i.test(
    message
  );
}

export function detectGeneralQuestion(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (isConversationalMessage(trimmed)) return false;

  return (
    /\?\s*$/.test(trimmed) ||
    /^(what|who|when|where|why|how|tell me|can you|could you|is there|are there|do you know)\b/i.test(
      trimmed
    )
  );
}

export function shouldUseWebLookup(message: string): boolean {
  return (
    detectWeatherIntent(message) ||
    detectNewsIntent(message) ||
    detectSearchIntent(message) ||
    detectGeneralQuestion(message)
  );
}

export function buildWebSearchQuery(message: string): string {
  const cleaned = message
    .replace(/\b(please|spark|can you|could you|tell me|what is|who is|when did|how does|explain|define|search for)\b/gi, ' ')
    .replace(/[?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || message.trim();
}
