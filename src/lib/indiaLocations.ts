import data from './indiaLocations.json';

type LocationEntry = {
  districts: string[];
  cities: string[];
};

const LOCATIONS: Record<string, LocationEntry> = {
  ...(data as Record<string, LocationEntry>),
  Ladakh: (data as Record<string, LocationEntry>).Ladakh ?? {
    districts: ['Kargil', 'Leh'],
    cities: ['Kargil', 'Leh'],
  },
};

export function getIndiaStates(): string[] {
  return Object.keys(LOCATIONS).sort((a, b) => a.localeCompare(b));
}

export function getIndiaDistricts(state: string): string[] {
  return LOCATIONS[state]?.districts ?? [];
}

export function getIndiaCities(state: string, district: string): string[] {
  const all = LOCATIONS[state]?.cities ?? [];
  const d = district.trim().toLowerCase();
  const matched = d
    ? all.filter((city) => {
        const c = city.toLowerCase();
        return c === d || c.includes(d) || d.includes(c);
      })
    : all;
  const list = matched.length > 0 ? matched : all;
  const unique = new Set<string>([...(district.trim() ? [district.trim()] : []), ...list]);
  return [...unique].sort((a, b) => a.localeCompare(b));
}
