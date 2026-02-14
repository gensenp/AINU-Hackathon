type FemaRecord = {
  disasterNumber?: number;
  declarationTitle?: string;
  state?: string;
  declarationDate?: string;
  incidentType?: string;
  latitude?: number | string;
  longitude?: number | string;
};

const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  NY: { lat: 42.9, lng: -75.5 },
  NJ: { lat: 40.1, lng: -74.5 },
  CA: { lat: 37.2, lng: -119.7 },
  TX: { lat: 31.0, lng: -99.0 },
  FL: { lat: 27.8, lng: -81.7 }
};

export async function getFemaDisasters(limit = 50) {
  const api = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=${limit}&$orderby=declarationDate desc`;
  const res = await fetch(api);

  if (!res.ok) {
    throw new Error(`FEMA fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const rows: FemaRecord[] = json.DisasterDeclarationsSummaries ?? [];

  return rows
    .map((r, i) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      const fallback = r.state ? STATE_COORDS[r.state] : undefined;

      return {
        id: r.disasterNumber ?? i,
        title: r.declarationTitle ?? 'Disaster',
        state: r.state ?? 'NA',
        date: r.declarationDate ?? null,
        type: r.incidentType ?? 'Unknown',
        lat: Number.isFinite(lat) ? lat : fallback?.lat,
        lng: Number.isFinite(lng) ? lng : fallback?.lng
      };
    })
    .filter((d) => d.lat != null && d.lng != null);
}
