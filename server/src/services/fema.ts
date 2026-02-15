/**
 * Fetches disaster declarations from OpenFEMA (no API key required).
 * Returns records with id, title, state, type, and approximate lat/lng from state centroid.
 */

const OPENFEMA_URL = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';

/** Approximate state centroids for mapping (no coords in API). */
const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.8, lng: -86.9 }, AK: { lat: 64.0, lng: -152.0 }, AZ: { lat: 34.2, lng: -111.7 },
  AR: { lat: 34.9, lng: -92.4 }, CA: { lat: 37.2, lng: -119.4 }, CO: { lat: 39.1, lng: -105.3 },
  CT: { lat: 41.6, lng: -72.7 }, DE: { lat: 38.9, lng: -75.5 }, FL: { lat: 28.6, lng: -82.5 },
  GA: { lat: 32.6, lng: -83.6 }, HI: { lat: 20.3, lng: -156.4 }, ID: { lat: 44.4, lng: -114.6 },
  IL: { lat: 40.0, lng: -89.2 }, IN: { lat: 40.3, lng: -86.1 }, IA: { lat: 42.0, lng: -93.6 },
  KS: { lat: 38.5, lng: -98.4 }, KY: { lat: 37.5, lng: -85.3 }, LA: { lat: 31.2, lng: -92.0 },
  ME: { lat: 45.4, lng: -69.2 }, MD: { lat: 39.0, lng: -76.6 }, MA: { lat: 42.4, lng: -71.4 },
  MI: { lat: 43.3, lng: -84.5 }, MN: { lat: 46.3, lng: -94.7 }, MS: { lat: 32.7, lng: -89.7 },
  MO: { lat: 37.9, lng: -91.8 }, MT: { lat: 47.0, lng: -110.4 }, NE: { lat: 41.1, lng: -98.0 },
  NV: { lat: 39.3, lng: -116.6 }, NH: { lat: 43.2, lng: -71.6 }, NJ: { lat: 40.2, lng: -74.6 },
  NM: { lat: 34.4, lng: -106.1 }, NY: { lat: 43.0, lng: -75.5 }, NC: { lat: 35.6, lng: -79.4 },
  ND: { lat: 47.5, lng: -100.5 }, OH: { lat: 40.4, lng: -82.8 }, OK: { lat: 35.6, lng: -97.5 },
  OR: { lat: 44.0, lng: -120.5 }, PA: { lat: 41.0, lng: -77.2 }, RI: { lat: 41.7, lng: -71.5 },
  SC: { lat: 33.9, lng: -80.9 }, SD: { lat: 44.4, lng: -100.2 }, TN: { lat: 35.9, lng: -86.6 },
  TX: { lat: 31.2, lng: -99.5 }, UT: { lat: 39.3, lng: -111.7 }, VT: { lat: 44.1, lng: -72.6 },
  VA: { lat: 37.5, lng: -78.5 }, WA: { lat: 47.4, lng: -120.5 }, WV: { lat: 38.6, lng: -80.6 },
  WI: { lat: 44.3, lng: -89.6 }, WY: { lat: 43.0, lng: -107.5 }, DC: { lat: 38.9, lng: -77.0 },
};

export type FemaDisaster = {
  id: string;
  disasterNumber: string;
  title: string;
  state: string;
  lat: number;
  lng: number;
  type: string;
  declarationDate?: string;
};

type FemaRow = {
  id: string;
  disasterNumber: string | number;
  state: string;
  declarationTitle: string;
  incidentType: string;
  declarationDate?: string;
};

export async function getFemaDisasters(limit: number = 50): Promise<FemaDisaster[]> {
  const top = Math.min(Math.max(1, limit), 1000);
  const url = `${OPENFEMA_URL}?$top=${top}&$orderby=declarationDate desc`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`FEMA API returned ${res.status}`);

  const data = (await res.json()) as {
    DisasterDeclarationsSummaries?: FemaRow[];
  };
  const rows = data.DisasterDeclarationsSummaries ?? [];

  return rows.map((row: FemaRow) => {
    const centroid = STATE_CENTROIDS[row.state] ?? { lat: 39.5, lng: -98.0 };
    return {
      id: row.id,
      disasterNumber: String(row.disasterNumber ?? row.id),
      title: row.declarationTitle ?? 'Disaster declaration',
      state: row.state,
      lat: centroid.lat,
      lng: centroid.lng,
      type: row.incidentType ?? 'Other',
      declarationDate: row.declarationDate,
    };
  });
}
