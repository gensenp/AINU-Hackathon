/**
 * Water quality scoring: feature extraction, formula-based score, and optional ML (linear model).
 * Uses EPA WQP data, FEMA disasters, and optional OSM water source mix.
 */

import type { Disaster } from './disasters.js';
import type { WqpLocationData } from './epaWqp.js';
import type { WaterSource } from './waterSources.js';

/** Fixed-length feature vector for scoring. Order must match everywhere. */
export const FEATURE_NAMES = [
  'intercept',
  'disaster_count',
  'disaster_penalty',
  'wqp_station_count',
  'wqp_result_count',
  'has_recent_results',
  'water_source_score',
] as const;

const R = 6371; // Earth radius km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DISASTER_RADIUS_KM = 50;
const PENALTY_PER_DISASTER = 25;

export type WaterQualityFeatures = {
  disasterCount: number;
  disasterPenalty: number;
  wqpStationCount: number;
  wqpResultCount: number;
  hasRecentResults: number; // 0 or 1
  waterSourceScore: number; // 0–100, from OSM source mix
};

/**
 * Compute 0–100 score from nearby water source mix (OSM). Higher = safer/more designated drinking water.
 */
export function waterSourceScoreFromList(sources: WaterSource[], limit: number = 10): number {
  if (sources.length === 0) return 50; // neutral
  const top = sources.slice(0, limit);
  let sum = 0;
  for (const s of top) {
    if (s.potableHint === 'yes') sum += 100;
    else if (s.type === 'drinking_water') sum += 85;
    else if (s.type === 'well' || s.type === 'spring') sum += 60;
    else if (s.type === 'fountain') sum += 50;
    else if (s.type === 'reservoir') sum += 30;
    else sum += 20; // river or unknown
  }
  return Math.round(sum / top.length);
}

/**
 * Build numeric feature vector for a location.
 * Order: [1, disasterCount, disasterPenalty, wqpStationCount, wqpResultCount, hasRecentResults, waterSourceScore]
 */
export function buildFeatures(
  lat: number,
  lng: number,
  disasters: Disaster[],
  wqpData: WqpLocationData | null,
  waterSourceScore: number = 50
): { features: number[]; details: WaterQualityFeatures } {
  let disasterCount = 0;
  let disasterPenalty = 0;
  for (const d of disasters) {
    if (d.lat == null || d.lng == null) continue;
    const km = distanceKm(lat, lng, d.lat, d.lng);
    if (km <= DISASTER_RADIUS_KM) {
      disasterCount += 1;
      const factor = 1 - km / DISASTER_RADIUS_KM;
      disasterPenalty += PENALTY_PER_DISASTER * factor;
    }
  }
  disasterPenalty = Math.min(disasterPenalty, 60);

  const wqpStationCount = wqpData?.stationSummary?.stationCount ?? 0;
  const wqpResultCount = wqpData?.resultSummary?.resultCount ?? 0;
  const currentYear = new Date().getFullYear();
  const latestYear = wqpData?.resultSummary?.latestYear ?? 0;
  const hasRecentResults = wqpResultCount > 0 && latestYear >= currentYear - 1 ? 1 : 0;

  const details: WaterQualityFeatures = {
    disasterCount,
    disasterPenalty,
    wqpStationCount,
    wqpResultCount,
    hasRecentResults,
    waterSourceScore,
  };

  const features = [
    1,
    details.disasterCount,
    details.disasterPenalty,
    details.wqpStationCount,
    Math.min(details.wqpResultCount, 1000) / 1000, // normalize to 0–1 scale for ML
    details.hasRecentResults,
    details.waterSourceScore / 100,
  ];
  return { features, details };
}

/**
 * Formula-based water quality score (0–100). No ML.
 */
export function scoreFromFormula(features: number[], details: WaterQualityFeatures): number {
  let score = 100;
  score -= details.disasterPenalty;
  // No recent EPA monitoring data → small uncertainty penalty
  if (details.wqpStationCount === 0 && details.wqpResultCount === 0) {
    score -= 8;
  } else if (details.hasRecentResults === 1) {
    score += Math.min(5, Math.floor(details.wqpResultCount / 100)); // bonus for recent data
  }
  // Water source mix (OSM) nudges score
  score += (details.waterSourceScore - 50) * 0.2; // ±10 max from 50 baseline
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Predict score using a linear model: score = weights · features.
 */
export function scoreFromModel(weights: number[], features: number[]): number {
  if (weights.length !== features.length) return 50; // fallback
  let s = 0;
  for (let i = 0; i < weights.length; i++) s += weights[i] * features[i];
  return Math.max(0, Math.min(100, Math.round(s)));
}

/**
 * Fit multiple linear regression: features (rows) × target scores.
 * Returns weights for the same feature order (including intercept).
 */
export function fitLinearModel(
  samples: { features: number[]; score: number }[]
): number[] {
  const n = samples.length;
  if (n < 3) return [];

  const dim = samples[0].features.length;
  // Normal equation: (X'X) w = X' y  =>  w = (X'X)^{-1} X' y
  const XtX: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0));
  const Xty: number[] = Array(dim).fill(0);

  for (const { features: x, score: y } of samples) {
    if (x.length !== dim) continue;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) XtX[i][j] += x[i] * x[j];
      Xty[i] += x[i] * y;
    }
  }

  // Invert XtX (Gauss–Jordan)
  const inv = matrixInverse(XtX);
  if (!inv) return [];

  const weights: number[] = [];
  for (let i = 0; i < dim; i++) {
    let w = 0;
    for (let j = 0; j < dim; j++) w += inv[i][j] * Xty[j];
    weights.push(w);
  }
  return weights;
}

function matrixInverse(M: number[][]): number[][] | null {
  const n = M.length;
  const A = M.map((row) => [...row]);
  const I = A.map((_, i) => A.map((_, j) => (i === j ? 1 : 0)));

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    [I[col], I[pivot]] = [I[pivot], I[col]];
    const div = A[col][col];
    if (Math.abs(div) < 1e-10) return null;
    for (let j = 0; j < n; j++) {
      A[col][j] /= div;
      I[col][j] /= div;
    }
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let j = 0; j < n; j++) {
        A[row][j] -= factor * A[col][j];
        I[row][j] -= factor * I[col][j];
      }
    }
  }
  return I;
}

/**
 * Build explanation text from features and score.
 */
export function explainScore(score: number, details: WaterQualityFeatures, wqpPartial: boolean): string {
  const parts: string[] = [];
  if (details.disasterCount > 0) {
    parts.push(`${details.disasterCount} disaster declaration(s) within ${DISASTER_RADIUS_KM} km`);
  } else {
    parts.push('No known disasters within 50 km');
  }
  if (details.wqpStationCount > 0 || details.wqpResultCount > 0) {
    parts.push(
      `EPA monitoring: ${details.wqpStationCount} station(s), ${details.wqpResultCount} recent result(s)`
    );
    if (details.hasRecentResults === 1) parts.push('Recent water quality data available');
  } else {
    parts.push('No EPA Water Quality Portal data in this area');
  }
  if (wqpPartial) parts.push('(Partial WQP data)');
  return parts.join('. ');
}
