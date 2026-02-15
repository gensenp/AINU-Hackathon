# AquaSafe — Mission & Risk Model

## The problem with “nearest water fountain”

Right now we show **point sources** (fountains, taps) and **disaster pins**. In a real disaster, those points might be gone, flooded, or offline. So the question isn’t just “where is a tap?” — it’s **“where does my water come from, and is that source (or the path to it) at risk?”**

## New direction: supply chain + infrastructure

We want AquaSafe to answer:

1. **Which reservoir (or source) supplies this area?**  
   If a disaster hits that reservoir or its watershed, everyone who gets water from it is susceptible — even if their tap is far from the disaster.

2. **What critical or hazardous infrastructure is nearby?**  
   Oil rigs, power plants, nuclear facilities, chemical sites, etc. If a disaster hits one of these, the risk to water and health is higher (spills, contamination, loss of treatment power). Areas near these facilities are more susceptible when disasters strike.

So risk should flow like this:

- **Reservoir risk:** Disaster near Reservoir A → areas that **source from** Reservoir A are at risk.
- **Infrastructure risk:** Disaster near a refinery / plant / nuke site → that area (and possibly downstream/downwind) is at higher risk.
- **Combined:** We can base our analysis on factors like: disasters, reservoir service areas, and proximity to oil, electricity, and nuclear facilities — then score areas accordingly.

## Target risk model (what we’re building toward)

| Factor | Why it matters |
|--------|----------------|
| **Reservoir / source for the area** | If the **source** is in a disaster zone or affected watershed, the whole served area is susceptible. |
| **Disasters (FEMA)** | Already in the app. Use them to flag: (a) reservoir/source areas, (b) infrastructure sites. |
| **Oil & gas (rigs, refineries, pipelines)** | Spills and fires can contaminate water; disasters near these = higher risk. |
| **Power plants** | Loss of power = no treatment, no pumping. Disasters that take out plants affect water supply. |
| **Nuclear facilities** | Same idea: disaster + nuclear = elevated risk; nearby areas more susceptible. |
| **Other (chemical, water intakes)** | EPA FRS, Superfund, etc. can add more layers later. |

So:

- **“Which reservoir serves this area?”** → If that reservoir (or its basin) is in a disaster zone, the area’s risk goes up.
- **“What facilities are near this area / near the reservoir?”** → If disasters hit those facilities, risk goes up (and we can weight by facility type).

That’s how we make it **actually applicable**: risk is about **source** and **hazardous infrastructure**, not just “is there a fountain nearby?”

## Why this is hard (and how to phase it)

- **Reservoir → area mapping** isn’t one API. It’s often utility boundaries, intake data, or state/EPA reports. We can start with one region or one state (e.g. “Reservoir X serves counties A, B, C”) as static or demo data, then plug in real data when we have it.
- **Facilities data** is more available: EPA FRS (Facility Registry Service), EIA (power plants), NRC (nuclear). We can add “facilities near this point” and “disaster near facility” as risk factors step by step.
- **Current app** stays useful: disasters + map + score. We **extend** the score to include “disaster near your source reservoir” and “disaster near hazardous facility” when we have the data, instead of replacing everything at once.

## Phased plan

1. **Keep current MVP**  
   Map, disaster pins, water-safety risk score (disaster-based), and “nearby water” list. No need to rip this out.

2. **Add “risk factors” in the backend**  
   - Define a **risk model** that can take: `disasters`, `reservoirForArea`, `facilitiesNearby` (oil, power, nuclear, etc.).  
   - For now, `reservoirForArea` can be “unknown” and `facilitiesNearby` can be `[]`; the score still runs on disasters only.  
   - This sets the shape of the API and the score so we can plug in real data later.

3. **Wire one “reservoir → area” source (demo or real)**  
   - Option A: Static map for one metro or state (“Reservoir A serves these counties”).  
   - Option B: Use a single utility’s public data or USGS/EPA dataset if we find one.  
   - UI: “Your area is supplied by [Reservoir X]. That source is [in / not in] a current disaster zone.”

4. **Add facilities layer**  
   - Use EPA FRS (or EIA, NRC) to get facilities (with type: oil, power, nuclear, etc.) and locations.  
   - “Disaster within X km of a refinery/nuclear plant” → increase risk or show a “high susceptibility” note.  
   - Show facilities on the map (optional) and in the risk explanation.

5. **Combine into one score + explanation**  
   - Score reflects: disaster near point, disaster near reservoir that serves the area, disaster near hazardous facility.  
   - Explanation in plain language: “Your area is supplied by Reservoir A; there is an active disaster in that watershed” or “A disaster is within 50 km of a nuclear facility that could affect this region.”

## One-line pitch (updated)

**AquaSafe shows which reservoirs supply your area and whether disasters or hazardous infrastructure (oil, power, nuclear) put that supply at risk — so you know if your water source is susceptible, not just where the nearest tap is.**

---

Use this doc as the north star. The current app is step 1; the next step is to define the extended risk model in code (and optionally add one demo reservoir or one facility type).

**Data sources (for when we wire them):** Reservoir/source → state water boards, USGS NWIS, EPA SDWIS (often no single API; start with one region). Oil/power/nuclear → EPA FRS, EIA (power plants), NRC (nuclear). Disasters → already using OpenFEMA.
