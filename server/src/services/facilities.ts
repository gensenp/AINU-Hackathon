/**
 * Facilities (power, nuclear, refinery) near a point. Used to flag "disaster near facility" risk.
 */
import { FACILITIES, type Facility, type FacilityType } from '../data/facilities.js';

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

export type FacilityNearby = Facility & { distanceKm: number };

export function getFacilitiesNearPoint(
  lat: number,
  lng: number,
  radiusKm: number = 120
): FacilityNearby[] {
  const out: FacilityNearby[] = [];
  for (const f of FACILITIES) {
    const km = distanceKm(lat, lng, f.lat, f.lng);
    if (km <= radiusKm) out.push({ ...f, distanceKm: km });
  }
  out.sort((a, b) => a.distanceKm - b.distanceKm);
  return out;
}

export function getFacilityTypeLabel(type: FacilityType): string {
  const labels: Record<FacilityType, string> = {
    power_plant: 'Power plant',
    nuclear: 'Nuclear facility',
    refinery: 'Refinery',
    chemical: 'Chemical facility',
  };
  return labels[type] ?? type;
}
