import { Router } from 'express';

export const riskRouter = Router();

// GET /api/risk?lat=40.7&lng=-74.0
// Returns AI/heuristic risk score for a location (MVP: heuristic; stretch: LLM)
riskRouter.get('/', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  // TODO: call riskScoreService(lat, lng) using EPA/FEMA + optional LLM
  const score = 72;
  const explanation = 'No active disaster declaration in this area. Consider checking local utility reports.';
  res.json({ score, explanation, lat, lng });
});
