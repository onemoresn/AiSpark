export type QuoteCategory =
  | 'courage'
  | 'growth'
  | 'resilience'
  | 'gratitude'
  | 'focus'
  | 'general';

export interface CachedQuote {
  text: string;
  author?: string;
  category: QuoteCategory;
}

/** Bundled offline quote library — always available without network */
export const OFFLINE_QUOTES: CachedQuote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'focus' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'resilience' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'courage' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James', category: 'general' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'courage' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis', category: 'growth' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'growth' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson', category: 'resilience' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe', category: 'courage' },
  { text: 'Happiness is not something ready made. It comes from your own actions.', author: 'Dalai Lama', category: 'gratitude' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'growth' },
  { text: 'Do not wait to strike till the iron is hot; but make it hot by striking.', author: 'William Butler Yeats', category: 'focus' },
  { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair', category: 'courage' },
  { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C.S. Lewis', category: 'resilience' },
  { text: 'Gratitude turns what we have into enough.', author: 'Anonymous', category: 'gratitude' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar', category: 'courage' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', category: 'focus' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb', category: 'resilience' },
  { text: 'Keep your face always toward the sunshine—and shadows will fall behind you.', author: 'Walt Whitman', category: 'general' },
  { text: 'Difficult roads often lead to beautiful destinations.', author: 'Zig Ziglar', category: 'resilience' },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma', category: 'growth' },
  { text: 'You are braver than you believe, stronger than you seem, and smarter than you think.', author: 'A.A. Milne', category: 'courage' },
  { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt', category: 'courage' },
  { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein', category: 'resilience' },
  { text: 'Be the change that you wish to see in the world.', author: 'Mahatma Gandhi', category: 'general' },
  { text: 'What we think, we become.', author: 'Buddha', category: 'focus' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney', category: 'focus' },
  { text: 'Life is 10% what happens to us and 90% how we react to it.', author: 'Charles R. Swindoll', category: 'resilience' },
  { text: 'Opportunities don\'t happen. You create them.', author: 'Chris Grosser', category: 'growth' },
  { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela', category: 'courage' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson', category: 'focus' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha', category: 'focus' },
  { text: 'Strive not to be a success, but rather to be of value.', author: 'Albert Einstein', category: 'general' },
  { text: 'When you arise in the morning, think of what a precious privilege it is to be alive.', author: 'Marcus Aurelius', category: 'gratitude' },
  { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky', category: 'courage' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb', category: 'growth' },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin', category: 'resilience' },
  { text: 'Light tomorrow with today.', author: 'Elizabeth Barrett Browning', category: 'general' },
  { text: 'Every moment is a fresh beginning.', author: 'T.S. Eliot', category: 'general' },
  { text: 'Quiet the mind and the soul will speak.', author: 'Ma Jaya Sati Bhagavati', category: 'focus' },
];

export function pickRandomQuote(category?: QuoteCategory): CachedQuote {
  const pool = category
    ? OFFLINE_QUOTES.filter((q) => q.category === category)
    : OFFLINE_QUOTES;
  return pool[Math.floor(Math.random() * pool.length)] ?? OFFLINE_QUOTES[0];
}

export function formatQuote(quote: CachedQuote): string {
  return quote.author ? `"${quote.text}" — ${quote.author}` : `"${quote.text}"`;
}

export function pickQuotes(count: number): CachedQuote[] {
  const shuffled = [...OFFLINE_QUOTES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
