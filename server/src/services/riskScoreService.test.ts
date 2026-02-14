/**
 * Tests for the risk score heuristic. Run with: npm run test
 * Showcases: no disasters = 100; disaster nearby = score drops; multiple = bigger drop.
 */
import { computeRiskScore } from './riskScoreService.js';
import type { Disaster } from './disasters.js';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Helper: disaster at lat/lng (within 150 km will lower score)
const disaster = (lat: number, lng: number, title?: string): Disaster => ({
  id: '1',
  lat,
  lng,
  title: title ?? 'Test disaster',
});

// NYC area
const nyc = { lat: 40.7128, lng: -74.006 };

// 1. No disasters → score 100
const noDisasters = computeRiskScore(nyc.lat, nyc.lng, []);
assert(noDisasters.score === 100, `Expected 100, got ${noDisasters.score}`);
assert(
  noDisasters.explanation.includes('No known disasters'),
  'Explanation should say no known disasters'
);
console.log('✓ No disasters → score 100');

// 2. Disaster far away (>150 km) → still 100
const far = disaster(34.05, -118.25, 'LA fire'); // ~3940 km from NYC
const farResult = computeRiskScore(nyc.lat, nyc.lng, [far]);
assert(farResult.score === 100, `Expected 100 when disaster far, got ${farResult.score}`);
console.log('✓ Disaster far away → score 100');

// 3. Disaster within 150 km → score 75 (one penalty of 25)
const nearby = disaster(40.9, -74.0, 'Flood declaration');
const nearbyResult = computeRiskScore(nyc.lat, nyc.lng, [nearby]);
assert(nearbyResult.score === 75, `Expected 75, got ${nearbyResult.score}`);
assert(
  nearbyResult.explanation.includes('Flood declaration') || nearbyResult.explanation.includes('Disaster nearby'),
  'Explanation should mention the disaster'
);
console.log('✓ One disaster within 150 km → score 75');

// 4. Two disasters within 150 km → score 50
const nearby2 = disaster(40.5, -73.8, 'Chemical spill');
const twoResult = computeRiskScore(nyc.lat, nyc.lng, [nearby, nearby2]);
assert(twoResult.score === 50, `Expected 50, got ${twoResult.score}`);
console.log('✓ Two disasters nearby → score 50');

// 5. Score never goes below 0
const many = Array.from({ length: 10 }, (_, i) => disaster(40.7 + i * 0.01, -74, `D${i}`));
const manyResult = computeRiskScore(nyc.lat, nyc.lng, many);
assert(manyResult.score >= 0, `Score should be >= 0, got ${manyResult.score}`);
console.log('✓ Many disasters → score capped at 0');

console.log('\nAll risk score tests passed.');
process.exit(0);
