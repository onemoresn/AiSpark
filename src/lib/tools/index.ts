import { getUserLocation } from '../location';
import type { LocationCoords } from '../inspire/types';
import { getWeather, formatWeatherResponse } from './weather';
import { getNews, formatNewsResponse } from './news';
import { webSearch, formatSearchResponse } from './webSearch';

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  location?: LocationCoords | null
): Promise<string> {
  switch (name) {
    case 'get_weather': {
      const lat = (args.latitude as number) ?? location?.latitude;
      const lon = (args.longitude as number) ?? location?.longitude;
      const locName = (args.location_name as string) ?? location?.city;

      if (lat == null || lon == null) {
        const userLoc = location ?? (await getUserLocation());
        if (!userLoc) {
          return "I couldn't reach your location right now, but the day still holds plenty of potential. Step outside when you can and let the air reset your focus.";
        }
        const weather = await getWeather(userLoc.latitude, userLoc.longitude, userLoc.city);
        return formatWeatherResponse(weather);
      }

      const weather = await getWeather(lat, lon, locName);
      return formatWeatherResponse(weather);
    }

    case 'get_news': {
      const articles = await getNews();
      return formatNewsResponse(articles);
    }

    case 'web_search': {
      const query = args.query as string;
      if (!query) return 'What would you like me to look up for you?';
      const results = await webSearch(query);
      return formatSearchResponse(query, results);
    }

    default:
      return 'I found a moment to pause and reflect — sometimes that clarity is exactly what we need.';
  }
}
