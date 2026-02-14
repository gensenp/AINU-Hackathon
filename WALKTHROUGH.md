# AquaSafe — What’s Done & What’s Next

Quick reference for you and your teammates: what’s built, what’s stubbed, and how to divide the work.

---

## 1. What’s already done

### Repo & setup
- **Stack chosen** — React + TS + Vite (client), Express + TS (server), Leaflet, Tailwind. See [STACK.md](./STACK.md).
- **`.gitignore`** — `.env`, `node_modules`, `dist`, etc. so you don’t commit secrets or build junk.
- **`.env.example`** — Template for `EPA_API_KEY`, `OPENAI_API_KEY`, `PORT`.
- **README** — Teammate setup steps (Node 18+, copy env, install, run).

### Backend (`server/`)
- **Express app** — CORS, JSON body, two route modules.
- **`GET /api/health`** — Returns `{ ok: true }`. Use this to verify the API is up.
- **`GET /api/risk?lat=&lng=`** — **Stub only.** Always returns `score: 72` and a fixed explanation. No EPA/FEMA or real logic yet.
- **`POST /api/reports`** — **Stub only.** Validates `description`, `lat`, `lng` and returns a placeholder; does not save to DB or call AI.
- **`GET /api/reports`** — **Stub only.** Returns `{ reports: [] }`. No database yet.

### Frontend (`client/`)
- **Vite + React + Leaflet + Tailwind** — Runs at http://localhost:5173, proxies `/api` to the backend.
- **Map** — OpenStreetMap via Leaflet; default center NYC; clickable.
- **Click → risk** — On map click, calls `/api/risk?lat=&lng=` and shows score + explanation in the sidebar (so the full “click map → see score” flow works with the stub).

### What’s *not* done yet
- No real data (EPA / FEMA) wired in.
- No real risk logic (heuristic or AI).
- No database (reports are not stored).
- No report form in the UI.
- No pins or layers on the map (only “click for risk”).
- No “nearest safe water” feature.

---

## 2. Next steps (in order)

### Step 1 — Wire one data source to the map (high impact, demoable)
**Goal:** Show *something* real on the map so it’s not just “click for a fake score.”

