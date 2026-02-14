import type { Disaster } from './disasters.js';

/** Rough distance in km between two points (Haversine). */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DISASTER_RADIUS_KM = 150;
const PENALTY_PER_DISASTER = 25;

export type RiskResult = { score: number; explanation: string };

/**
 * Heuristic risk score from 0–100. Uses disaster data from Step 1 (or empty list).
 */
export function computeRiskScore(
  lat: number,
  lng: number,
  disasters: Disaster[]
): RiskResult {
  let score = 100;
  const reasons: string[] = [];

  for (const d of disasters) {
    if (d.lat != null && d.lng != null) {
      const km = distanceKm(lat, lng, d.lat, d.lng);
      if (km <= DISASTER_RADIUS_KM) {
        score -= PENALTY_PER_DISASTER;
        reasons.push(
          d.title ? `Disaster nearby: ${d.title}` : 'Active disaster declaration within 150 km'
        );
      }
    } else if (d.state) {
      // No coords: we could resolve state → lat/lng and check, or treat as "in state" = penalty
      // For MVP, skip state-only checks unless you add a state-to-center lookup
    }
  }

  score = Math.max(0, Math.min(100, score));

  const explanation =
    reasons.length > 0
      ? reasons.join('. ')
      : 'No known disasters or water issues in this area. Consider checking local utility reports.';

  return { score, explanation };
}
