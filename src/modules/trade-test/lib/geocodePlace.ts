import type { MapPoint } from './distance';

type GeoHit = {
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  country_code?: string;
};

const cache = new Map<string, MapPoint | null>();

function pickHit(hits: GeoHit[], state: string): MapPoint | null {
  const stateKey = state.trim().toLowerCase();
  const inIndia = hits.filter((hit) => (hit.country_code || '').toUpperCase() === 'IN' || !hit.country_code);
  const pool = inIndia.length ? inIndia : hits;
  const matched = stateKey
    ? pool.find((hit) => (hit.admin1 || '').trim().toLowerCase() === stateKey)
    : undefined;
  const chosen = matched || pool[0];
  if (!chosen || chosen.latitude == null || chosen.longitude == null) return null;
  if (!Number.isFinite(chosen.latitude) || !Number.isFinite(chosen.longitude)) return null;
  return { latitude: chosen.latitude, longitude: chosen.longitude };
}

async function searchPlace(name: string, state: string): Promise<MapPoint | null> {
  const query = name.trim();
  if (!query) return null;
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('countryCode', 'IN');
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const body = (await response.json()) as { results?: GeoHit[] };
  return pickHit(body.results || [], state);
}

/** Map point for the worker's saved city. Null when the place cannot be found. */
export async function geocodeIndianPlace(input: {
  city?: string | null;
  district?: string | null;
  state?: string | null;
}): Promise<MapPoint | null> {
  const city = (input.city || '').trim();
  const district = (input.district || '').trim();
  const state = (input.state || '').trim();
  const key = [city, district, state].join('|').toLowerCase();
  if (!city && !district && !state) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const point =
      (city ? await searchPlace(city, state) : null) ||
      (district && district.toLowerCase() !== city.toLowerCase()
        ? await searchPlace(district, state)
        : null);
    cache.set(key, point);
    return point;
  } catch {
    cache.set(key, null);
    return null;
  }
}
