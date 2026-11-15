import type { LatLng } from '../types/mars';

export const MARS_SURFACE_RADIUS_M = 3396190;
export const MARS_EARTH_RADIUS_RATIO = 3396190 / 6371000;

/** Assumed nominal EVA traverse speed used for duration estimates. */
export const ASSUMED_WALKING_SPEED_MPS = 0.2;

export function haversineDistanceM(a: LatLng, b: LatLng): number {
  const R = MARS_SURFACE_RADIUS_M;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function routeDistanceM(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistanceM(points[i - 1], points[i]);
  }
  return points.length > 1 ? total : 0;
}

export function durationSecondsFromDistance(distanceM: number, speedMps: number): number {
  if (!Number.isFinite(distanceM) || distanceM <= 0) return 0;
  return distanceM / speedMps;
}

/**
 * Initial bearing (azimuth) in degrees clockwise from north, from point a to point b.
 * Uses the standard great-circle initial bearing formula on the sphere.
 */
export function initialBearingDeg(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const dLng = (b.lng - a.lng) * rad;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = Math.atan2(y, x) / rad;
  return (brng + 360) % 360;
}

/**
 * Great-circle midpoint between two points.
 */
export function midpointLatLng(a: LatLng, b: LatLng): LatLng {
  const rad = Math.PI / 180;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const dLng = (b.lng - a.lng) * rad;
  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);
  const lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2));
  const lng3 = (a.lng * rad) + Math.atan2(by, Math.cos(lat1) + bx);
  return { lat: lat3 / rad, lng: ((lng3 / rad) + 540) % 360 - 180 };
}

/** Named traverse speeds for duration estimates. */
export const TRAVERSE_SPEEDS = [
  { id: 'walk', label: 'Suited walk', mps: 0.2 },
  { id: 'rover', label: 'Rover', mps: 1.0 },
  { id: 'drone', label: 'Aerial drone', mps: 5.0 },
] as const;

/**
 * Great-circle waypoints along a traverse: count evenly spaced points
 * between  and  (inclusive of both endpoints).
 */
export function greatCircleWaypoints(a: LatLng, b: LatLng, count: number): LatLng[] {
  if (count < 2) return [a, b];
  const rad = Math.PI / 180;
  const lat1 = a.lat * rad;
  const lng1 = a.lng * rad;
  const lat2 = b.lat * rad;
  const lng2 = b.lng * rad;
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
  ));
  const points: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    const f = i / (count - 1);
    if (d === 0) { points.push({ lat: a.lat, lng: a.lng }); continue; }
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) / rad;
    const lng = Math.atan2(y, x) / rad;
    points.push({ lat, lng });
  }
  return points;
}

/**
 * Estimated metabolic energy for a suited astronaut traversing distanceM
 * metres at the given speed. Uses an assumed metabolic rate of 300 W for a
 * suited EVA walk (stated assumption, not a measurement) and converts to
 * kilojoules.
 */
export function estimatedTraversalEnergyKJ(distanceM: number, speedMps: number): number {
  if (!Number.isFinite(distanceM) || distanceM <= 0 || !Number.isFinite(speedMps) || speedMps <= 0) return 0;
  const METABOLIC_POWER_W = 300;
  const durationS = distanceM / speedMps;
  return (METABOLIC_POWER_W * durationS) / 1000;
}

/**
 * Angular separation in degrees between two points (central angle).
 */
export function angularSeparationDeg(a: LatLng, b: LatLng): number {
  const R = MARS_SURFACE_RADIUS_M;
  const dist = haversineDistanceM(a, b);
  return (dist / R) * (180 / Math.PI);
}
