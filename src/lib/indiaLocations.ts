import data from './indiaLocations.json';
import { supabase } from '@/integrations/supabase/client';

export type IndiaLocality = {
  name: string;
  pincodes: string[];
};

type Place = { state: string; district: string };

type LocationIndex = {
  states: Record<string, string[]>;
  aliases: {
    states: Record<string, string>;
    districts: Record<string, string>;
    combinedStates: Record<string, string[]>;
    relocate?: Record<string, Place>;
  };
};

const INDEX = data as LocationIndex;

/** How many locality matches to paint at once. Search still covers the full list. */
export const INDIA_LOCALITY_WINDOW = 80;

const stateLookup = new Map<string, string>();
for (const state of Object.keys(INDEX.states)) stateLookup.set(state.toLowerCase(), state);
for (const [alias, target] of Object.entries(INDEX.aliases.states ?? {})) {
  stateLookup.set(alias.toLowerCase(), target);
}

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function resolveIndiaState(state: string): string {
  const trimmed = state.trim();
  if (!trimmed) return '';
  return stateLookup.get(trimmed.toLowerCase()) ?? trimmed;
}

export function resolveIndiaPlace(state: string, district: string): Place {
  const trimmedDistrict = district.trim();
  const canonicalState = resolveIndiaState(state);
  if (!trimmedDistrict) return { state: canonicalState, district: '' };

  const relocate =
    INDEX.aliases.relocate?.[`${canonicalState}|${trimmedDistrict}`] ??
    INDEX.aliases.relocate?.[`${state.trim()}|${trimmedDistrict}`];
  if (relocate) return relocate;

  const alias =
    INDEX.aliases.districts?.[`${canonicalState}|${trimmedDistrict}`] ??
    INDEX.aliases.districts?.[`${state.trim()}|${trimmedDistrict}`];
  const list = getIndiaDistricts(canonicalState);
  const named = alias ?? trimmedDistrict;
  const hit = list.find((item) => item.toLowerCase() === named.toLowerCase());
  return { state: canonicalState, district: hit ?? named };
}

export function resolveIndiaDistrict(state: string, district: string): string {
  return resolveIndiaPlace(state, district).district;
}

export function getIndiaStates(): string[] {
  return Object.keys(INDEX.states).sort((a, b) => a.localeCompare(b));
}

export function getIndiaDistricts(state: string): string[] {
  const trimmed = state.trim();
  const resolved = resolveIndiaState(trimmed);
  const parts = INDEX.aliases.combinedStates?.[trimmed] ?? INDEX.aliases.combinedStates?.[resolved];
  if (parts) return sortedUnique(parts.flatMap((part) => INDEX.states[part] ?? []));
  return [...(INDEX.states[resolved] ?? [])].sort((a, b) => a.localeCompare(b));
}

export function isIndiaState(state: string): boolean {
  const trimmed = state.trim();
  if (!trimmed) return false;
  if (INDEX.states[resolveIndiaState(trimmed)]) return true;
  return Boolean(INDEX.aliases.combinedStates?.[trimmed]);
}

export function isIndiaDistrict(state: string, district: string): boolean {
  const place = resolveIndiaPlace(state, district);
  return getIndiaDistricts(place.state).includes(place.district);
}

export function pincodesFromLocalities(localities: IndiaLocality[], city = ''): string[] {
  const needle = city.trim().toLowerCase();
  if (needle) {
    const hit = localities.find((locality) => locality.name.toLowerCase() === needle);
    if (hit && hit.pincodes.length > 0) return [...hit.pincodes].sort();
  }
  return sortedUnique(localities.flatMap((locality) => locality.pincodes));
}

function parseLocalities(data: unknown): IndiaLocality[] {
  let value = data;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const name = String((row as { name?: unknown }).name ?? '').trim();
    if (!name) return [];
    const pins = (row as { pincodes?: unknown }).pincodes;
    const pincodes = Array.isArray(pins)
      ? sortedUnique(pins.map((pin) => String(pin)).filter((pin) => /^[1-9]\d{5}$/.test(pin)))
      : [];
    return [{ name, pincodes }];
  });
}

