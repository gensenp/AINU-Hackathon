import { Router } from 'express';
import { insertSafeWaterReport, getSafeWaterReports } from '../db.js';

const R = 6371; // Earth radius km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const safeWaterRouter = Router();

// POST /api/safe-water — Share a safe water source (pooled user data)
safeWaterRouter.post('/', (req, res) => {
  const { lat, lng, name } = req.body ?? {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng are required (numbers)' });
  }
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Invalid lat or lng' });
  }
  try {
    const row = insertSafeWaterReport(lat, lng, typeof name === 'string' ? name : undefined);
    res.status(201).json({
      id: row.id,
      lat: row.lat,
      lng: row.lng,
      name: row.name,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('Failed to save safe water report:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// GET /api/safe-water — List user-reported safe water (optionally nearby)
// Query: lat, lng, radius_km (filter within radius), limit
safeWaterRouter.get('/', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radius_km);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 100), 500);
  try {
    let reports = getSafeWaterReports(limit);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !Number.isNaN(radiusKm) && radiusKm > 0) {
      reports = reports.filter((r) => distanceKm(lat, lng, r.lat, r.lng) <= radiusKm);
      reports = reports.map((r) => ({
        ...r,
        distanceKm: Math.round(distanceKm(lat, lng, r.lat, r.lng) * 100) / 100,
      }));
      reports.sort((a, b) => (a as { distanceKm: number }).distanceKm - (b as { distanceKm: number }).distanceKm);
    }
    res.json({ reports });
  } catch (err) {
    console.error('Failed to load safe water reports:', err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});
