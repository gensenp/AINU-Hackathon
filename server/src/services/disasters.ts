/**
 * Fetches disasters for risk scoring. Once Step 1 (Data) adds GET /api/disasters,
 * this will use that endpoint. Until then it returns [] so the heuristic still runs.
 */
export type Disaster = {
  id: string;
  title?: string;
  state?: string;
  lat?: number;
  lng?: number;
  type?: string;
  riskScore?: number;
};

const PORT = process.env.PORT ?? 5000;
const BASE = `http://127.0.0.1:${PORT}`;

export async function getDisasters(): Promise<Disaster[]> {
  try {
    const res = await fetch(`${BASE}/api/disasters`);
    if (!res.ok) return [];
    const data = await res.json();
    // Support both { disasters: [...] } and plain [...]
    return Array.isArray(data) ? data : data.disasters ?? [];
  } catch {
    return [];
  }
}