type LocalityPack = Record<string, [string, string[]][]>;

const localityCache = new Map<string, IndiaLocality[]>();
const localityInflight = new Map<string, Promise<IndiaLocality[]>>();
const packCache = new Map<string, LocalityPack>();
const packInflight = new Map<string, Promise<LocalityPack | null>>();

export function localityPackSlug(state: string): string {
  return state
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rowsFromPack(pack: LocalityPack, district: string): IndiaLocality[] {
  return (pack[district] ?? []).map(([name, pincodes]) => ({
    name,
    pincodes: [...pincodes].sort(),
  }));
}

/** Full directory for one state, shipped with the app. The database copy can be empty. */
async function loadLocalityPack(state: string): Promise<LocalityPack | null> {
  const resolved = resolveIndiaState(state);
  if (!resolved) return null;
  const cached = packCache.get(resolved);
  if (cached) return cached;
  const pending = packInflight.get(resolved);
  if (pending) return pending;

  const request = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}india-localities/${localityPackSlug(resolved)}.json`);
    if (!response.ok) return null;
    const pack = (await response.json()) as LocalityPack;
    packCache.set(resolved, pack);
    return pack;
  })().finally(() => {
    packInflight.delete(resolved);
  });

  packInflight.set(resolved, request);
  return request;
}

export async function fetchIndiaLocalities(state: string, district: string): Promise<IndiaLocality[]> {
  const place = resolveIndiaPlace(state, district);
  if (!place.state || !place.district) return [];
  const key = `${place.state}|${place.district}`;
  const cached = localityCache.get(key);
  if (cached) return cached;
  const pending = localityInflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const pack = await loadLocalityPack(place.state);
    const packed = pack ? rowsFromPack(pack, place.district) : [];
    if (packed.length > 0) {
      localityCache.set(key, packed);
      return packed;
    }
    const { data, error } = await supabase.rpc('india_localities', {
      p_state: place.state,
      p_district: place.district,
    });
    if (error) throw error;
    const rows = parseLocalities(data);
    localityCache.set(key, rows);
    return rows;
  })().finally(() => {
    localityInflight.delete(key);
  });

  localityInflight.set(key, request);
  return request;
}

export async function searchIndiaLocalities(state: string, query: string): Promise<IndiaLocality[]> {
  const trimmed = query.trim();
  const placeState = resolveIndiaState(state);
  if (trimmed.length < 2 || !placeState) return [];
  const needle = trimmed.toLowerCase();
  const pack = await loadLocalityPack(placeState);
  if (pack) {
    const matches: IndiaLocality[] = [];
    for (const rows of Object.values(pack)) {
      for (const [name, pincodes] of rows) {
        if (!name.toLowerCase().startsWith(needle)) continue;
        matches.push({ name, pincodes: [...pincodes].sort() });
      }
    }
    if (matches.length > 0) {
      return matches.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50);
    }
  }
  const { data, error } = await supabase.rpc('india_locality_search', {
    p_state: placeState,
    p_query: trimmed,
  });
  if (error) throw error;
  return parseLocalities(data);
}

/** District for a saved city when district was not stored. */
export async function findIndiaDistrict(state: string, city: string): Promise<string> {
  const placeState = resolveIndiaState(state);
  const trimmed = city.trim();
  if (!placeState || !trimmed) return '';
  const needle = trimmed.toLowerCase();
  const pack = await loadLocalityPack(placeState);
  if (pack) {
    for (const [district, rows] of Object.entries(pack)) {
      if (rows.some(([name]) => name.toLowerCase() === needle)) return district;
    }
  }
  const { data, error } = await supabase.rpc('india_find_district', {
    p_state: placeState,
    p_city: trimmed,
  });
  if (error || data == null || data === '') return '';
  return String(data);
}
