import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export interface ReportRow {
  id: number;
  description: string;
  lat: number;
  lng: number;
  urgency: string;
  created_at: string;
}

// In-memory fallback when better-sqlite3 is not installed or fails (e.g. Windows without build tools)
const memoryStore: ReportRow[] = [];
let memoryId = 1;

function memoryInsertReport(
  description: string,
  lat: number,
  lng: number,
  urgency: string
): ReportRow {
  const row: ReportRow = {
    id: memoryId++,
    description,
    lat,
    lng,
    urgency,
    created_at: new Date().toISOString(),
  };
  memoryStore.unshift(row);
  return row;
}

function memoryGetRecentReports(limit: number): ReportRow[] {
  return memoryStore.slice(0, limit);
}

type DbImpl = 'sqlite' | 'memory';
let impl: DbImpl = 'memory';
let db: InstanceType<typeof import('better-sqlite3')> | null = null;

try {
  require.resolve('better-sqlite3');
  const Database = require('better-sqlite3');
  impl = 'sqlite';
} catch {
  console.warn('better-sqlite3 not available; reports will use in-memory store (data lost on restart). To persist: cd server && npm install better-sqlite3');
}

function getDb(): InstanceType<typeof import('better-sqlite3')> {
  if (impl !== 'sqlite' || !db) {
    throw new Error('SQLite not available');
  }
  return db;
}

if (impl === 'sqlite') {
  try {
    const Database = require('better-sqlite3');
    const dbPath = process.env.SQLITE_PATH ?? path.join(__dirname, '..', 'data', 'aquasafe.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        urgency TEXT NOT NULL DEFAULT 'medium',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } catch (err) {
    console.warn('Failed to open SQLite; using in-memory store:', (err as Error).message);
    impl = 'memory';
    db = null;
  }
}

export function insertReport(
  description: string,
  lat: number,
  lng: number,
  urgency: string
): ReportRow {
  if (impl === 'memory') {
    return memoryInsertReport(description, lat, lng, urgency);
  }
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO reports (description, lat, lng, urgency)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(description, lat, lng, urgency);
  const row = database.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid) as ReportRow;
  return row;
}

export function getRecentReports(limit: number = 50): ReportRow[] {
  if (impl === 'memory') {
    return memoryGetRecentReports(limit);
  }
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, description, lat, lng, urgency, created_at
    FROM reports
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as ReportRow[];
}
