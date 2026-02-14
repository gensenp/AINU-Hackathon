/**
 * Fetches disasters for risk scoring. Uses FEMA service directly so risk score
 * is based on real disaster declarations (with approximate state-level coordinates).
 */
import { getFemaDisasters } from './fema.js';

export type Disaster = {
  id: string;
  title?: string;
  state?: string;
  lat?: number;
  lng?: number;
  type?: string;
  riskScore?: number;
};

export async function getDisasters(): Promise<Disaster[]> {
  try {
    const items = await getFemaDisasters(100);
    return items.map((d) => ({
      id: d.id,
      title: d.title,
      state: d.state,
      lat: d.lat,
      lng: d.lng,
      type: d.type,
    }));
  } catch {
    return [];
  }
}
