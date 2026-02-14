import { Router } from 'express';

export const reportsRouter = Router();

// POST /api/reports — submit user report (description + lat/lng); optional NLP for urgency
reportsRouter.post('/', (req, res) => {
  const { description, lat, lng } = req.body ?? {};
  if (!description || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'description, lat, lng required' });
  }

  // TODO: persist to SQLite; optional: call AI to classify urgency
  res.status(201).json({
    id: 'placeholder',
    description,
    lat,
    lng,
    urgency: 'medium',
  });
});

// GET /api/reports — list recent reports (for map clustering / feed)
reportsRouter.get('/', (_req, res) => {
  // TODO: read from DB
  res.json({ reports: [] });
});
