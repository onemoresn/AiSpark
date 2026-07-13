import type { SearchResult } from '../inspire/types';

interface DuckDuckGoTopic {
  Text?: string;
  FirstURL?: string;
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  Heading?: string;
  AbstractURL?: string;
  RelatedTopics?: DuckDuckGoTopic[];
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Search unavailable');

  const data: DuckDuckGoResponse = await response.json();
  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading ?? query,
      snippet: data.AbstractText,
      url: data.AbstractURL,
    });
  }

  const topics = data.RelatedTopics ?? [];
  for (const topic of topics) {
    if (topic.Text && results.length < 4) {
      results.push({
        title: topic.Text.split(' - ')[0] ?? topic.Text,
        snippet: topic.Text,
        url: topic.FirstURL,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      title: query,
      snippet: `I looked into "${query}" — while details were limited, your curiosity is a sign you're growing and exploring.`,
    });
  }

  return results;
}

export function formatSearchResponse(query: string, results: SearchResult[]): string {
  const top = results[0];
  const summary = results
    .slice(0, 3)
    .map((r) => `• ${r.snippet}`)
    .join('\n');

  return (
    `Here's what I found about "${query}":\n\n` +
    (top?.snippet ? `${top.snippet}\n\n` : '') +
    summary +
    '\n\nEvery question you ask is a step toward clarity — keep that curiosity alive.'
  );
}

export function detectSearchIntent(message: string): boolean {
  return /\b(what is|who is|when did|how does|tell me about|explain|define|search for)\b/i.test(message);
}
