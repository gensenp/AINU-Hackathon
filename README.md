# AquaSafe — AINU Hackathon

**Mission:** Show which reservoirs supply an area and whether disasters or hazardous infrastructure (oil, power, nuclear) put that supply at risk — so people know if their **water source** is susceptible, not just where the nearest tap is.

See **[MISSION.md](./MISSION.md)** for the full direction (reservoir → area, infrastructure-based risk) and how we're phasing it. The app currently uses disaster declarations for a water-safety risk score; we're extending toward reservoir sourcing and facilities (oil rigs, power plants, nuclear) as data is wired.

## Stack

- **Frontend:** React, TypeScript, Vite, Leaflet (map), Tailwind CSS
- **Backend:** Express, TypeScript
- **Data:** EPA (api.data.gov), OpenFEMA; user reports (SQLite)
- **AI:** Risk scoring (heuristic → optional LLM), NLP for report urgency

