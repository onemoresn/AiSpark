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

interface WikipediaSummary {
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return (await response.json()) as T;
    }
  } catch {
    // Fall through to proxy.
  }

  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const proxyResponse = await fetch(proxyUrl);
  if (!proxyResponse.ok) {
    throw new Error('Search unavailable');
  }
  return (await proxyResponse.json()) as T;
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const data = await fetchJson<DuckDuckGoResponse>(url);
  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading ?? query,
      snippet: data.AbstractText,
      url: data.AbstractURL,
    });
  }

  for (const topic of data.RelatedTopics ?? []) {
    if (topic.Text && results.length < 4) {
      results.push({
        title: topic.Text.split(' - ')[0] ?? topic.Text,
        snippet: topic.Text,
        url: topic.FirstURL,
      });
    }
  }

  return results;
}

async function searchWikipedia(query: string): Promise<SearchResult | null> {
  const searchUrl =
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}` +
    '&limit=1&namespace=0&format=json&origin=*';

  const searchData = await fetchJson<[string, string[], string[], string[]]>(searchUrl);
  const title = searchData[1]?.[0];
  if (!title) return null;

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, '_')
  )}`;

  const summary = await fetchJson<WikipediaSummary>(summaryUrl);
  if (!summary.extract) return null;

  return {
    title: summary.title ?? title,
    snippet: summary.extract,
    url: summary.content_urls?.desktop?.page,
  };
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  const results = await searchDuckDuckGo(query);

  if (results.length === 0) {
    const wiki = await searchWikipedia(query);
    if (wiki) {
      results.push(wiki);
    }
  }

  if (results.length === 0) {
    results.push({
      title: query,
      snippet: `I searched the web for "${query}" but couldn't find a clear summary right now. Your curiosity still matters — try rephrasing or ask about today's weather or headlines.`,
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
    summary
  );
}

export function detectSearchIntent(message: string): boolean {
  return /\b(what is|who is|when did|how does|tell me about|explain|define|search for|look up|find out)\b/i.test(
    message
  );
}
