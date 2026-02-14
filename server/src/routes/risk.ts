import { Router } from 'express';
import { getDisasters } from '../services/disasters.js';
import { getAiExplanation } from '../services/aiExplanation.js';
import { computeRiskScore } from '../services/riskScoreService.js';
import { fetchNearbyWaterSources } from '../services/waterSources.js';

export const riskRouter = Router();

// GET /api/risk?lat=40.7&lng=-74.0
riskRouter.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const disasters = await getDisasters();

  let nearbyWater = [];
  try {
    nearbyWater = await fetchNearbyWaterSources(lat, lng, 8);
  } catch {
    nearbyWater = [];
  }

  const { score, explanation: heuristicExplanation } = computeRiskScore(
    lat,
    lng,
    disasters,
    nearbyWater
  );

  let explanation = heuristicExplanation;
  const aiSentence = await getAiExplanation(score, heuristicExplanation, lat, lng);
  if (aiSentence) explanation = aiSentence;

  res.json({ score, explanation, lat, lng });
});
