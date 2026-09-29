export type MapPoint = {
  latitude: number;
  longitude: number;
};

const EARTH_KM = 6371;

export function haversineKm(from: MapPoint, to: MapPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return 'under 1 km';
  return `${Math.round(km)} km`;
}
