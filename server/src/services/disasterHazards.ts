/**
 * Hazard facilities that can worsen water quality in a disaster (flood, hurricane, etc.).
 * Used for predictive "in the event of a disaster" scoring.
 * Data: NRC reactor locations (approximate); can be extended with EPA FRS/ECHO.
 */

const R = 6371; // Earth radius km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type HazardType = 'nuclear' | 'industrial' | 'waste' | 'refinery';

export type HazardFacility = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: HazardType;
};

// US nuclear power plant sites (approximate coordinates; NRC/Data.gov). Subset for demo.
const NUCLEAR_PLANTS: HazardFacility[] = [
  { id: 'n-palo-verde', name: 'Palo Verde', lat: 33.39, lng: -112.87, type: 'nuclear' },
  { id: 'n-browns-ferry', name: 'Browns Ferry', lat: 34.56, lng: -87.1, type: 'nuclear' },
  { id: 'n-peach-bottom', name: 'Peach Bottom', lat: 39.76, lng: -76.27, type: 'nuclear' },
  { id: 'n-susquehanna', name: 'Susquehanna', lat: 41.07, lng: -76.0, type: 'nuclear' },
  { id: 'n-three-mile', name: 'Three Mile Island', lat: 40.15, lng: -76.72, type: 'nuclear' },
  { id: 'n-indian-point', name: 'Indian Point', lat: 41.27, lng: -73.95, type: 'nuclear' },
  { id: 'n-millstone', name: 'Millstone', lat: 41.31, lng: -72.17, type: 'nuclear' },
  { id: 'n-pilgrim', name: 'Pilgrim', lat: 41.97, lng: -70.58, type: 'nuclear' },
  { id: 'n-seabrook', name: 'Seabrook', lat: 42.9, lng: -70.85, type: 'nuclear' },
  { id: 'n-vogtle', name: 'Vogtle', lat: 32.09, lng: -81.78, type: 'nuclear' },
  { id: 'n-harris', name: 'Shearon Harris', lat: 35.63, lng: -78.95, type: 'nuclear' },
  { id: 'n-mcguire', name: 'McGuire', lat: 35.43, lng: -80.95, type: 'nuclear' },
  { id: 'n-catawba', name: 'Catawba', lat: 35.0, lng: -81.07, type: 'nuclear' },
  { id: 'n-oconee', name: 'Oconee', lat: 34.8, lng: -82.9, type: 'nuclear' },
  { id: 'n-summer', name: 'V.C. Summer', lat: 34.0, lng: -81.0, type: 'nuclear' },
  { id: 'n-brunswick', name: 'Brunswick', lat: 33.96, lng: -78.0, type: 'nuclear' },
  { id: 'n-south-texas', name: 'South Texas', lat: 28.8, lng: -96.05, type: 'nuclear' },
  { id: 'n-comanche-peak', name: 'Comanche Peak', lat: 32.3, lng: -97.78, type: 'nuclear' },
  { id: 'n-river-bend', name: 'River Bend', lat: 30.72, lng: -91.24, type: 'nuclear' },
  { id: 'n-waterford', name: 'Waterford', lat: 29.99, lng: -90.47, type: 'nuclear' },
  { id: 'n-grand-gulf', name: 'Grand Gulf', lat: 32.0, lng: -91.05, type: 'nuclear' },
  { id: 'n-arkansas', name: 'Arkansas Nuclear One', lat: 35.31, lng: -93.22, type: 'nuclear' },
  { id: 'n-cooper', name: 'Cooper', lat: 40.37, lng: -95.63, type: 'nuclear' },
  { id: 'n-wolf-creek', name: 'Wolf Creek', lat: 38.24, lng: -95.68, type: 'nuclear' },
  { id: 'n-callaway', name: 'Callaway', lat: 38.75, lng: -91.78, type: 'nuclear' },
  { id: 'n-quad-cities', name: 'Quad Cities', lat: 41.72, lng: -90.35, type: 'nuclear' },
  { id: 'n-byron', name: 'Byron', lat: 42.08, lng: -89.28, type: 'nuclear' },
  { id: 'n-dresden', name: 'Dresden', lat: 41.45, lng: -88.27, type: 'nuclear' },
  { id: 'n-braidwood', name: 'Braidwood', lat: 41.24, lng: -88.22, type: 'nuclear' },
  { id: 'n-limerick', name: 'Limerick', lat: 40.23, lng: -75.59, type: 'nuclear' },
  { id: 'n-beaver-valley', name: 'Beaver Valley', lat: 40.62, lng: -80.43, type: 'nuclear' },
  { id: 'n-davis-besse', name: 'Davis-Besse', lat: 41.5, lng: -82.87, type: 'nuclear' },
  { id: 'n-perry', name: 'Perry', lat: 41.8, lng: -81.14, type: 'nuclear' },
  { id: 'n-fermi', name: 'Fermi', lat: 41.97, lng: -83.26, type: 'nuclear' },
  { id: 'n-palisades', name: 'Palisades', lat: 42.31, lng: -86.33, type: 'nuclear' },
  { id: 'n-cook', name: 'Donald C. Cook', lat: 41.97, lng: -86.56, type: 'nuclear' },
  { id: 'n-point-beach', name: 'Point Beach', lat: 44.28, lng: -87.54, type: 'nuclear' },
  { id: 'n-prairie-island', name: 'Prairie Island', lat: 44.63, lng: -92.63, type: 'nuclear' },
  { id: 'n-monticello', name: 'Monticello', lat: 45.21, lng: -93.82, type: 'nuclear' },
  { id: 'n-duane-arnold', name: 'Duane Arnold', lat: 41.92, lng: -91.77, type: 'nuclear' },
  { id: 'n-clinton', name: 'Clinton', lat: 40.17, lng: -88.84, type: 'nuclear' },
  { id: 'n-lasalle', name: 'LaSalle', lat: 41.25, lng: -88.65, type: 'nuclear' },
  { id: 'n-zion', name: 'Zion', lat: 42.45, lng: -87.8, type: 'nuclear' },
  { id: 'n-surry', name: 'Surry', lat: 37.17, lng: -76.7, type: 'nuclear' },
  { id: 'n-north-anna', name: 'North Anna', lat: 38.06, lng: -77.79, type: 'nuclear' },
  { id: 'n-calvert-cliffs', name: 'Calvert Cliffs', lat: 38.43, lng: -76.44, type: 'nuclear' },
  { id: 'n-st-lucie', name: 'St. Lucie', lat: 27.34, lng: -80.25, type: 'nuclear' },
  { id: 'n-turkey-point', name: 'Turkey Point', lat: 25.43, lng: -80.33, type: 'nuclear' },
  { id: 'n-crystal-river', name: 'Crystal River', lat: 28.96, lng: -82.72, type: 'nuclear' },
  { id: 'n-diyablo-canyon', name: 'Diablo Canyon', lat: 35.21, lng: -120.86, type: 'nuclear' },
];

