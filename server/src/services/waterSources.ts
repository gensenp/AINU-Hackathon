export type WaterSource = {
  id: string;
  lat: number;
  lng: number;
  name: string;
};

export async function fetchNearbyWaterSources(lat: number, lng: number, limit = 20): Promise<WaterSource[]> {
  const query = `
    [out:json][timeout:25];
    (
      node(around:15000,${lat},${lng})["amenity"="drinking_water"];
      node(around:15000,${lat},${lng})["man_made"="water_well"];
    );
    out body;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!res.ok) return [];

  const json = await res.json();
  const elements = Array.isArray(json?.elements) ? json.elements : [];

  return elements.slice(0, limit).map((e: any) => ({
    id: String(e.id),
    lat: e.lat,
    lng: e.lon,
    name: e.tags?.name || 'Public Drinking Water'
  }));
}
