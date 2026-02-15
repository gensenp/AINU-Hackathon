# Water Hazard Data Sources for Disaster-Radius Heat Map / Predictive Score

Use these sources to build a **predictive water quality score** (heat map) based on **proximity to hazards** within a disaster impact radius (e.g. hurricane, flood). The score (0–100) drops as the number and proximity of hazards in that radius increase.

---

## Summary: How It Fits the Score

- **Disaster epicenter/affected zone** → define a radius (e.g. 50–200 km) or use FEMA declarations.
- **For each (lat, lng)** in or near that zone: count/weight **nearby hazard facilities** from the tables below.
- **Score** = 100 − (disaster penalty) − (penalties from each hazard type within radius). Lower score = worse predicted water quality.

---

## 1. Nuclear

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **NRC – U.S. Nuclear Power Reactor Plant Status** | Commercial reactor locations, licensee, type | [Data.gov](https://catalog.data.gov/dataset/u-s-nuclear-power-reactor-plant-status) (text/CSV); [NRC datasets](https://www.nrc.gov/reading-rm/doc-collections/datasets/index) | Location in dataset; may need geocoding |
| **NRC – Map of Power Reactor Sites** | Map of operating reactors | [Map](https://nrc.gov/reactors/operating/map-power-reactors) | Reference for coordinates |
| **NRC ADAMS API** | Regulatory documents/data | [adams-api-developer.nrc.gov](https://adams-api-developer.nrc.gov/) | Check API for facility coords |

**Use:** Points for each reactor; distance from (lat, lng) → penalty (e.g. within 20 km = large penalty).

---

## 2. Industrial / Chemical

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **EPA ECHO – Facility Search** | 1.5M+ facilities (CAA, CWA, refineries, chemical, etc.) | [ECHO Web Services](https://echo.epa.gov/tools/web-services) – get_facilities, get_map, get_download | Yes; [Facility Search All Data](https://echo.epa.gov/tools/web-services/facility-search-all-data) |
| **EPA ECHO Exporter** | Bulk CSV with 130+ fields, coordinates | [Data Downloads](https://echo.epa.gov/tools/data-downloads) | Latitude/longitude |
| **EPA TRI (Toxic Release Inventory)** | Chemical mfg, releases | [TRI MapServer](https://gispub.epa.gov/arcgis/rest/services/OEI/TRI_Facilities/MapServer); [FRS API](https://www.epa.gov/frs/frs-api) radius up to 25 mi | Yes |
| **EPA FRS – Geospatial** | All FRS facilities (refineries, oil, chemical, etc.) | [Geospatial Data Download](https://www.epa.gov/frs/geospatial-data-download-service): National KML, [national_frs.kmz](https://ordsext.epa.gov/FLA/www3/national_frs.kmz), CSV by state, File Geodatabase | Yes |
| **EPA Envirofacts** | TRI, FRS, RCRA by table | `https://data.epa.gov/efservice/{program}.{table}` e.g. `tri.tri_facility`, `frs.frs_facility` | Filter by state/county; join to FRS for coords |

**Use:** Count facilities (or facility density) within disaster radius; weight by type (e.g. refinery > generic chemical). Closer = higher penalty.

---

## 3. Waste

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **EPA FRS – RCRA** | Hazardous waste handlers, TSDs, LQGs | [FRS RCRA dataset](https://catalog.data.gov/dataset/epa-facility-registry-service-frs-rcra8); FRS Geospatial (KMZ/CSV/GDB) | Yes |
| **EPA Superfund (NPL)** | Superfund / toxic cleanup sites | [FRS Geospatial – SEMS NPL](https://www.epa.gov/frs/geospatial-data-download-service) (Featured Interests KMZ); [Envirofacts](https://www.epa.gov/enviro/envirofacts-data-service-api); [FRS API](https://www.epa.gov/frs/frs-api) (lat/lng radius ≤25 mi) | Yes |
| **EPA LMOP** | 2,600+ MSW landfills | [LMOP Database](https://www.epa.gov/lmop/lmop-landfill-and-project-database); FRS/LMOP National Map | Yes |
| **EPA FRS – Wastewater (NPDES)** | Wastewater treatment plants, combined sewer outfalls | [FRS_Wastewater MapServer](https://geodata.epa.gov/arcgis/rest/services/OEI/FRS_Wastewater/MapServer); [FRS ER_WWTP_NPDES](https://catalog.data.gov/dataset/epa-facility-registry-service-frs-er_wwtp_npdes8) | Yes |

**Use:** Count Superfund sites, landfills, WWTPs within radius. WWTPs + combined sewers = high weight (overflow during floods). Superfund = very high weight.

---

## 4. Agricultural

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **EPA CAFO Density** | CAFOs per county (livestock) | [CAFO_Density MapServer](https://gispub.epa.gov/arcgis/rest/services/OECA/CAFO_Density/MapServer); [Data.gov CAFO](https://catalog.data.gov/dataset?_metadata_type_limit=0&metadata_type=geospatial&q=%22Concentrated+Animal+Feeding+Operations+CAFO%22) | County-level; use county centroid or area |
| **USDA Census of Agriculture** | Livestock/poultry by county | Used by EPA EnviroAtlas; county-level | County |
| **EPA EnviroAtlas** | Livestock/poultry layers by county | [EPA Assessments](https://assessments.epa.gov/risk/document/&deid%3D359868) | County |

**Use:** For a (lat, lng), get county → CAFO count or animal density. Higher density = penalty (runoff, manure lagoons). Optional: buffer around county or use county centroid distance.

---

## 5. Infrastructure

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **EPA SDWIS / Lead & Copper** | Drinking water systems, violations | [SDWIS Federal](https://sdwis.epa.gov/ords/sfdw_pub/f?p=SDWIS_FED_REPORTS_PUBLIC); [Lead Service Line](https://www.epa.gov/ground-water-and-drinking-water/lead-service-lines) | System-level; geocode by city/county |
| **EPA Water ICAT** | Service line inventory (lead pipes) | [Water ICAT](https://epa.gov/waterfinancecenter/water-infrastructure-and-capacity-assessment-tool) | As available in tool |
| **USACE National Inventory of Dams (NID)** | Dams (aging, hazard potential) | [NID API](https://nid.sec.usace.army.mil/api/developer/static/index.html); [NID MapServer](https://geospatial.sec.usace.army.mil/dls/rest/services/NID/National_Inventory_of_Dams_Public_Service/MapServer); [Open Data](https://geospatial-usace.opendata.arcgis.com/maps/1632cb2bb23046569fbf2bc144f06764) | Yes |
| **Underground storage tanks (UST)** | Often under state/EPA programs | ECHO/FRS; state UST databases | FRS has many; check ECHO facility type |

**Use:** Lead/copper and sewer type = per–water-system (geocode to lat/lng). Dams within radius = penalty (failure/overflow in disaster).

---

## 6. Oil Spills (Historical + Risk)

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **NOAA Incident News – Raw** | Oil spill incidents (NOAA-supported) | [incidents.csv](https://incidentnews.noaa.gov/raw/incidents.csv) | Coordinates in CSV |
| **NOAA Incident News** | Search/browse | [incidentnews.noaa.gov](https://incidentnews.noaa.gov/) | Yes |
| **Gas stations / UST** | Leaking tanks when flooded | ECHO/FRS (facility type); state UST lists | FRS/ECHO |

**Use:** Historical spills: distance from (lat, lng) → penalty (or “within 10 km of a spill”). Combine with ECHO refineries/storage for “spill risk” density.

---

## 7. Medical / Bio

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **Hospitals** | Medical waste, pharmaceuticals | HHS/HRSA (e.g. hospital location APIs); OpenStreetMap (amenity=hospital) | Yes |
| **EPA RCRA / hazardous waste** | Medical waste handlers | FRS RCRA; ECHO | Yes |
| **Cemeteries** | Flood + remains contamination | OSM (landuse=cemetery); local/county data | OSM has points/polygons |

**Use:** Count hospitals, labs, cemeteries within radius; apply moderate penalty (medical/bio risk in floods).

---

## 8. Military / PFAS

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **EWG – Military PFAS** | 720+ military sites, PFAS known/suspected | [EWG Map](https://www.ewg.org/interactive-maps/2020-military-pfas-sites/map/) (search by zip) | Map; may need scraping or EWG data request |
| **DoD PFAS Map** | Official DoD drinking water testing | [DoD PFAS Map](https://www.acq.osd.mil/eie/eer/ecc/pfas/map/pfasmap.html) | Yes |
| **PFAS Project Lab** | 2.2k known + 79.8k presumptive PFAS sites | [PFAS Project Lab](https://pfasproject.com/) | Check for bulk/API |

**Use:** Distance to nearest military/PFAS site → penalty (or count within radius). Strong weight for “forever chemicals” in water.

---

## 9. Other (Airports, Auto, Dry Cleaners)

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **ECHO / FRS** | SIC/NAICS for auto, dry cleaners, airports | ECHO Facility Search; FRS CSV (NAICS/SIC in combined files) | Yes |
| **TRI** | Chemical releases (often industrial, some solvents) | TRI MapServer / FRS API | Yes |
| **Airports** | Jet fuel risk | OSM (aeroway=aerodrome); FAA; ECHO if permitted | Yes |

**Use:** Filter ECHO/FRS by NAICS (e.g. dry cleaning, auto repair, airport-related). Count within disaster radius; small–moderate penalty per type.

---

## 10. Disasters (Define the Radius)

| Source | What | Access | Lat/lng |
|--------|------|--------|---------|
| **FEMA OpenFEMA** | Disaster declarations (e.g. Katrina) | [OpenFEMA API](https://www.fema.gov/about/openfema/api) (e.g. DisasterDeclarationsSummaries) | State/county; some with coordinates |
| **FEMA NDRS** | National Risk Index, flood, etc. | FEMA APIs / shapefiles | Geographic |
| **NOAA Storm Events** | Historic storms, paths, damage | NOAA Storm Events Database | Coordinates for events |
| **Known “Katrina-style” zones** | Custom polygons for major events | Curated lat/lng or GeoJSON (e.g. Louisiana/New Orleans impact zone) | You define |

**Use:**  
- **Option A:** Use FEMA declaration + state/county to define “affected area” and buffer (e.g. 50–200 km) around state/region.  
- **Option B:** For a specific disaster (e.g. Katrina), define one or more polygons (or radii) as “disaster zone.”  
- **Score:** Only apply hazard-based penalties **inside** that disaster radius (or weight by distance from epicenter).

---

## Implementation Sketch: Disaster-Radius Heat Map Score

1. **Input:** Disaster event (e.g. “Hurricane X” or FEMA declaration) → get impact zone (polygon or radius).
2. **For each point (lat, lng)** in the zone (or for a grid):
   - Fetch or preload hazard counts/distances from:
     - FRS/ECHO (chemical, refineries, WWTP, RCRA, Superfund, TRI)
     - NRC (reactors)
     - NID (dams)
     - NOAA incidents (oil spills)
     - CAFO density (county)
     - Military/PFAS (distance or count)
     - Optional: OSM (hospitals, cemeteries, airports)
   - Apply **distance-based penalties** (e.g. 0–5 km = high, 5–20 km = medium, 20–50 km = low).
   - **Score** = 100 − (disaster severity) − Σ (hazard penalties). Clamp 0–100.
3. **Output:** Same score as now (0–100); color the map by that number (heat map).
4. **Caching:** Pre-aggregate hazard counts per grid cell or county; at request time combine with disaster radius and apply formula.

---

## Quick Reference URLs

| Category | Primary URL |
|----------|-------------|
| FRS Geospatial (all facilities) | https://www.epa.gov/frs/geospatial-data-download-service |
| FRS National KML | https://ordsext.epa.gov/FLA/www3/national_frs.kmz |
| ECHO Web Services | https://echo.epa.gov/tools/web-services |
| ECHO Facility Search | https://echo.epa.gov/tools/web-services/facility-search-all-data |
| Envirofacts API | https://data.epa.gov/efservice/{program}.{table} |
| FRS API (radius search) | https://www.epa.gov/frs/frs-api |
| Superfund NPL (FRS) | Featured in FRS Geospatial KMZ |
| TRI MapServer | https://gispub.epa.gov/arcgis/rest/services/OEI/TRI_Facilities/MapServer |
| NID API | https://nid.sec.usace.army.mil/api |
| NOAA Oil Spills CSV | https://incidentnews.noaa.gov/raw/incidents.csv |
| NRC Reactor data | https://catalog.data.gov/dataset/u-s-nuclear-power-reactor-plant-status |
| DoD PFAS Map | https://www.acq.osd.mil/eie/eer/ecc/pfas/map/pfasmap.html |
| OpenFEMA | https://www.fema.gov/about/openfema/api |

Use this doc to add **hazard layers** (nuclear, industrial, waste, ag, infrastructure, oil, military, etc.) and compute a **single predictive water score** that varies by **relative proximity** to those hazards within a **disaster impact radius**, and drive your heat map from that score.
