/**
 * Fetches nearby drinking water sources from OpenStreetMap via the Overpass API.
 * Uses amenity=drinking_water and drinking fountains (no API key required).
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_RADIUS_M = 15_000; // 15 km

export type WaterPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  distanceKm: number;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; amenity?: string; fountain?: string };
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  return `[out:json][timeout:25];
(
  node(around:${radiusM},${lat},${lng})["amenity"="drinking_water"];
  node(around:${radiusM},${lat},${lng})["amenity"="fountain"]["fountain"="drinking"];
);
out center tags;`;
}

function elementToPoint(
  el: OverpassElement,
  userLat: number,
  userLng: number
): WaterPoint | null {
  let lat: number;
  let lng: number;
  if (el.lat != null && el.lon != null) {
    lat = el.lat;
    lng = el.lon;
  } else if (el.center) {
    lat = el.center.lat;
    lng = el.center.lon;
  } else {
    return null;
  }
  const name = el.tags?.name?.trim() || `Drinking water (${el.type} ${el.id})`;
  const distanceKm = Math.round(haversineKm(userLat, userLng, lat, lng) * 100) / 100;
  return {
    id: `${el.type}-${el.id}`,
    lat,
    lng,
    name,
    distanceKm,
  };
}

/**
 * Fetch nearest clean/drinking water points from OpenStreetMap.
 * Returns null on network/parse error so callers can fall back to demo data.
 */
export async function getNearbyWaterFromOSM(
  lat: number,
  lng: number,
  limit: number = 10,
  radiusM: number = DEFAULT_RADIUS_M
): Promise<WaterPoint[] | null> {
  const query = buildOverpassQuery(lat, lng, radiusM);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const json: OverpassResponse = await res.json();
    const elements = json.elements ?? [];
    const points: WaterPoint[] = [];
    const seen = new Set<string>();
    for (const el of elements) {
      const point = elementToPoint(el, lat, lng);
      if (!point || seen.has(point.id)) continue;
      seen.add(point.id);
      points.push(point);
    }
    points.sort((a, b) => a.distanceKm - b.distanceKm);
    return points.slice(0, limit);
  } catch {
    return null;
  }
}
