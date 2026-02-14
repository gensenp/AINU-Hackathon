/**
 * Fetches real-time drinking water locations from OpenStreetMap (Overpass API).
 * "Clean water source" here = OSM nodes tagged amenity=drinking_water (fountains, taps, etc.).
 * We do not verify water quality; we show mapped public drinking water locations.
 */
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export type WaterPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: 'fountain' | 'tap' | 'refill' | 'other';
};

type OverpassTags = {
  name?: string;
  man_made?: string;
  fountain?: string;
  description?: string;
  [k: string]: string | undefined;
};

function bboxAround(lat: number, lng: number, radiusKm: number): string {
  const delta = radiusKm / 111;
  const minLat = lat - delta;
  const maxLat = lat + delta;
  const minLng = lng - delta / Math.cos((lat * Math.PI) / 180);
  const maxLng = lng + delta / Math.cos((lat * Math.PI) / 180);
  return `${minLat},${minLng},${maxLat},${maxLng}`;
}

function categoryFromTags(tags: OverpassTags | undefined): WaterPoint['category'] {
  if (!tags) return 'other';
  const m = tags.man_made?.toLowerCase();
  const f = tags.fountain?.toLowerCase();
  if (m === 'drinking_fountain' || f === 'bubbler' || f === 'drinking') return 'fountain';
  if (m === 'water_tap' || tags.amenity === 'water_point') return 'tap';
  if (tags.bottle !== undefined || tags.refill === 'yes') return 'refill';
  return 'other';
}

function nameFromElement(el: { tags?: OverpassTags }): string {
  const t = el.tags;
  if (t?.name?.trim()) return t.name.trim();
  const cat = categoryFromTags(t);
  if (cat === 'fountain') return 'Drinking fountain';
  if (cat === 'tap') return 'Water tap';
  if (cat === 'refill') return 'Refill station';
  return 'Drinking water';
}

export async function getNearbyWaterPoints(
  lat: number,
  lng: number,
  limit: number = 20,
  radiusKm: number = 25
): Promise<WaterPoint[]> {
  const bbox = bboxAround(lat, lng, radiusKm);
  const query = `[out:json];node["amenity"="drinking_water"](${bbox});out body ${Math.min(limit * 2, 100)};`;
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    type OverpassElement = { id: number; lat: number; lon: number; tags?: OverpassTags };
    const data = (await res.json()) as { elements?: OverpassElement[] };
    const elements = data.elements ?? [];
    return elements.map((el) => ({
      id: String(el.id),
      lat: el.lat,
      lng: el.lon,
      name: nameFromElement(el),
      category: categoryFromTags(el.tags),
    }));
  } catch {
    return [];
  }
}
