import { Router, Request, Response } from 'express';
import { fetchNearbyWaterSources } from '../services/waterSources.js';

export const waterRouter = Router();

type WaterPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: string;
  potableHint: 'yes' | 'no' | 'unknown';
};

// Demo fallback points (only used near NYC when live source fails)
const SAFE_WATER_POINTS: WaterPoint[] = [
  { id: '1', lat: 40.7589, lng: -73.9851, name: 'Midtown Fill Station', type: 'drinking_water', potableHint: 'yes' },
  { id: '2', lat: 40.7282, lng: -73.7942, name: 'Queens Water Hub', type: 'drinking_water', potableHint: 'yes' },
  { id: '3', lat: 40.6782, lng: -73.9442, name: 'Brooklyn Safe Water', type: 'drinking_water', potableHint: 'yes' },
  { id: '4', lat: 40.8266, lng: -73.9217, name: 'Bronx Community Source', type: 'drinking_water', potableHint: 'yes' },
  { id: '5', lat: 40.5795, lng: -74.1502, name: 'Staten Island Fill Point', type: 'drinking_water', potableHint: 'yes' },
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

function sourcePriority(type: string, potableHint: string): number {
  if (potableHint === 'yes') return 0;
  if (type === 'drinking_water') return 1;
  if (type === 'spring' || type === 'well') return 2;
  if (type === 'reservoir' || type === 'river') return 3;
  if (type === 'fountain') return 4;
  return 5;
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
  const isNearNYC = haversineKm(lat, lng, 40.7128, -74.006) < 120;

  const sourcePoints: WaterPoint[] =
    livePoints.length > 0 ? livePoints : isNearNYC ? SAFE_WATER_POINTS : [];

  const withDistance = sourcePoints.map((point) => ({
    ...point,
    distanceKm: Math.round(haversineKm(lat, lng, point.lat, point.lng) * 100) / 100,
  }));

  withDistance.sort((a, b) => {
    const pa = sourcePriority(a.type, a.potableHint);
    const pb = sourcePriority(b.type, b.potableHint);
    if (pa !== pb) return pa - pb;
    return a.distanceKm - b.distanceKm;
  });

  const points = withDistance.slice(0, limit);

  res.json({
    points,
    source: livePoints.length > 0 ? 'live' : isNearNYC ? 'fallback' : 'none',
  });
});
