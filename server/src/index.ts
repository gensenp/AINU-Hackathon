import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import { riskRouter } from './routes/risk.js';
import { reportsRouter } from './routes/reports.js';
import { femaRouter } from './routes/fema.js';
import { waterRouter } from './routes/water.js';
import { safeWaterRouter } from './routes/safeWater.js';

const app = express();
const PORT = process.env.PORT ?? 5001;

app.use(cors());
app.use(express.json());
app.use('/api/fema', femaRouter);
app.use('/api/risk', riskRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/water', waterRouter);
app.use('/api/safe-water', safeWaterRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'AquaSafe API' });
});

app.get('/api/ai-status', (_req, res) => {
  const key = process.env.OPENAI_API_KEY?.trim();
  res.json({
    configured: !!key,
    message: key
      ? `Key is set (${key.slice(0, 7)}...${key.slice(-4)})`
      : 'Set OPENAI_API_KEY in server/.env (no quotes, no space after =) and restart.',
  });
});

app.listen(PORT, () => {
  console.log(`AquaSafe API running at http://localhost:${PORT}`);
});
