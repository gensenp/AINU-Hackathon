import { Router } from 'express';
import { getDisasters } from '../services/disasters.js';
import { computeRiskScore } from '../services/riskScoreService.js';

export const riskRouter = Router();

// GET /api/risk?lat=40.7&lng=-74.0
// Returns heuristic risk score (0–100) and explanation. Uses disaster data from GET /api/disasters when available.
riskRouter.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const disasters = await getDisasters();
  const { score, explanation } = computeRiskScore(lat, lng, disasters);

  res.json({ score, explanation, lat, lng });
});
