import { Router } from 'express';
import { getDisasters } from '../services/disasters.js';
import { getAiExplanation } from '../services/aiExplanation.js';
import { computeRiskScore } from '../services/riskScoreService.js';
import { getWqpDataWithCache } from '../services/wqpWithCache.js';
import { fetchNearbyWaterSources } from '../services/waterSources.js';
import {
  buildFeatures,
  scoreFromFormula,
  scoreFromModel,
  explainScore,
  waterSourceScoreFromList,
} from '../services/waterQualityModel.js';
import {
  getWaterQualityWeights,
  setWaterQualityWeights,
  insertWaterQualityTraining,
  getWaterQualityTrainingSamples,
} from '../db.js';
import { fitLinearModel } from '../services/waterQualityModel.js';

export const riskRouter = Router();

// GET /api/risk?lat=40.7&lng=-74.0
// Water quality score from EPA WQP + FEMA disasters + OSM water sources; formula or ML model.
riskRouter.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const [disasters, wqpData, waterSources] = await Promise.all([
    getDisasters(),
    getWqpDataWithCache(lat, lng).catch(() => null),
    fetchNearbyWaterSources(lat, lng, 10).catch(() => []),
  ]);

  const waterSourceScore = waterSourceScoreFromList(waterSources, 10);
  const { features, details } = buildFeatures(lat, lng, disasters, wqpData, waterSourceScore);

  const weights = getWaterQualityWeights();
  const score = weights?.length === features.length
    ? scoreFromModel(weights, features)
    : scoreFromFormula(features, details);

  const explanation = explainScore(score, details, wqpData?.partial ?? false);
  let finalExplanation = explanation;
  const aiSentence = await getAiExplanation(score, explanation, lat, lng);
  if (aiSentence) finalExplanation = aiSentence;

  const { nearbyDisasters } = computeRiskScore(lat, lng, disasters);

  insertWaterQualityTraining(lat, lng, features, score);

  res.json({
    score,
    explanation: finalExplanation,
    nearbyDisasters,
    lat,
    lng,
    sources: { epa: !!wqpData, osm: waterSources.length },
  });
});

// POST /api/risk/train — Fit linear model from cached (lat, lng, features, score) and save weights.
riskRouter.post('/train', (_req, res) => {
  const samples = getWaterQualityTrainingSamples(2000);
  if (samples.length < 10) {
    return res.status(400).json({
      error: 'Need at least 10 training samples. Use GET /api/risk?lat=...&lng=... for various locations first.',
      count: samples.length,
    });
  }
  const weights = fitLinearModel(samples);
  if (weights.length === 0) {
    return res.status(500).json({ error: 'Model fit failed (singular matrix or too few samples).' });
  }
  setWaterQualityWeights(weights);
  res.json({ ok: true, samplesUsed: samples.length, featureCount: weights.length });
});
