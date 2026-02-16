import { Router } from 'express';
import { getDisasters } from '../services/disasters.js';
import { getAiExplanation } from '../services/aiExplanation.js';
import { computeRiskScore } from '../services/riskScoreService.js';
import { getReservoirForPoint } from '../services/reservoirs.js';
import { getFacilitiesNearPoint } from '../services/facilities.js';

export const riskRouter = Router();

// GET /api/risk?lat=40.7&lng=-74.0
// Water-safety score from FEMA disasters + reservoir + hazardous facilities (MISSION.md).
riskRouter.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const [disasters, reservoir, facilitiesNearby] = await Promise.all([
    getDisasters(),
    Promise.resolve(getReservoirForPoint(lat, lng)),
    Promise.resolve(getFacilitiesNearPoint(lat, lng, 120)),
  ]);

  const result = computeRiskScore(lat, lng, disasters, {
    reservoir: reservoir ?? null,
    facilitiesNearby,
  });

  const explanationFromAi = await getAiExplanation(result.score, result.explanation, lat, lng);

  res.json({
    score: result.score,
    explanation: result.explanation,
    explanationFromAi: explanationFromAi ?? null,
    nearbyDisasters: result.nearbyDisasters,
    reservoir: result.reservoir,
    sourceReservoirInDisasterZone: result.sourceReservoirInDisasterZone,
    facilitiesAtRisk: result.facilitiesAtRisk,
    lat,
    lng,
  });
});
