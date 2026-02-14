# AquaSafe — AINU Hackathon

AI-powered water safety: find safe drinking water and see contamination risk in real time (especially during and after disasters).
What if no one ever had to wonder if their water was safe again?

## Stack

- **Frontend:** React, TypeScript, Vite, Leaflet (map), Tailwind CSS
- **Backend:** Express, TypeScript
- **Data:** EPA (api.data.gov), OpenFEMA; user reports (SQLite)
- **AI:** Risk scoring (heuristic → optional LLM), NLP for report urgency

See **[STACK.md](./STACK.md)** for stack and data sources, and **[WALKTHROUGH.md](./WALKTHROUGH.md)** for what’s done and what to build next (with a suggested split for teammates).

---

## Working together (Cursor + VS Code)

**Real-time collab:** Yes — use **Live Share** so you can edit the same files and see each other’s cursors.

- **If everyone has Cursor:** Use Cursor’s built-in Live Share: **Cmd+Shift+L** (Mac) or **Ctrl+Shift+L** (Windows/Linux), or status bar → start session → share the link. Guests click the link to join (Cursor only).
- **If you’re on Cursor and others are on VS Code:** Cross-editor is flaky. **Best:** have someone on **VS Code host** the session (install the “Live Share” extension from Microsoft), share the link; you join from Cursor and it usually works. Cursor hosting and having VS Code users join often fails, so prefer VS Code as host when the team is mixed.
- **In VS Code:** Install the **Live Share** extension (Microsoft), sign in, then “Start collaboration session” and share the link.

**When not on Live Share:** Use **Git** as usual — branches, push/pull, merge. That’s how you save and combine work between sessions.

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
