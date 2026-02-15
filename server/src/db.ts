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
      CREATE TABLE IF NOT EXISTS wqp_cache (
        lat_key REAL NOT NULL,
        lng_key REAL NOT NULL,
        within_miles INTEGER NOT NULL,
        station_count INTEGER NOT NULL,
        result_count INTEGER NOT NULL,
        result_summary_json TEXT,
        fetched_at TEXT NOT NULL,
        PRIMARY KEY (lat_key, lng_key, within_miles)
      );
      CREATE TABLE IF NOT EXISTS water_quality_weights (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        weights_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS water_quality_training (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        features_json TEXT NOT NULL,
        score REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS safe_water_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        name TEXT NOT NULL DEFAULT 'Safe water (user-reported)',
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

// --- WQP cache (SQLite only) ---
const WQP_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type WqpCacheRow = {
  station_count: number;
  result_count: number;
  result_summary_json: string | null;
  fetched_at: string;
};

export function getWqpCache(lat: number, lng: number, withinMiles: number): WqpCacheRow | null {
  if (impl !== 'sqlite') return null;
  const latKey = Math.round(lat * 100) / 100;
  const lngKey = Math.round(lng * 100) / 100;
  const row = getDb().prepare(`
    SELECT station_count, result_count, result_summary_json, fetched_at
    FROM wqp_cache WHERE lat_key = ? AND lng_key = ? AND within_miles = ?
  `).get(latKey, lngKey, withinMiles) as (WqpCacheRow & { fetched_at: string }) | undefined;
  if (!row) return null;
  const age = Date.now() - new Date(row.fetched_at).getTime();
  if (age > WQP_CACHE_TTL_MS) return null;
  return row;
}

export function setWqpCache(
  lat: number,
  lng: number,
  withinMiles: number,
  stationCount: number,
  resultCount: number,
  resultSummaryJson: string | null
): void {
  if (impl !== 'sqlite') return;
  const latKey = Math.round(lat * 100) / 100;
  const lngKey = Math.round(lng * 100) / 100;
  getDb().prepare(`
    INSERT OR REPLACE INTO wqp_cache (lat_key, lng_key, within_miles, station_count, result_count, result_summary_json, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(latKey, lngKey, withinMiles, stationCount, resultCount, resultSummaryJson);
}

// --- ML model weights (SQLite only) ---
export function getWaterQualityWeights(): number[] | null {
  if (impl !== 'sqlite') return null;
  const row = getDb().prepare('SELECT weights_json FROM water_quality_weights WHERE id = 1').get() as { weights_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.weights_json) as number[];
  } catch {
    return null;
  }
}

export function setWaterQualityWeights(weights: number[]): void {
  if (impl !== 'sqlite') return;
  getDb().prepare(`
    INSERT OR REPLACE INTO water_quality_weights (id, weights_json, created_at) VALUES (1, ?, datetime('now'))
  `).run(JSON.stringify(weights));
}

export function insertWaterQualityTraining(lat: number, lng: number, features: number[], score: number): void {
  if (impl !== 'sqlite') return;
  getDb().prepare(`
    INSERT INTO water_quality_training (lat, lng, features_json, score, created_at) VALUES (?, ?, ?, ?, datetime('now'))
  `).run(lat, lng, JSON.stringify(features), score);
}

export function getWaterQualityTrainingSamples(limit: number = 1000): { features: number[]; score: number }[] {
  if (impl !== 'sqlite') return [];
  const rows = getDb().prepare(`
    SELECT features_json, score FROM water_quality_training ORDER BY id DESC LIMIT ?
  `).all(limit) as { features_json: string; score: number }[];
  return rows.map((r) => {
    try {
      return { features: JSON.parse(r.features_json) as number[], score: r.score };
    } catch {
      return { features: [], score: r.score };
    }
  }).filter((s) => s.features.length > 0);
}

// --- User-reported safe water sources (pooled community data) ---
export interface SafeWaterReportRow {
  id: number;
  lat: number;
  lng: number;
  name: string;
  created_at: string;
}

const safeWaterMemoryStore: SafeWaterReportRow[] = [];
let safeWaterMemoryId = 1;

export function insertSafeWaterReport(lat: number, lng: number, name: string = 'Safe water (user-reported)'): SafeWaterReportRow {
  if (impl === 'memory') {
    const row: SafeWaterReportRow = {
      id: safeWaterMemoryId++,
      lat,
      lng,
      name: name.trim() || 'Safe water (user-reported)',
      created_at: new Date().toISOString(),
    };
    safeWaterMemoryStore.unshift(row);
    return row;
  }
  const database = getDb();
  const n = (name ?? '').trim() || 'Safe water (user-reported)';
  const stmt = database.prepare(`
    INSERT INTO safe_water_reports (lat, lng, name) VALUES (?, ?, ?)
  `);
  const info = stmt.run(lat, lng, n);
  return database.prepare('SELECT id, lat, lng, name, created_at FROM safe_water_reports WHERE id = ?').get(info.lastInsertRowid) as SafeWaterReportRow;
}

export function getSafeWaterReports(limit: number = 500): SafeWaterReportRow[] {
  if (impl === 'memory') {
    return safeWaterMemoryStore.slice(0, limit);
  }
  const database = getDb();
  const rows = database.prepare(`
    SELECT id, lat, lng, name, created_at FROM safe_water_reports ORDER BY created_at DESC LIMIT ?
  `).all(limit) as SafeWaterReportRow[];
  return rows;
}
