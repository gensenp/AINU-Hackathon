import 'dotenv/config';
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

app.listen(PORT, () => {
  console.log(`AquaSafe API running at http://localhost:${PORT}`);
});
