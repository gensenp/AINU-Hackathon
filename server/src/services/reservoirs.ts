/**
 * Resolves "which reservoir could supply this area?" using nearest reservoir within radius.
 * Real implementation would use utility boundaries or state/county → source mapping.
 */
import { RESERVOIRS, type Reservoir } from '../data/reservoirs.js';

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Max distance (km) to consider a reservoir as "possible source" for a point. */
const MAX_SOURCE_KM = 250;

export type ReservoirForPoint = {
  reservoir: Reservoir;
  distanceKm: number;
};

/**
 * Returns the nearest reservoir within MAX_SOURCE_KM, as a proxy for "water source for this area".
 */
export function getReservoirForPoint(lat: number, lng: number): ReservoirForPoint | null {
  let nearest: { reservoir: Reservoir; distanceKm: number } | null = null;
  for (const r of RESERVOIRS) {
    const km = distanceKm(lat, lng, r.lat, r.lng);
    if (km <= MAX_SOURCE_KM && (nearest === null || km < nearest.distanceKm)) {
      nearest = { reservoir: r, distanceKm: km };
    }
  }
  return nearest;
}
