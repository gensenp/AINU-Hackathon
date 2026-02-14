# AquaSafe — Recommended Stack & AI Integration

Stack chosen for **hackathon speed**, **free/demoable data**, and **clear AI use** that fits the InnovAlte prompt (resilience-first, systems thinking, AI-driven).

---

## Recommended Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | **React + TypeScript + Vite** | Fast dev, type safety, easy to demo. |
| **Maps** | **Leaflet + React-Leaflet + OpenStreetMap** | No API key for base tiles; add Mapbox later for prettier tiles if you have a key. |
| **Styling** | **Tailwind CSS** | Quick, consistent UI; good for map overlays and mobile-friendly layout. |
| **Backend** | **Node.js + Express + TypeScript** | Matches your TS/Express preference; simple to add EPA/FEMA proxies and AI routes. |
| **Database** | **SQLite (better-sqlite3)** or **Supabase** | SQLite = zero config, file-based, great for MVP + user reports. Supabase = auth + Postgres + realtime if you want login and live updates. |
| **Data sources** | **EPA (api.data.gov / SDWIS), OpenFEMA** | EPA for water quality/violations; FEMA for disaster declarations (no key). |
| **AI** | **Risk scoring (heuristic + optional LLM) + NLP for reports** | See “AI integration” below. |

**Alternative (single repo):** Use **Next.js** (App Router) so frontend + API routes + server-side data fetching live in one app. Same frontend stack (React, Leaflet, Tailwind); replace Express with `route handlers` and server components for data.

---

## Data Sources (all usable in a hackathon)

- **EPA**
  - [EPA APIs](https://www.epa.gov/data/application-programming-interface-api) — ATTAINS (water quality), ECHO (compliance), SDWIS (drinking water).
  - Sign up at [api.data.gov](https://api.data.gov/) for an API key (free).
- **FEMA**
  - [OpenFEMA API](https://www.fema.gov/about/openfema/api) — disaster declarations, no key.
  - Example: `GET https://www.fema.gov/api/open/v1/FemaWebDisasterDeclarations` (filter by state/date).
- **User reports** — Your own DB (SQLite or Supabase) for “water looks/smells off” + location; AI can classify urgency.

---

## AI Integration (how AI is part of the app)

Two concrete places where AI shows up:

### 1. **Risk scoring (core differentiator)**

- **Inputs:** Location (lat/lng) + optional: in flood zone? nearby industrial/ECHO facilities? active FEMA declaration? recent user reports?
- **Output:** Safety score (e.g. 0–100) + short explanation.
- **MVP options:**
  - **Heuristic model:** Rules in code (e.g. “in flood zone + disaster declaration ⇒ score −30”). Fast, explainable, no API cost.
  - **LLM assist:** Send same inputs to OpenAI/Anthropic and ask for a score + one-sentence explanation. Good for pitch and “AI-powered” narrative; hide key in env.
- **Demo:** “Enter address or click map → see score and why.”

### 2. **NLP for user reports**

- **Flow:** User submits: “Tap water smells like sulfur and is brown.”
- **AI:** Classify urgency (low / medium / high / critical) and optionally extract: smell, color, location type.
- **MVP:** One call to OpenAI/Anthropic (e.g. “Classify urgency and extract key details”) or a small Hugging Face model. Store result with the report and use it for map clustering and “recent high-urgency reports” list.

**Pitch line:** “AI doesn’t just show data — it scores risk and turns messy user reports into actionable alerts.”

---

## Suggested Project Layout

```
AquaSafe/
├── client/                 # React + Vite + Leaflet + Tailwind
│   ├── src/
│   │   ├── components/     # Map, ReportForm, RiskScoreCard, PinLegend
│   │   ├── hooks/         # useWaterSources, useRiskScore
│   │   ├── api/           # fetch wrappers for your backend
│   │   └── App.tsx
│   └── package.json
├── server/                 # Express + TypeScript
│   ├── src/
│   │   ├── routes/         # /api/water-sources, /api/risk-score, /api/reports
│   │   ├── services/      # epaService, femaService, riskScoreService, aiService
│   │   ├── db/             # SQLite schema + report CRUD
│   │   └── index.ts
│   └── package.json
├── .env.example            # API keys (EPA, OpenAI/Anthropic)
└── README.md
```

---

## MVP Feature Checklist

- [ ] **Map:** Leaflet map with pins (green / yellow / red) for water sources or zones.
- [ ] **Data:** One EPA or FEMA feed wired to backend and shown on map (e.g. violations or disaster declarations).
- [ ] **Risk score:** GET `/api/risk-score?lat=&lng=` returning score + explanation (heuristic or LLM).
- [ ] **Report form:** Submit description + location; backend stores and (optional) runs NLP; show on map or list.
- [ ] **“Nearest safe water”:** For demo, “list by distance” or “route to nearest green pin” (e.g. Leaflet routing or simple sort by distance).

---

## Stretch (pitch only or partial)

- IoT/sensor integration; predictive “next area to lose water” from storm paths; multilingual alerts; FEMA/Red Cross distribution integration.

---

## Quick Start (after scaffold)

1. `cp .env.example .env` and add EPA key + optional OpenAI/Anthropic key.
2. `cd server && npm i && npm run dev`
3. `cd client && npm i && npm run dev`
4. Implement one EPA or FEMA endpoint in `server`, then one map layer in `client`, then risk score, then report form + NLP.

This stack keeps the app **demoable**, **clearly AI-powered**, and **aligned with the hackathon prompt** (cascading risks, resilience, systems thinking).
