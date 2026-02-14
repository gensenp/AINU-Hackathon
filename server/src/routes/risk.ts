import { Router } from 'express';
import { getDisasters } from '../services/disasters.js';
import { getAiExplanation } from '../services/aiExplanation.js';
import { computeRiskScore } from '../services/riskScoreService.js';

export const riskRouter = Router();

// GET /api/risk?lat=40.7&lng=-74.0
// Returns heuristic risk score (0–100) and explanation. Uses disaster data from GET /api/disasters when available.
// If OPENAI_API_KEY is set, the explanation is rewritten as one short AI sentence.
riskRouter.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const disasters = await getDisasters();
  const { score, explanation: heuristicExplanation } = computeRiskScore(lat, lng, disasters);

  // Optional: replace explanation with one short AI sentence (when OPENAI_API_KEY is set)
  let explanation = heuristicExplanation;
  const aiSentence = await getAiExplanation(score, heuristicExplanation, lat, lng);
  if (aiSentence) explanation = aiSentence;

  res.json({ score, explanation, lat, lng });
});
