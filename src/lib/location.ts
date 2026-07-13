import * as Location from 'expo-location';
import type { LocationCoords } from './inspire/types';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getUserLocation(): Promise<LocationCoords | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  let city: string | undefined;
  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    if (place) {
      city = [place.city, place.region].filter(Boolean).join(', ');
    }
  } catch {
    // Geocoding is optional
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    city,
  };
}
