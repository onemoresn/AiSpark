import { Platform } from 'react-native';
import type { LocationCoords } from './inspire/types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const LOCATION_TIMEOUT_MS = 3000;

let cachedLocation: LocationCoords | null = null;
let cachedAt = 0;
let inflightLocation: Promise<LocationCoords | null> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location timed out')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function fetchBrowserLocation(): Promise<LocationCoords | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: LOCATION_TIMEOUT_MS, maximumAge: CACHE_TTL_MS }
    );
  });
}

async function fetchNativeLocation(): Promise<LocationCoords | null> {
  const Location = await import('expo-location');
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

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

async function fetchLocation(): Promise<LocationCoords | null> {
  try {
    const coords =
      Platform.OS === 'web'
        ? await withTimeout(fetchBrowserLocation(), LOCATION_TIMEOUT_MS)
        : await withTimeout(fetchNativeLocation(), LOCATION_TIMEOUT_MS);

    if (coords) {
      cachedLocation = coords;
      cachedAt = Date.now();
    }
    return coords;
  } catch {
    return null;
  }
}

export async function getUserLocation(): Promise<LocationCoords | null> {
  if (cachedLocation && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedLocation;
  }

  if (!inflightLocation) {
    inflightLocation = fetchLocation().finally(() => {
      inflightLocation = null;
    });
  }

  return inflightLocation;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    const location = await getUserLocation();
    return location != null;
  }

  const Location = await import('expo-location');
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}
