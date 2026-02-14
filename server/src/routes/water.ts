import { Router, Request, Response } from 'express';
import { fetchNearbyWaterSources } from '../services/waterSources.js';

export const waterRouter = Router();

// Demo fallback points (used only if live lookup returns nothing)
const SAFE_WATER_POINTS: { id: string; lat: number; lng: number; name: string }[] = [
  { id: '1', lat: 40.7589, lng: -73.9851, name: 'Midtown Fill Station' },
  { id: '2', lat: 40.7282, lng: -73.7942, name: 'Queens Water Hub' },
  { id: '3', lat: 40.6782, lng: -73.9442, name: 'Brooklyn Safe Water' },
  { id: '4', lat: 40.8266, lng: -73.9217, name: 'Bronx Community Source' },
  { id: '5', lat: 40.5795, lng: -74.1502, name: 'Staten Island Fill Point' },
  { id: '6', lat: 40.7484, lng: -73.9857, name: 'Empire State Area' },
  { id: '7', lat: 40.7614, lng: -73.9776, name: 'Central Park East' },
  { id: '8', lat: 40.6892, lng: -74.0445, name: 'Brooklyn Bridge Area' },
];

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

// GET /api/water/nearby?lat=40.7&lng=-74&limit=5
waterRouter.get('/nearby', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const livePoints = await fetchNearbyWaterSources(lat, lng, limit);
  console.log('water livePoints', { lat, lng, count: livePoints.length });

  const sourcePoints = livePoints.length > 0 ? livePoints : SAFE_WATER_POINTS;

  const withDistance = sourcePoints.map((point) => ({
    ...point,
    distanceKm: Math.round(haversineKm(lat, lng, point.lat, point.lng) * 100) / 100,
  }));

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  const points = withDistance.slice(0, limit);

  res.json({ points, source: livePoints.length > 0 ? 'live' : 'fallback' });
});
