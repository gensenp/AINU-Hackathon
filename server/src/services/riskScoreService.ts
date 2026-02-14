import type { Disaster } from './disasters.js';

export type NearbyWaterPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type?: string;
  potableHint?: 'yes' | 'no' | 'unknown';
};

export type RiskResult = { score: number; explanation: string };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function waterBasePenalty(type?: string, potableHint?: 'yes' | 'no' | 'unknown'): number {
  if (potableHint === 'yes') return 0;
  if (potableHint === 'no') return 15;

  if (type === 'drinking_water') return 2;
  if (type === 'spring' || type === 'well') return 4;
  if (type === 'fountain') return 8;
  if (type === 'reservoir' || type === 'river') return 12;
  return 6;
}

/**
 * Hybrid score:
 * - FEMA proximity risk (regional disaster signal)
 * - Nearby water-source quality risk (global local signal)
 */
export function computeRiskScore(
  lat: number,
  lng: number,
  disasters: Disaster[],
  waterPoints: NearbyWaterPoint[] = []
): RiskResult {
  let score = 100;
  const reasons: string[] = [];

  // 1) FEMA disaster proximity risk
  const DISASTER_RADIUS_KM = 500;
  let disasterPenalty = 0;
  let nearbyDisasterCount = 0;

  for (const d of disasters) {
    if (d.lat == null || d.lng == null) continue;

    const km = distanceKm(lat, lng, d.lat, d.lng);
    if (km > DISASTER_RADIUS_KM) continue;

    nearbyDisasterCount += 1;

    // Closer disasters penalize more (max 22 each)
    const proximityFactor = 1 - km / DISASTER_RADIUS_KM; // 0..1
    disasterPenalty += 22 * proximityFactor;
  }

  // Cap disaster penalty so one region does not always force score to 0
  disasterPenalty = Math.min(disasterPenalty, 60);
  score -= disasterPenalty;

  if (nearbyDisasterCount > 0) {
    reasons.push(`${nearbyDisasterCount} disaster declaration(s) within ${DISASTER_RADIUS_KM} km`);
  }

  // 2) Water source quality risk (uses nearest few points)
  const nearest = [...waterPoints]
    .map((p) => ({
      ...p,
      km: distanceKm(lat, lng, p.lat, p.lng),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  if (nearest.length > 0) {
    let waterPenalty = 0;

    for (const p of nearest) {
      const base = waterBasePenalty(p.type, p.potableHint);

      // Nearby points matter more; far points still count a little
      const distanceFactor = Math.max(0.2, 1 - p.km / 30); // 0.2..1
      waterPenalty += base * distanceFactor;
    }

    // Average + scale, then cap
    waterPenalty = Math.min((waterPenalty / nearest.length) * 1.8, 35);
    score -= waterPenalty;

    const riskyTypes = nearest.filter(
      (p) =>
        p.potableHint !== 'yes' &&
        (p.type === 'river' || p.type === 'reservoir' || p.type === 'fountain')
    ).length;

    if (riskyTypes > 0) {
      reasons.push('nearest water options are mostly untreated/uncertain sources');
    } else {
      reasons.push('nearby water options include safer candidates');
    }
  } else {
    // No local water-source data -> slight uncertainty penalty
    score -= 6;
    reasons.push('limited nearby water-source data');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    reasons.length > 0
      ? reasons.join('. ')
      : 'No major nearby disaster or water quality concerns detected.';

  return { score, explanation };
}
