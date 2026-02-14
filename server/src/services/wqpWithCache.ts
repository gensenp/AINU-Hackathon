/**
 * WQP data fetcher with SQLite cache to avoid hammering EPA.
 */

import type { WqpLocationData } from './epaWqp.js';
import { fetchWqpDataForLocation } from './epaWqp.js';
import { getWqpCache, setWqpCache } from '../db.js';

const WITHIN_MILES = 15;

export async function getWqpDataWithCache(lat: number, lng: number): Promise<WqpLocationData> {
  const cached = getWqpCache(lat, lng, WITHIN_MILES);
  if (cached) {
    return {
      stationSummary: { stationCount: cached.station_count, rawRowCount: cached.station_count },
      resultSummary: {
        resultCount: cached.result_count,
        rawRowCount: cached.result_count,
        characteristicNames: [],
      },
      partial: false,
    };
  }
  const data = await fetchWqpDataForLocation(lat, lng, WITHIN_MILES);
  setWqpCache(
    lat,
    lng,
    WITHIN_MILES,
    data.stationSummary.stationCount,
    data.resultSummary.resultCount,
    data.resultSummary.characteristicNames?.length
      ? JSON.stringify(data.resultSummary.characteristicNames)
      : null
  );
  return data;
}
