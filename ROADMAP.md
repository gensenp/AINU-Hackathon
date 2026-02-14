# AquaSafe — Where We Are & What’s Left

Quick view of what’s done and what’s left so the product feels finished for the hackathon.

---

## Where the risk score lives

| What | Where |
|------|--------|
| **API** | `GET /api/risk?lat=40.7&lng=-74` → `server/src/routes/risk.ts` |
| **Heuristic** | `server/src/services/riskScoreService.ts` — `computeRiskScore(lat, lng, disasters)` |
| **Disaster data** | `server/src/services/disasters.ts` — fetches from `GET /api/disasters` (Step 1) |
| **AI explanation** | `server/src/services/aiExplanation.ts` — optional; uses `OPENAI_API_KEY` to turn the heuristic into one short sentence |
| **Tests** | `server/src/services/riskScoreService.test.ts` — run with `cd server && npm run test` |

---

## How to test the risk score

**1. In the app (easiest)**  
- Start the app: from repo root run `npm run dev`.  
- Open http://localhost:5173.  
- Click anywhere on the map.  
- The sidebar shows the **score** and **explanation** for that point (from `GET /api/risk`).

**2. From the command line**  
```bash
curl "http://localhost:5000/api/risk?lat=40.7&lng=-74"
```  
You should get JSON like `{ "score": 100, "explanation": "No known disasters...", "lat": 40.7, "lng": -74 }`.

**3. Unit tests (showcase that it works)**  
```bash
cd server && npm run test
```  
This runs the heuristic tests: no disasters → 100, disaster nearby → 75, two nearby → 50, etc.

**4. AI explanation**  
- Add `OPENAI_API_KEY=sk-...` to your `.env`.  
- Restart the server and click the map again. The explanation should be one short AI-generated sentence instead of the default heuristic text.

---

## What’s done vs what’s left

| Area | Done | Left |
|------|------|------|
| **Map** | Map + click → risk score in sidebar; logo; slate header | Disaster pins on map (Step 1 frontend); maybe score color by range (green/yellow/red) |
| **Risk score** | Heuristic (distance to disasters); optional AI explanation; tests | — |
| **Data (Step 1)** | — | Backend: `GET /api/disasters` (FEMA or EPA). Frontend: show those as pins/layer on map |
| **Reports** | Likely: DB + POST/GET (check `server/src/routes/reports.ts`) | Frontend: “Report water issue” form; optional report pins on map |
| **Nearest safe water** | Backend: `GET /api/water/nearby` (demo points) | Frontend: “Find safe water near me” button + list or pins (Step 4) |
| **Polish** | Logo, header | Error/loading states; legend (green/yellow/red); mobile; one-slide pitch |

---

## Suggested order to “finish” the product

1. **Step 1 (Data)** — Implement or confirm `GET /api/disasters` and show disaster pins on the map so the risk score actually changes in the demo.
2. **Step 4 (Map/UX)** — Add “Find safe water near me” (or “from this point”) using `GET /api/water/nearby` and show the list + maybe pins.
3. **Step 3 (Reports)** — If not already done: report form in the UI; optionally show recent reports on the map.
4. **Polish** — Score color by range; short “How it works” or legend; test on a phone; prep one-slide / 1-min pitch.

Use **WALKTHROUGH.md** for the detailed task split between teammates. This file is the “where is the risk score, how do I test it, and what do we do next” summary.
