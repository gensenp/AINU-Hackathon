# AquaSafe — AINU Hackathon

**Mission:** Show which reservoirs supply an area and whether disasters or hazardous infrastructure (oil, power, nuclear) put that supply at risk — so people know if their **water source** is susceptible, not just where the nearest tap is.

**Details:** In a disaster, “nearest water fountain” isn’t enough — taps can be offline or contaminated. AquaSafe answers: *Which reservoir supplies this area?* and *Is that source (or nearby power plants, refineries, nuclear sites) in a disaster zone?* So you see a water-safety risk score (0–100) for any point on the map, based on FEMA disaster declarations, proximity to hazardous facilities (nuclear, refineries, power plants), and whether your water source reservoir is in an affected zone.
**OpenFEMA API** (no key) for disaster declarations and state-level coordinates  
- **OpenStreetMap** (Overpass) for nearby water points (fountains, taps)  
- **React + Leaflet** for the interactive map; **Express + TypeScript** for the API  
- **Demo datasets** for reservoirs and facilities (EPA FRS / EIA / NRC–style data can be wired later)

**What extension type(s) did you build?**  
Full-stack **web application**: map UI (click for risk score, safe water list, user-reported safe water, disaster circles) and REST API (risk, FEMA, water nearby, safe-water reports). No browser extension; runs in the browser at localhost:5173 with API at localhost:5001.

**If given longer, what would be the next improvement you would make?**  
Wire **real** reservoir→area data (state water boards or USGS/EPA) so “your water source” is accurate; add **EPA FRS / EIA / NRC** for live facility locations instead of demo data; and add a **disaster-radius heat map** so the whole map shows risk by grid cell, not just the clicked point.

See **[MISSION.md](./MISSION.md)** for the full direction (reservoir → area, infrastructure-based risk) and how we're phasing it. The app currently uses disaster declarations for a water-safety risk score; we're extending toward reservoir sourcing and facilities (oil rigs, power plants, nuclear) as data is wired.

## Set Up Instructions

1. **Node.js 18+** — `node -v` to check. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) if needed.

2. **Environment (optional keys)**  
   ```bash
   cp .env.example .env
   ```  
   - **EPA_API_KEY** — Free at [api.data.gov](https://api.data.gov/signup/) (for future EPA water-quality integration).  
   - **OPENAI_API_KEY** — Optional; only for AI risk explanation.

3. **Install and run**  
   From the repo root:
   ```bash
   npm run install:all    # installs root, server, and client deps (first time)
   npm run dev            # starts server on 5001 and client on 5173
   ```  
   Or in two terminals: `cd server && npm install && npm run dev` and `cd client && npm install && npm run dev`.

4. **Verify**  
   - App: **http://localhost:5173** — click the map to see risk score, water source, and nearby facilities.  
   - API: **http://localhost:5001/api/health** — should return `{ "ok": true }`.

No third-party sign-up is required to run the core app (FEMA and OSM work without keys). EPA and OpenAI keys are only for optional features.

**Screenshot**  

---<img width="959" height="539" alt="AquaSafe" src="https://github.com/user-attachments/assets/ebe80d92-44b7-4a1f-bbce-9b8def977200" />


## Stack

- **Frontend:** React, TypeScript, Vite, Leaflet (map), Tailwind CSS
- **Backend:** Express, TypeScript
- **Data:** EPA (api.data.gov), OpenFEMA; user reports (SQLite)
- **AI:** Risk scoring (heuristic → optional LLM), NLP for report urgency

**Collaborators**  
Gensen Pawlicki
Nigel Purvis
Lucas Fujii
Miki Ashaye
