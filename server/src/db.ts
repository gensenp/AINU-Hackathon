import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.SQLITE_PATH ?? path.join(__dirname, '..', 'data', 'aquasafe.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export interface ReportRow {
  id: number;
  description: string;
  lat: number;
  lng: number;
  urgency: string;
  created_at: string;
}

export function insertReport(
  description: string,
  lat: number,
  lng: number,
  urgency: string
): ReportRow {
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
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, description, lat, lng, urgency, created_at
    FROM reports
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as ReportRow[];
}
