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

// Conservative "potential impact" zone; FEMA designates by county—no official radius.
// 50 km is illustrative for water-safety awareness. See FEMA.gov for official designated areas.
const DISASTER_RADIUS_KM = 50;
const PENALTY_PER_DISASTER = 25;

/** Unique disaster with declaration count for display (avoids repeating the same event 20+ times). */
export type NearbyDisasterSummary = {
  id: string;
  title?: string;
  state?: string;
  type?: string;
  count: number;
};

export type RiskResult = {
  score: number;
  explanation: string;
  nearbyDisasters: NearbyDisasterSummary[];
};

function key(d: Disaster): string {
  return [d.title ?? '', d.state ?? '', d.type ?? ''].join('|');
}

/**
 * Heuristic risk score from 0–100. Uses disaster data from Step 1 (or empty list).
 * Returns disasters within DISASTER_RADIUS_KM, deduplicated by title+state+type with count.
 */
export function computeRiskScore(
  lat: number,
  lng: number,
  disasters: Disaster[]
): RiskResult {
  let score = 100;
  const nearbyRaw: Disaster[] = [];

  for (const d of disasters) {
    if (d.lat != null && d.lng != null) {
      const km = distanceKm(lat, lng, d.lat, d.lng);
      if (km <= DISASTER_RADIUS_KM) {
        score -= PENALTY_PER_DISASTER;
        nearbyRaw.push(d);
      }
    } else if (d.state) {
      // No coords: we could resolve state → lat/lng and check, or treat as "in state" = penalty
      // For MVP, skip state-only checks unless you add a state-to-center lookup
    }
  }

  score = Math.max(0, Math.min(100, score));

  // Deduplicate by title+state+type for display; keep count
  const byKey = new Map<string, { d: Disaster; count: number }>();
  for (const d of nearbyRaw) {
    const k = key(d);
    const existing = byKey.get(k);
    if (existing) existing.count++;
    else byKey.set(k, { d, count: 1 });
  }
  const nearbyDisasters: NearbyDisasterSummary[] = Array.from(byKey.values()).map(
    ({ d, count }) => ({
      id: d.id,
      title: d.title,
      state: d.state,
      type: d.type,
      count,
    })
  );

  const reasonParts = Array.from(byKey.values()).map(({ d, count }) => {
    const label = d.title ? `${d.title}${d.state ? ` (${d.state})` : ''}` : 'Active disaster declaration within 50 km';
    return count > 1 ? `${label} (${count} declarations)` : label;
  });
  const explanation =
    reasonParts.length > 0
      ? `Disaster nearby: ${reasonParts.join('. ')}.`
      : 'No known disasters or water issues in this area. Consider checking local utility reports.';

  return { score, explanation, nearbyDisasters };
}
