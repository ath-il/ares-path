import type { LatLng, RouteSlot } from '../types/mars';

/**
 * Default traverse endpoints. These are the real published coordinates of
 * Jezero Crater (Perseverance landing site) and Aeolis Mons (Mount Sharp),
 * matching the entries in `scientificTargets.ts`. A map pick replaces them
 * for the current mission only; nothing here is invented or rounded.
 */
export const DEFAULT_ROUTE_POINTS: Record<RouteSlot, LatLng> = {
  start: { lat: 18.44, lng: 77.45 },
  end: { lat: -5.25, lng: 137.8 },
};
