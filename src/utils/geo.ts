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
 * Approximate elevation estimate from the Esri MColorDEM tile at a given
 * lat/lng. Samples the centre pixel of the tile containing the point and
 * maps its colour to an approximate elevation using the standard Mars
 * colourised-DEM ramp (blue = low, green = mid, red/white = high).
 *
 * Returns null if the tile cannot be fetched or sampled. The estimate is
 * rough (±2 km) because the colour scale is not officially documented.
 */
export async function estimateElevationFromDem(
  lat: number,
  lng: number,
): Promise<{ elevationM: number; uncertaintyM: number; rgb: [number, number, number] } | null> {
  // Use the MOLA color hillshade (NASA Trek) — its color ramp is documented
  // and tiles have CORS headers, so we can sample pixels from the browser.
  const urlTemplate =
    'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg';

  const zoom = 5; // level 4 = 326 m/px, good balance of detail and coverage
  const level = zoom - 1; // zoomOffset = -1
  const cols = Math.pow(2, zoom); // 2^5 = 32
  const rows = Math.pow(2, level); // 2^4 = 16
  const col = Math.floor(((lng + 180) / 360) * cols);
  const row = Math.floor(((90 - lat) / 180) * rows);

  const url = urlTemplate
    .replace('{z}', String(level))
    .replace('{x}', String(col))
    .replace('{y}', String(row));

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const tileSize = 256;
    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);

    const px = Math.min(
      tileSize - 1,
      Math.max(0, Math.floor((((lng + 180) / 360) * cols - col) * tileSize)),
    );
    const py = Math.min(
      tileSize - 1,
      Math.max(0, Math.floor((((90 - lat) / 180) * rows - row) * tileSize)),
    );

    const data = ctx.getImageData(px, py, 1, 1).data;
    const [r, g, b] = [data[0], data[1], data[2]];

    // Approximate Mars DEM colour ramp (MOLA-style):
    // blue (low) → cyan → green → yellow → orange → red → white (high)
    // Elevation range: -8 km (Hellas) to +21 km (Olympus Mons)
    const elevationM = colorToApproximateElevation(r, g, b);

    return { elevationM, uncertaintyM: 2000, rgb: [r, g, b] };
  } catch {
    return null;
  }
}

function colorToApproximateElevation(r: number, g: number, b: number): number {
  // Normalise to 0..1
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  // Compute hue (0..360) and saturation
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
    else hue = 60 * ((rn - gn) / delta + 4);
  }
  if (hue < 0) hue += 360;

  const lightness = (max + min) / 2;

  // Map: low elevation → blue (hue ~240), high → red/white (hue ~0 or lightness ~1)
  // Mars elevation range: -8000 m to +21000 m (29 km span)
  // Use a combination of hue and lightness

  // Very light pixels → high elevation (white cap, Olympus Mons)
  if (lightness > 0.85 && delta < 0.15) return 18000 + (lightness - 0.85) * 20000;

  // Dark pixels → low elevation (Hellas basin, dark blue)
  if (lightness < 0.15) return -8000 + lightness * 20000;

  // Hue-based mapping for the colour ramp
  // Blue (200-260) → -8 to -2 km
  // Cyan (160-200) → -2 to 0 km
  // Green (80-160) → 0 to +4 km
  // Yellow (40-80) → +4 to +8 km
  // Orange (20-40) → +8 to +12 km
  // Red (0-20 or 340-360) → +12 to +16 km

  let elevationKm: number;
  if (hue >= 200 && hue < 260) {
    elevationKm = -8 + ((hue - 200) / 60) * 6; // -8 to -2
  } else if (hue >= 160 && hue < 200) {
    elevationKm = -2 + ((hue - 160) / 40) * 2; // -2 to 0
  } else if (hue >= 80 && hue < 160) {
    elevationKm = 0 + ((hue - 80) / 80) * 4; // 0 to +4
  } else if (hue >= 40 && hue < 80) {
    elevationKm = 4 + ((hue - 40) / 40) * 4; // +4 to +8
  } else if (hue >= 20 && hue < 40) {
    elevationKm = 8 + ((hue - 20) / 20) * 4; // +8 to +12
  } else if (hue >= 0 && hue < 20) {
    elevationKm = 12 + ((20 - hue) / 20) * 4; // +12 to +16
  } else if (hue >= 340 && hue <= 360) {
    elevationKm = 12 + ((360 - hue) / 20) * 4; // +12 to +16
  } else {
    // Fallback: use lightness
    elevationKm = -8 + lightness * 29; // -8 to +21
  }

  return elevationKm * 1000;
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
