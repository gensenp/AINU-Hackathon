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
  } else {
    reasons.push(`No known disasters within ${DISASTER_RADIUS_KM} km`);
  }

  // 2) Water source quality risk (uses nearest few points)
  const nearest = [...waterPoints]
    .map((p) => ({
      ...p,
      km: distanceKm(lat, lng, p.lat, p.lng),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  let waterPenalty = 0;
  if (nearest.length > 0) {
    for (const p of nearest) {
      const base = waterBasePenalty(p.type, p.potableHint);
      const distanceFactor = Math.max(0.2, 1 - p.km / 30);
      waterPenalty += base * distanceFactor;
    }
    waterPenalty = Math.min((waterPenalty / nearest.length) * 1.8, 35);
    score -= waterPenalty;

    // Data-driven summary: count by type (treat potable=yes as safest)
    const drinking = nearest.filter((p) => p.type === 'drinking_water' || p.potableHint === 'yes').length;
    const fountain = nearest.filter((p) => p.type === 'fountain').length;
    const wellOrSpring = nearest.filter((p) => p.type === 'well' || p.type === 'spring').length;
    const untreated = nearest.filter(
      (p) =>
        p.potableHint !== 'yes' &&
        (p.type === 'river' || p.type === 'reservoir' || p.type === 'fountain')
    ).length;
    const unknownType = nearest.filter((p) => !p.type || p.type === 'river').length;

    const parts: string[] = [];
    if (drinking > 0) parts.push(`${drinking} designated drinking water`);
    if (fountain > 0) parts.push(`${fountain} ${fountain === 1 ? 'fountain' : 'fountains'}`);
    if (wellOrSpring > 0) parts.push(`${wellOrSpring} well/spring`);
    if (untreated > 0 || (unknownType > 0 && drinking === 0)) {
      const n = untreated || unknownType;
      parts.push(`${n} untreated or uncertain`);
    }
    const waterSummary =
      parts.length > 0
        ? `Nearby sources (nearest 5): ${parts.join(', ')}.`
        : 'Nearby water sources present; types vary.';

    // Only say "mostly untreated/uncertain" when a majority are risky and the score is actually reduced by water
    const majorityRisky =
      untreated >= Math.ceil(nearest.length / 2) ||
      (drinking === 0 && fountain + wellOrSpring >= nearest.length);
    const waterPenaltySignificant = waterPenalty >= 10;

    if (majorityRisky && waterPenaltySignificant) {
      reasons.push(`Nearest water options are mostly untreated or uncertain. ${waterSummary}`);
    } else if (drinking >= 1 && waterPenalty < 8) {
      reasons.push(`${waterSummary} Overall risk from water is low.`);
    } else {
      reasons.push(waterSummary);
    }
  } else {
    score -= 6;
    reasons.push('Limited nearby water-source data; consider checking local maps or authorities.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const explanation =
    reasons.length > 0
      ? reasons.join(' ')
      : 'No major nearby disaster or water quality concerns detected.';

  return { score, explanation };
}
