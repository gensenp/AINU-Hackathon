/**
 * Demo reservoir data: major water supply sources with approximate coordinates.
 * In production this would come from state water boards, USGS, or utility boundaries.
 * Each reservoir serves a region; we use "nearest within radius" as proxy for "possible source".
 */
export type Reservoir = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
  /** States or regions this source typically serves (for display). */
  serves?: string[];
};

export const RESERVOIRS: Reservoir[] = [
  { id: 'lake-mead', name: 'Lake Mead (Colorado River)', lat: 36.04, lng: -114.74, state: 'NV', serves: ['NV', 'AZ', 'CA'] },
  { id: 'lake-powell', name: 'Lake Powell', lat: 36.94, lng: -111.49, state: 'AZ', serves: ['AZ', 'NV', 'CA'] },
  { id: 'hoover', name: 'Hoover Dam / Lake Mead intake', lat: 36.02, lng: -114.74, state: 'NV', serves: ['NV', 'AZ', 'CA'] },
  { id: 'nyc-delaware', name: 'Delaware System (NYC)', lat: 41.95, lng: -75.0, state: 'NY', serves: ['NY'] },
  { id: 'nyc-catskill', name: 'Catskill System (NYC)', lat: 42.1, lng: -74.4, state: 'NY', serves: ['NY'] },
  { id: 'croton', name: 'Croton Watershed (NYC)', lat: 41.25, lng: -73.65, state: 'NY', serves: ['NY'] },
  { id: 'patuxent', name: 'Patuxent / Triadelphia (MD/DC)', lat: 39.15, lng: -76.95, state: 'MD', serves: ['MD', 'DC'] },
  { id: 'occoquan', name: 'Occoquan Reservoir (VA)', lat: 38.68, lng: -77.26, state: 'VA', serves: ['VA', 'DC'] },
  { id: 'lake-lanier', name: 'Lake Sidney Lanier', lat: 34.18, lng: -84.0, state: 'GA', serves: ['GA'] },
  { id: 'allatoona', name: 'Lake Allatoona', lat: 34.15, lng: -84.63, state: 'GA', serves: ['GA'] },
  { id: 'norris', name: 'Norris Lake (TN)', lat: 36.22, lng: -84.09, state: 'TN', serves: ['TN'] },
  { id: 'douglas', name: 'Douglas Lake (TN)', lat: 36.0, lng: -83.4, state: 'TN', serves: ['TN'] },
  { id: 'toledo-bend', name: 'Toledo Bend Reservoir', lat: 31.2, lng: -93.6, state: 'LA', serves: ['LA', 'TX'] },
  { id: 'lake-travis', name: 'Lake Travis (TX)', lat: 30.42, lng: -97.92, state: 'TX', serves: ['TX'] },
  { id: 'lake-tawakoni', name: 'Lake Tawakoni', lat: 32.85, lng: -95.95, state: 'TX', serves: ['TX'] },
  { id: 'grand-lake-ok', name: 'Grand Lake O\' the Cherokees', lat: 36.58, lng: -94.85, state: 'OK', serves: ['OK'] },
  { id: 'lake-ouachita', name: 'Lake Ouachita', lat: 34.65, lng: -93.35, state: 'AR', serves: ['AR'] },
  { id: 'lake-degray', name: 'DeGray Lake', lat: 34.18, lng: -93.08, state: 'AR', serves: ['AR'] },
  { id: 'lake-michigan-intake', name: 'Lake Michigan intake (Chicago)', lat: 41.88, lng: -87.62, state: 'IL', serves: ['IL'] },
  { id: 'ohio-river', name: 'Ohio River (Cincinnati area)', lat: 39.1, lng: -84.5, state: 'OH', serves: ['OH', 'KY', 'IN'] },
];