const DEFAULT_RADIUS_KM = 80; // In a disaster, facilities within this range can affect water

export type NearbyHazards = {
  facilities: { facility: HazardFacility; distanceKm: number }[];
  byType: { nuclear: number; industrial: number; waste: number; refinery: number };
  /** Total "risk weight" for predictive score (closer = higher) */
  hazardPenalty: number;
};

/**
 * Get hazard facilities (nuclear, etc.) within radius of a point.
 * Used to predict water quality degradation if a disaster (flood, hurricane) occurs.
 */
export function getNearbyHazards(
  lat: number,
  lng: number,
  radiusKm: number = DEFAULT_RADIUS_KM
): NearbyHazards {
  const byType = { nuclear: 0, industrial: 0, waste: 0, refinery: 0 };
  const facilities: { facility: HazardFacility; distanceKm: number }[] = [];

  for (const f of NUCLEAR_PLANTS) {
    const km = distanceKm(lat, lng, f.lat, f.lng);
    if (km <= radiusKm) {
      facilities.push({ facility: f, distanceKm: Math.round(km * 100) / 100 });
      byType.nuclear += 1;
    }
  }

  // Penalty: closer facilities and more of them = higher risk in a disaster
  let hazardPenalty = 0;
  for (const { facility, distanceKm: km } of facilities) {
    const proximityFactor = Math.max(0.1, 1 - km / radiusKm); // 0.1..1
    const weight = facility.type === 'nuclear' ? 15 : 8; // nuclear = higher impact
    hazardPenalty += weight * proximityFactor;
  }
  hazardPenalty = Math.min(hazardPenalty, 50); // cap so score doesn't always hit 0

  return { facilities, byType, hazardPenalty };
}

/**
 * One-line summary for "in event of disaster" prediction.
 */
export function summarizeDisasterPrediction(nearby: NearbyHazards, hasActiveDisaster: boolean): string {
  if (nearby.facilities.length === 0) {
    return hasActiveDisaster
      ? 'No major industrial or nuclear facilities in range; hazard from disaster alone.'
      : 'No major hazard facilities nearby; water risk in a disaster would be lower.';
  }
  const parts: string[] = [];
  if (nearby.byType.nuclear > 0) {
    parts.push(`${nearby.byType.nuclear} nuclear power plant(s) within ${DEFAULT_RADIUS_KM} km`);
  }
  if (parts.length > 0) {
    return hasActiveDisaster
      ? `In this disaster, water quality could be affected by: ${parts.join('; ')}. Avoid untreated surface water.`
      : `If a disaster occurred here, risk could increase due to: ${parts.join('; ')}.`;
  }
  return 'Some industrial facilities nearby could pose water risk in a flood or storm.';
}
