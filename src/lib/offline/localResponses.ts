import { CLOSING_LINES } from '../inspire/systemPrompt';
import { detectNewsIntent } from '../tools/news';
import { detectWeatherIntent } from '../tools/weather';
import { detectSearchIntent } from '../tools/webSearch';
import { isConversationalMessage } from '../tools/webIntent';
import { formatQuote, pickQuotes, pickRandomQuote } from './offlineQuotes';

function randomClosing(): string {
  return CLOSING_LINES[Math.floor(Math.random() * CLOSING_LINES.length)];
}

const LOCAL_BOOSTS = [
  "You don't have to have it all figured out to move forward. One honest step today is enough to build real momentum.",
  "Progress isn't always loud. Sometimes it's simply showing up, breathing deep, and choosing to try again.",
  "The version of you that's pushing through right now is stronger than you realize. Trust that quiet resilience.",
  'Every small win compounds. Celebrate what you have already handled — it counts more than you think.',
  'Courage is not the absence of fear — it is deciding that something else matters more.',
  'Your pace is valid. Slow progress is still progress, and showing up counts.',
];

const ANXIOUS_REPLIES = [
  "Take a slow breath with me. You don't have to solve everything at once — just the next small step in front of you.",
  'When everything feels loud, grounding yourself in one simple action can bring real calm back.',
  "You've made it through hard days before. That same strength is still in you right now.",
];

function wantsQuote(message: string): boolean {
  return /\b(quote|wisdom|words of|something uplifting|pick me up)\b/i.test(message);
}

function isAnxious(message: string): boolean {
  return /\b(anxious|anxiety|stressed|overwhelmed|worried|panic|nervous)\b/i.test(message);
}

function isGrateful(message: string): boolean {
  return /\b(thank|thanks|grateful|gratitude|appreciate)\b/i.test(message);
}

export function respondLocally(userMessage: string): string {
  const greetings = /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i;
  if (greetings.test(userMessage)) {
    return (
      "Hey there — I'm Spark, and I'm glad you're here. " +
      "Whether you need a weather check, today's headlines, or just a boost of encouragement, I've got you. " +
      `What would lift your spirit right now?\n\n${randomClosing()}`
    );
  }

  if (isGrateful(userMessage)) {
    return (
      "That gratitude you're feeling is powerful — it shifts your whole day toward what's good. " +
      `Thank you for sharing that with me.\n\n${randomClosing()}`
    );
  }

  if (isAnxious(userMessage)) {
    return `${ANXIOUS_REPLIES[Math.floor(Math.random() * ANXIOUS_REPLIES.length)]}\n\n${randomClosing()}`;
  }

  const inspireMe =
    /\b(inspire|inspiration|motivat|encourage|encouragement|boost|uplift|feeling down|need help)\b/i;
  if (inspireMe.test(userMessage) || isConversationalMessage(userMessage)) {
    const boost = LOCAL_BOOSTS[Math.floor(Math.random() * LOCAL_BOOSTS.length)];
    return `${boost}\n\n${randomClosing()}`;
  }

  if (wantsQuote(userMessage)) {
    const quote = pickRandomQuote();
    return `${formatQuote(quote)}\n\n${randomClosing()}`;
  }

  return (
    "I'm here with you. Ask me about today's weather, what's in the news, or anything you're curious about — " +
    "or just tell me how you're feeling and we'll find a spark of momentum together.\n\n" +
    randomClosing()
  );
}

export function respondOffline(userMessage: string): string {
  const offlineNote =
    "You're offline right now — I'm drawing from Spark's built-in library instead of the web.";

  if (detectWeatherIntent(userMessage)) {
    return (
      `${offlineNote}\n\n` +
      "I can't fetch live weather without a connection, but here's something to carry with you: " +
      "No matter what the sky looks like outside, you can choose a steady, hopeful mindset today.\n\n" +
      `${formatQuote(pickRandomQuote('resilience'))}\n\n${randomClosing()}`
    );
  }

  if (detectNewsIntent(userMessage)) {
    return (
      `${offlineNote}\n\n` +
      "Headlines need an internet connection, but here's a moment of perspective while you're offline:\n\n" +
      `${formatQuote(pickRandomQuote('general'))}\n\n${randomClosing()}`
    );
  }

  if (detectSearchIntent(userMessage) || /\?\s*$/.test(userMessage.trim())) {
    const quotes = pickQuotes(2);
    return (
      `${offlineNote}\n\n` +
      "I can't search the web right now, but these words might help:\n\n" +
      `${formatQuote(quotes[0])}\n\n${formatQuote(quotes[1])}\n\n${randomClosing()}`
    );
  }

  if (wantsQuote(userMessage) || /\b(inspire|motivat|encourage|boost|uplift|quote)\b/i.test(userMessage)) {
    const quotes = pickQuotes(2);
    return (
      `${offlineNote}\n\n` +
      `${formatQuote(quotes[0])}\n\n${formatQuote(quotes[1])}\n\n${randomClosing()}`
    );
  }

  const local = respondLocally(userMessage);
  if (local.includes(offlineNote)) return local;
  return `${offlineNote}\n\n${local}`;
}
