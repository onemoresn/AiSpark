export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  city?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

export interface NewsArticle {
  title: string;
  summary: string;
  source: string;
}

export interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
}