- **Option A — FEMA (easiest, no API key)**  
  - Backend: New route or service that fetches from [OpenFEMA Disaster Declarations](https://www.fema.gov/about/openfema/api) (e.g. active or recent disasters, filter by state/date).  
  - Return a list of `{ id, title, state, lat, lng, type, ... }` (use FEMA’s geodata or approximate by state if no coords).  
  - Frontend: Add a layer of markers (e.g. red pins) for each declaration; clicking can show title/date/type.
- **Option B — EPA**  
  - Backend: Use [api.data.gov](https://api.data.gov/) with your `EPA_API_KEY` to hit an EPA water/echo endpoint; return water systems or violations with lat/lng (or state/county and approximate).  
  - Frontend: Same idea — markers or a simple layer for “water quality” or “violations.”

**Who:** One person comfortable with HTTP + JSON can do the backend; another can do the React-Leaflet layer. Or one person does both.

---

### Step 2 — Real risk score (heuristic first)
**Goal:** Replace the fixed “72” with a score that depends on the location.

- **Backend:** In `server/src/routes/risk.ts` (or a new `riskScoreService`):
  - For the clicked `lat, lng`, determine:  
    - Is there an active/recent FEMA declaration nearby (from Step 1)?  
    - Optional: any EPA violations or industrial sites nearby (if you added EPA)?  
  - Compute a score (e.g. 100 minus penalties: −20 for disaster, −15 for violation, etc.) and a short explanation string (“Active disaster in this state”, “No issues found”, etc.).
- **Optional — LLM:** If you have `OPENAI_API_KEY`, add a second path: same inputs → call OpenAI/Anthropic to get one sentence explanation and maybe a score; use it for “AI-powered” in the pitch.

**Who:** Same person who did FEMA/EPA can extend it into risk logic; or a teammate who likes backend/scripts.

---

### Step 3 — Save reports (SQLite + optional AI)
**Goal:** User-submitted reports are stored and (optionally) classified by AI.

- **Backend:**  
  - Add SQLite (e.g. `better-sqlite3` — already in `package.json`).  
  - Create a table: `reports (id, description, lat, lng, urgency, created_at)`.  
  - In `POST /api/reports`: insert row; optionally call OpenAI to set `urgency` (e.g. “low” / “medium” / “high” / “critical”) from `description`.  
  - In `GET /api/reports`: query recent reports (e.g. last 50) and return JSON.
- **Frontend:**  
  - Add a “Report water issue” form (description + use current map center or a pin for lat/lng).  
  - On submit, `POST /api/reports`.  
  - Optionally: a small list or layer of “Recent reports” from `GET /api/reports`.

**Who:** One person on backend (DB + routes), one on frontend (form + maybe report pins/list).

---

### Step 4 — “Nearest safe water” (demoable)
**Goal:** From current location (or a chosen point), list or show the nearest “safe” points.

- **Backend:**  
  - Either reuse “safe” = no disaster + no violations from your risk logic, or define a simple list of “safe” locations (e.g. from EPA “good” systems or hardcoded demo points).  
  - New endpoint, e.g. `GET /api/water/nearby?lat=&lng=&limit=5` that returns sorted by distance.
- **Frontend:**  
  - “Find safe water near me” button or use map click as “from here.”  
  - Call the new endpoint and show results in the sidebar or as a list; optionally draw a line to the nearest or show pins.

**Who:** Can be done by whoever did risk + map (backend + frontend).

---

## 3. How to split the work (4 people)

Each person has a clear lane. Sync early so **Data** and **Risk** can share types/routes; **Reports** and **Map** need to agree on the report pin shape.

| Person | Role | Their tasks |
|--------|------|----------------|
| **1 — Data** | Backend: external APIs | Step 1 backend. New route (e.g. `GET /api/disasters` or `/api/water-sources`) that fetches **FEMA** (no key) or **EPA** (with key) and returns JSON with id, lat/lng, title, type, etc. Add a small `server/src/services/femaService.ts` (or epaService) and call it from the route. |
| **2 — Risk** | Backend: risk logic + AI | Step 2. Use Data’s endpoint (or shared service) inside `server/src/routes/risk.ts`. Implement heuristic score (disaster nearby ⇒ lower score) + explanation string. Optional: add OpenAI call for “AI explanation” and wire `OPENAI_API_KEY`. |
| **3 — Reports** | Backend DB + Frontend form | Step 3. Backend: SQLite schema, `POST /api/reports` (save to DB), `GET /api/reports` (return recent). Optional: call OpenAI to set urgency from description. Frontend: “Report water issue” form (description + location from map), submit to API, show success/error. Optionally show report pins on map (coordinate with Map person on marker style). |
| **4 — Map & UX** | Frontend: map layers + polish | Step 1 frontend + Step 4. Map: new layer of markers from Data’s endpoint (e.g. red pins for disasters); popup or sidebar detail on click. Step 4: “Find safe water near me” (or “from this point”) — call new `/api/water/nearby` (Risk or Data can add this route) and show list + pins. Polish: legend (green/yellow/red), loading/error states, mobile-friendly layout. |

**Handoffs:**
- **Data → Risk:** Risk person consumes the disasters/water-sources data (same service or HTTP) to compute score.
- **Data → Map:** Map person calls `GET /api/disasters` (or whatever Data names it) and renders markers.
- **Reports → Map:** If you show report pins, Reports person provides the data; Map person adds a second layer or reuses the same marker component.
- **Risk (or Data) → Map:** Someone adds `GET /api/water/nearby`; Map person calls it for “nearest safe water.”

**Suggested order:** Data and Risk can start in parallel (Risk uses stub data at first). Reports and Map can start in parallel once the API shape for disasters is agreed (e.g. `{ id, lat, lng, title, type }`).

---

## 4. Quick reference

- **Run backend:** `cd server && npm run dev` → http://localhost:5000  
- **Run frontend:** `cd client && npm run dev` → http://localhost:5173  
- **Env:** `cp .env.example .env`; add `EPA_API_KEY` (and optionally `OPENAI_API_KEY`).  
- **Docs:** [STACK.md](./STACK.md) for stack and data sources; [README.md](./README.md) for setup and MVP checklist.

Once Step 1 and 2 are done, you have a demo: “Click the map → see real risk; here are disaster declarations.” Steps 3 and 4 make it feel like a product and give you a clear story for the judges.
