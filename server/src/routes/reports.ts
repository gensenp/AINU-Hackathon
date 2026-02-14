import { Router } from 'express';
import { getRecentReports, insertReport } from '../db.js';
import { classifyUrgency } from '../services/urgencyService.js';

export const reportsRouter = Router();

const DEFAULT_URGENCY = 'medium';

// POST /api/reports — submit user report (description + lat/lng); optional AI for urgency
reportsRouter.post('/', async (req, res) => {
  const { description, lat, lng } = req.body ?? {};
  if (!description || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'description, lat, lng required' });
  }

  let urgency = DEFAULT_URGENCY;
  const classified = await classifyUrgency(String(description));
  if (classified) urgency = classified;

  try {
    const row = insertReport(String(description), lat, lng, urgency);
    res.status(201).json({
      id: row.id,
      description: row.description,
      lat: row.lat,
      lng: row.lng,
      urgency: row.urgency,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('Failed to save report:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// GET /api/reports — list recent reports (for map clustering / feed)
reportsRouter.get('/', (req, res) => {
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 100);
  try {
    const reports = getRecentReports(limit);
    res.json({ reports });
  } catch (err) {
    console.error('Failed to load reports:', err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});
