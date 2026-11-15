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

export interface ElevationSample {
  lat: number;
  lng: number;
  elevationM: number;
}

/**
 * Translates a terrain concern score (0..1) into the public assessment wording.
 * The score is always derived only from factors whose data availability was confirmed.
 */
export function describeTerrainLevel(level: string): string {
  switch (level) {
    case 'lower':
      return 'Lower relative terrain concern';
    case 'moderate':
      return 'Moderate relative terrain concern';
    case 'higher':
      return 'Higher relative terrain concern';
    default:
      return 'Insufficient data';
  }
}
