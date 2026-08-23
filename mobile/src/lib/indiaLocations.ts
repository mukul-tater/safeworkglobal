import data from './indiaLocations.json';

export type DistrictLocation = {
  cities: string[];
  pincodes: string[];
  cityPincodes?: Record<string, string[]>;
};

type LocationTree = Record<string, Record<string, DistrictLocation>>;

const TREE = data as LocationTree;

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function getIndiaStates(): string[] {
  return Object.keys(TREE).sort((a, b) => a.localeCompare(b));
}

export function getIndiaDistricts(state: string): string[] {
  const districts = TREE[state];
  return districts ? Object.keys(districts).sort((a, b) => a.localeCompare(b)) : [];
}

export function getIndiaCities(state: string, district: string): string[] {
  if (!state || !district) return [];
  return [...(TREE[state]?.[district]?.cities ?? [])].sort((a, b) => a.localeCompare(b));
}

export function getIndiaCitiesInState(state: string): string[] {
  const districts = TREE[state];
  if (!districts) return [];
  return sortedUnique(Object.values(districts).flatMap((d) => d.cities));
}

export function getIndiaPincodes(state: string, district: string, city = ''): string[] {
  const node = TREE[state]?.[district];
  if (!node) return [];
  const cityPins = city.trim() ? node.cityPincodes?.[city.trim()] : undefined;
  if (cityPins && cityPins.length > 0) return [...cityPins].sort();
  return [...(node.pincodes ?? [])].sort();
}
