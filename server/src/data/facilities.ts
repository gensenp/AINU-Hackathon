/**
 * Demo facilities data: power plants, nuclear, refineries (approximate locations).
 * In production: EPA FRS, EIA, NRC APIs. Used to flag "disaster near hazardous facility" = higher risk.
 */
export type FacilityType = 'power_plant' | 'nuclear' | 'refinery' | 'chemical';

export type Facility = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
  type: FacilityType;
};

export const FACILITIES: Facility[] = [
  // Nuclear (NRC-style names/locations approximate)
  { id: 'indian-point', name: 'Indian Point (decommissioned)', lat: 41.27, lng: -73.95, state: 'NY', type: 'nuclear' },
  { id: 'salem', name: 'Salem / Hope Creek (NJ)', lat: 39.47, lng: -75.54, state: 'NJ', type: 'nuclear' },
  { id: 'limerick', name: 'Limerick (PA)', lat: 40.23, lng: -75.59, state: 'PA', type: 'nuclear' },
  { id: 'three-mile', name: 'Three Mile Island (PA)', lat: 40.15, lng: -76.72, state: 'PA', type: 'nuclear' },
  { id: 'sequoyah', name: 'Sequoyah (TN)', lat: 35.22, lng: -85.09, state: 'TN', type: 'nuclear' },
  { id: 'watts-bar', name: 'Watts Bar (TN)', lat: 35.6, lng: -84.79, state: 'TN', type: 'nuclear' },
  { id: 'vogtle', name: 'Vogtle (GA)', lat: 33.14, lng: -81.76, state: 'GA', type: 'nuclear' },
  { id: 'comanche-peak', name: 'Comanche Peak (TX)', lat: 32.3, lng: -97.79, state: 'TX', type: 'nuclear' },
  { id: 'south-texas', name: 'South Texas Project', lat: 28.8, lng: -96.05, state: 'TX', type: 'nuclear' },
  // Refineries / oil (approximate)
  { id: 'bayway', name: 'Bayway Refinery (NJ)', lat: 40.64, lng: -74.24, state: 'NJ', type: 'refinery' },
  { id: 'philadelphia-ref', name: 'Philadelphia Refinery (PA)', lat: 39.83, lng: -75.22, state: 'PA', type: 'refinery' },
  { id: 'baton-rouge', name: 'Baton Rouge Refinery (LA)', lat: 30.45, lng: -91.19, state: 'LA', type: 'refinery' },
  { id: 'port-arthur', name: 'Port Arthur Refinery (TX)', lat: 29.9, lng: -93.93, state: 'TX', type: 'refinery' },
  { id: 'texas-city', name: 'Texas City Refinery (TX)', lat: 29.38, lng: -94.9, state: 'TX', type: 'refinery' },
  // Power plants (coal/gas – representative)
  { id: 'indian-river', name: 'Indian River Power Plant (DE)', lat: 38.78, lng: -75.21, state: 'DE', type: 'power_plant' },
  { id: 'bowen', name: 'Bowen (GA)', lat: 34.12, lng: -84.93, state: 'GA', type: 'power_plant' },
  { id: 'paradise', name: 'Paradise (KY)', lat: 37.26, lng: -86.98, state: 'KY', type: 'power_plant' },
  { id: 'gibson', name: 'Gibson (IN)', lat: 38.37, lng: -87.77, state: 'IN', type: 'power_plant' },
  { id: 'martin-creek', name: 'Martin Lake (TX)', lat: 32.27, lng: -94.57, state: 'TX', type: 'power_plant' },
];
