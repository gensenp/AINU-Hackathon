export type WaterSourceType =
  | 'drinking_water'
  | 'fountain'
  | 'well'
  | 'spring'
  | 'reservoir'
  | 'river';

export type WaterSource = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: WaterSourceType;
  potableHint: 'yes' | 'no' | 'unknown';
};

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function getType(tags: Record<string, string>): WaterSourceType {
  if (tags.amenity === 'drinking_water') return 'drinking_water';
  if (tags.amenity === 'fountain') return 'fountain';
  if (tags.man_made === 'water_well') return 'well';
  if (tags.natural === 'spring') return 'spring';
  if (tags.natural === 'water' && tags.water === 'reservoir') return 'reservoir';
  return 'river';
}

function getPotableHint(tags: Record<string, string>): 'yes' | 'no' | 'unknown' {
  if (tags.drinking_water === 'yes') return 'yes';
  if (tags.drinking_water === 'no') return 'no';
  return 'unknown';
}

export async function fetchNearbyWaterSources(
  lat: number,
  lng: number,
  limit = 20
): Promise<WaterSource[]> {
  const query = `
    [out:json][timeout:25];
    (
      node(around:30000,${lat},${lng})["amenity"="drinking_water"];
      node(around:30000,${lat},${lng})["amenity"="fountain"];
      node(around:30000,${lat},${lng})["man_made"="water_well"];
      node(around:30000,${lat},${lng})["natural"="spring"];
      node(around:30000,${lat},${lng})["natural"="water"]["water"="reservoir"];
      way(around:30000,${lat},${lng})["waterway"="river"];
    );
    out center tags;
  `;

  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) continue;

      const json = await res.json();
      const elements = Array.isArray(json?.elements) ? json.elements : [];
      if (elements.length === 0) continue;

      const mapped = elements
        .map((e: any) => {
          const tags = (e.tags ?? {}) as Record<string, string>;
          const elLat = e.lat ?? e.center?.lat;
          const elLng = e.lon ?? e.center?.lon;

          return {
            id: String(e.id),
            lat: Number(elLat),
            lng: Number(elLng),
            name: tags.name || 'Water Source',
            type: getType(tags),
            potableHint: getPotableHint(tags),
          };
        })
        .filter((x: WaterSource) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

      return mapped.slice(0, limit);
    } catch {
      // try next endpoint
    }
  }

  return [];
}
