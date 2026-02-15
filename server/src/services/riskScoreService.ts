/**
 * Water-safety risk score (0–100). Factors:
 * - Disasters near the selected point (FEMA)
 * - Disaster near the area's water source reservoir → source at risk
 * - Disaster near hazardous facilities (power, nuclear, refinery) → higher susceptibility
 */
import type { Disaster } from './disasters.js';
import type { ReservoirForPoint } from './reservoirs.js';
import type { FacilityNearby } from './facilities.js';

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
const DISASTER_RADIUS_KM = 50;
const PENALTY_PER_DISASTER = 25;
const PENALTY_SOURCE_RESERVOIR_IN_ZONE = 15;
const PENALTY_PER_FACILITY_AT_RISK = 10;
const MAX_FACILITY_PENALTY = 20; // cap at 2 facilities

/** One penalty per distinct disaster (FEMA disasterNumber + state), not per declaration row. */
function disasterEventKey(d: Disaster): string {
  if (d.disasterNumber != null && d.state != null) return `${d.disasterNumber}-${d.state}`;
  return d.id;
}

/** Unique disaster with declaration count for display (avoids repeating the same event 20+ times). */
export type NearbyDisasterSummary = {
  id: string;
  title?: string;
  state?: string;
  type?: string;
  count: number;
};

/** Facility that has a disaster within DISASTER_RADIUS_KM (for display). */
export type FacilityAtRisk = FacilityNearby;

export type RiskResult = {
  score: number;
  explanation: string;
  nearbyDisasters: NearbyDisasterSummary[];
  /** Nearest reservoir that could supply this area (if within 250 km). */
  reservoir: ReservoirForPoint | null;
  /** True if any disaster is within 50 km of that reservoir. */
  sourceReservoirInDisasterZone: boolean;
  /** Facilities (power, nuclear, refinery) that have a disaster within 50 km. */
  facilitiesAtRisk: FacilityAtRisk[];
};

function key(d: Disaster): string {
  return [d.title ?? '', d.state ?? '', d.type ?? ''].join('|');
}

export type RiskScoreOptions = {
  reservoir?: ReservoirForPoint | null;
  facilitiesNearby?: FacilityNearby[];
};

/**
 * Heuristic risk score from 0–100. Factors: disasters near point, disaster near source reservoir, disaster near facilities.
 */
export function computeRiskScore(
  lat: number,
  lng: number,
  disasters: Disaster[],
  options: RiskScoreOptions = {}
): RiskResult {
  const { reservoir = null, facilitiesNearby = [] } = options;
  let score = 100;
  const nearbyRaw: Disaster[] = [];
  const seenEvents = new Set<string>();

  for (const d of disasters) {
    if (d.lat != null && d.lng != null) {
      const km = distanceKm(lat, lng, d.lat, d.lng);
      if (km <= DISASTER_RADIUS_KM) {
        nearbyRaw.push(d);
        const eventKey = disasterEventKey(d);
        if (!seenEvents.has(eventKey)) {
          seenEvents.add(eventKey);
          score -= PENALTY_PER_DISASTER;
        }
      }
    }
  }

  // Disaster within 50 km of the area's source reservoir?
  let sourceReservoirInDisasterZone = false;
  if (reservoir) {
    for (const d of disasters) {
      if (d.lat != null && d.lng != null && distanceKm(reservoir.reservoir.lat, reservoir.reservoir.lng, d.lat, d.lng) <= DISASTER_RADIUS_KM) {
        sourceReservoirInDisasterZone = true;
        break;
      }
    }
    if (sourceReservoirInDisasterZone) score -= PENALTY_SOURCE_RESERVOIR_IN_ZONE;
  }

  // Facilities that have a disaster within 50 km
  const facilitiesAtRisk: FacilityAtRisk[] = [];
  for (const f of facilitiesNearby) {
    for (const d of disasters) {
      if (d.lat != null && d.lng != null && distanceKm(f.lat, f.lng, d.lat, d.lng) <= DISASTER_RADIUS_KM) {
        facilitiesAtRisk.push(f);
        break;
      }
    }
  }
  const facilityPenalty = Math.min(MAX_FACILITY_PENALTY, facilitiesAtRisk.length * PENALTY_PER_FACILITY_AT_RISK);
  score -= facilityPenalty;

  score = Math.max(0, Math.min(100, score));

  // Deduplicate disasters by title+state+type for display
  const byKey = new Map<string, { d: Disaster; count: number }>();
  for (const d of nearbyRaw) {
    const k = key(d);
    const existing = byKey.get(k);
    if (existing) existing.count++;
    else byKey.set(k, { d, count: 1 });
  }
  const nearbyDisasters: NearbyDisasterSummary[] = Array.from(byKey.values()).map(
    ({ d, count }) => ({ id: d.id, title: d.title, state: d.state, type: d.type, count })
  );

  const reasonParts = Array.from(byKey.values()).map(({ d, count }) => {
    const label = d.title ? `${d.title}${d.state ? ` (${d.state})` : ''}` : 'Active disaster declaration within 50 km';
    return count > 1 ? `${label} (${count} declarations)` : label;
  });
  const parts: string[] = [];
  if (reasonParts.length > 0) parts.push(`Disaster nearby: ${reasonParts.join('. ')}.`);
  if (sourceReservoirInDisasterZone && reservoir) {
    parts.push(`Your water source (${reservoir.reservoir.name}) is in a disaster zone.`);
  }
  if (facilitiesAtRisk.length > 0) {
    const names = facilitiesAtRisk.map((f) => `${f.name} (${f.type.replace('_', ' ')})`).join(', ');
    parts.push(`Disaster near hazardous facility: ${names}.`);
  }
  const explanation =
    parts.length > 0
    ? parts.join(' ')
    : 'No known disasters or water issues in this area. Consider checking local utility reports.';

  return {
    score,
    explanation,
    nearbyDisasters,
    reservoir: reservoir ?? null,
    sourceReservoirInDisasterZone,
    facilitiesAtRisk,
  };
}
