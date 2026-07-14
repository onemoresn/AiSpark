import type { NewsArticle } from '../inspire/types';

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function parseRssItems(xml: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
    const desc = block.match(
      /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i
    );
    const source = block.match(/<source>(.*?)<\/source>/i);

    const titleText = title ? stripHtml(title[1] ?? title[2] ?? '') : '';
    const summaryText = desc ? stripHtml(desc[1] ?? desc[2] ?? '').slice(0, 200) : '';

    if (titleText) {
      items.push({
        title: titleText,
        summary: summaryText || titleText,
        source: source ? stripHtml(source[1]) : 'BBC News',
      });
    }
  }

  return items;
}

export async function getNews(): Promise<NewsArticle[]> {
  const feedUrl = 'https://feeds.bbci.co.uk/news/world/rss.xml';
  let xml: string;

  try {
    const response = await fetch(feedUrl);
    if (!response.ok) throw new Error('Direct fetch failed');
    xml = await response.text();
  } catch {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    const proxyResponse = await fetch(proxyUrl);
    if (!proxyResponse.ok) throw new Error('News unavailable');
    xml = await proxyResponse.text();
  }

  const articles = parseRssItems(xml);

  if (articles.length === 0) throw new Error('No headlines found');
  return articles;
}

export function formatNewsResponse(articles: NewsArticle[]): string {
  const headlines = articles
    .slice(0, 4)
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join('\n');

  return (
    "Here's a calm look at what's happening today:\n\n" +
    headlines +
    '\n\nNo matter what the world is navigating, you still have the power to shape your own direction.'
  );
}

export function detectNewsIntent(message: string): boolean {
  return /\b(news|headlines|headline|in the news|news today|happening today|what.?s going on|current events|world today|what.?s happening)\b/i.test(
    message
  );
}
