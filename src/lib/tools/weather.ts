import type { WeatherData } from '../inspire/types';

const WMO_CODES: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rainy',
  65: 'Heavy rain',
  71: 'Snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Severe thunderstorm',
};

function getWeatherCategory(condition: string): 'sunny' | 'rainy' | 'cloudy' | 'stormy' {
  const lower = condition.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return 'stormy';
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return 'rainy';
  if (lower.includes('cloud') || lower.includes('fog')) return 'cloudy';
  return 'sunny';
}

export function getMotivationalWeatherMessage(category: ReturnType<typeof getWeatherCategory>): string {
  const messages = {
    sunny: "It's bright and full of energy out there — a perfect moment to reset your mind and body.",
    rainy: 'Even with the rain, today carries a calm strength. Use it to reflect, recharge, and grow.',
    cloudy: "Clouds don't dim your potential. Today is a blank canvas waiting for your momentum.",
    stormy: "Storms remind us that powerful change is happening. You're built to rise through it.",
  };
  return messages[category];
}

export async function getWeather(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph';

  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather unavailable');

  const data = await response.json();
  const current = data.current;
  const code = current.weather_code as number;
  const condition = WMO_CODES[code] ?? 'Variable';

  return {
    temperature: Math.round(current.temperature_2m),
    condition,
    description: condition,
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    location: locationName ?? 'your area',
  };
}

export function formatWeatherResponse(weather: WeatherData): string {
  const category = getWeatherCategory(weather.condition);
  const motivation = getMotivationalWeatherMessage(category);

  return (
    `Right now in ${weather.location}, it's ${weather.temperature}°F and ${weather.description.toLowerCase()}. ` +
    `Humidity is ${weather.humidity}% with winds around ${weather.windSpeed} mph.\n\n` +
    motivation
  );
}

export function detectWeatherIntent(message: string): boolean {
  return /\b(weather|today look|how.?s the day|forecast|outside|raining|sunny|cloudy)\b/i.test(message);
}
