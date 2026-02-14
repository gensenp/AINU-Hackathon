# AquaSafe — AINU Hackathon

AI-powered water safety: find safe drinking water and see contamination risk in real time (especially during and after disasters).

## Stack

- **Frontend:** React, TypeScript, Vite, Leaflet (map), Tailwind CSS
- **Backend:** Express, TypeScript
- **Data:** EPA (api.data.gov), OpenFEMA; user reports (SQLite)
- **AI:** Risk scoring (heuristic → optional LLM), NLP for report urgency

See **[STACK.md](./STACK.md)** for full stack notes and AI integration ideas.

---

## Teammate setup (after cloning)

1. **Node.js** — Use Node 18+ (check with `node -v`). [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) recommended.

2. **Environment** — Copy the example env and add keys (one person can share keys in your team chat; don’t commit `.env`):
   ```bash
   cp .env.example .env
   ```
   - **EPA_API_KEY** — Get a free key at [api.data.gov](https://api.data.gov/signup/).
   - **OPENAI_API_KEY** — Optional; only needed for AI risk explanation / report classification.

3. **Install and run** — From the repo root:
   ```bash
   # Terminal 1 — backend
   cd server && npm install && npm run dev

   # Terminal 2 — frontend
   cd client && npm install && npm run dev
   ```

4. **Verify** — Open http://localhost:5173 and click the map; you should see a risk score. API: http://localhost:5000/api/health.

---

## Quick start (reference)

```bash
cp .env.example .env   # add EPA_API_KEY, optional OPENAI_API_KEY
cd server && npm install && npm run dev
# In another terminal:
cd client && npm install && npm run dev
```

- **API:** http://localhost:5000  
- **App:** http://localhost:5173 — click the map to get a risk score (MVP stub).

## MVP checklist

- [ ] Wire one EPA or FEMA feed to the map (pins or zones)
- [ ] Real risk score from location (flood zone, disasters, reports)
- [ ] User report form + optional AI urgency classification
- [ ] “Nearest safe water” list or route
