/**
 * EPA Water Quality Portal (WQP) client.
 * Fetches monitoring stations and results by location for water quality scoring.
 * @see https://www.waterqualitydata.us/beta/webservices_documentation/
 */

const WQP_BASE = 'https://www.waterqualitydata.us/wqx3';
const DEFAULT_RADIUS_MILES = 15;
const REQUEST_TIMEOUT_MS = 15_000;

export type WqpStationSummary = {
  stationCount: number;
  rawRowCount: number;
};

export type WqpResultSummary = {
  resultCount: number;
  rawRowCount: number;
  /** Characteristic names seen (e.g. E. coli, Nitrate) */
  characteristicNames: string[];
  /** Approximate date range of results if parseable */
  latestYear?: number;
};

export type WqpLocationData = {
  stationSummary: WqpStationSummary;
  resultSummary: WqpResultSummary;
  /** True if any request failed (partial data) */
  partial: boolean;
};

function parseCsvRowCount(csv: string): number {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1) return 0;
  return lines.length - 1; // exclude header
}

function parseResultSummary(csv: string): Omit<WqpResultSummary, 'rawRowCount'> {
  const lines = csv.trim().split(/\r?\n/);
  const characteristicNames: string[] = [];
  let latestYear: number | undefined;

  if (lines.length > 0) {
    const header = lines[0].toLowerCase();
    const cols = header.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim().toLowerCase());
    const charNameIdx = cols.findIndex((c) => c.includes('characteristic') || c.includes('result_characteristic'));
    const actStartIdx = cols.findIndex((c) => c.includes('activitystartdate') || c.includes('activity_startdate') || c.includes('startdate'));

    for (let i = 1; i < Math.min(lines.length, 500); i++) {
      const row = lines[i];
      const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (charNameIdx >= 0 && parts[charNameIdx] !== undefined) {
        const name = parts[charNameIdx].replace(/^"|"$/g, '').trim();
        if (name && !characteristicNames.includes(name)) characteristicNames.push(name);
      }
      if (actStartIdx >= 0 && parts[actStartIdx] !== undefined) {
        const dateStr = parts[actStartIdx].replace(/^"|"$/g, '').trim();
        const year = parseInt(dateStr.slice(0, 4), 10);
        if (!isNaN(year) && (latestYear == null || year > latestYear)) latestYear = year;
      }
    }
  }

  return {
    resultCount: lines.length - 1,
    characteristicNames,
    latestYear,
  };
}

async function wqpFetch(path: string, params: Record<string, string>): Promise<string> {
  const url = `${WQP_BASE}${path}?${new URLSearchParams({ ...params, mimeType: 'csv' }).toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`WQP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch monitoring stations within radius (miles) of a point.
 */
export async function fetchWqpStations(
  lat: number,
  lng: number,
  withinMiles: number = DEFAULT_RADIUS_MILES
): Promise<WqpStationSummary> {
  const csv = await wqpFetch('/Station/search', {
    lat: String(lat),
    long: String(lng),
    within: String(withinMiles),
  });
  const rawRowCount = parseCsvRowCount(csv);
  return { stationCount: rawRowCount, rawRowCount };
}

/**
 * Fetch sample results within radius, optionally limited to recent years.
 */
export async function fetchWqpResults(
  lat: number,
  lng: number,
  withinMiles: number = DEFAULT_RADIUS_MILES,
  options?: { startDateLo?: string; startDateHi?: string }
): Promise<WqpResultSummary> {
  const params: Record<string, string> = {
    lat: String(lat),
    long: String(lng),
    within: String(withinMiles),
  };
  if (options?.startDateLo) params.startDateLo = options.startDateLo;
  if (options?.startDateHi) params.startDateHi = options.startDateHi;

  const csv = await wqpFetch('/Result/search', params);
  const rawRowCount = parseCsvRowCount(csv);
  const parsed = parseResultSummary(csv);
  return { ...parsed, rawRowCount };
}

/**
 * Get WQP data for a location (stations + results). Uses recent 2 years for results.
 */
export async function fetchWqpDataForLocation(
  lat: number,
  lng: number,
  withinMiles: number = DEFAULT_RADIUS_MILES
): Promise<WqpLocationData> {
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  const startDateLo = `${String(twoYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(twoYearsAgo.getDate()).padStart(2, '0')}-${twoYearsAgo.getFullYear()}`;
  const startDateHi = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`;

  let stationSummary: WqpStationSummary = { stationCount: 0, rawRowCount: 0 };
  let resultSummary: WqpResultSummary = {
    resultCount: 0,
    rawRowCount: 0,
    characteristicNames: [],
  };
  let partial = false;

  try {
    stationSummary = await fetchWqpStations(lat, lng, withinMiles);
  } catch {
    partial = true;
  }

  try {
    resultSummary = await fetchWqpResults(lat, lng, withinMiles, {
      startDateLo,
      startDateHi,
    });
  } catch {
    partial = true;
  }

  return {
    stationSummary,
    resultSummary,
    partial,
  };
}

