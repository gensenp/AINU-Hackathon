// In-memory store so the server runs without native SQLite (no Visual Studio build tools needed).
// Replace with better-sqlite3 when you have C++ build tools installed.

export interface ReportRow {
  id: number;
  description: string;
  lat: number;
  lng: number;
  urgency: string;
  created_at: string;
}

const store: ReportRow[] = [];
let nextId = 1;

export function insertReport(
  description: string,
  lat: number,
  lng: number,
  urgency: string
): ReportRow {
  const created_at = new Date().toISOString();
  const row: ReportRow = {
    id: nextId++,
    description,
    lat,
    lng,
    urgency,
    created_at,
  };
  store.push(row);
  return row;
}

export function getRecentReports(limit: number = 50): ReportRow[] {
  return [...store]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
