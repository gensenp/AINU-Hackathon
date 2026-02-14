import { Router, Request, Response } from 'express';
import { getNearbyWaterPoints } from '../services/waterPoints.js';

export const waterRouter = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/water/nearby?lat=40.7&lng=-74&limit=5 — real-time from OpenStreetMap (Overpass API)
waterRouter.get('/nearby', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const raw = await getNearbyWaterPoints(lat, lng, limit * 2, 25);
  const withDistance = raw.map((point) => ({
    ...point,
    distanceKm: Math.round(haversineKm(lat, lng, point.lat, point.lng) * 100) / 100,
  }));
  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  const points = withDistance.slice(0, limit);

  res.json({ points });
});
