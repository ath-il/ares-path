import type { TerrainCell, TerrainGrid } from '../../types/mars';

/**
 * MOLA color hillshade tile URL template (NASA Trek WMTS).
 * Level = zoom - 1 (zoomOffset = -1). 256 px tiles.
 */
const MOLA_TILE_URL =
  'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg';

const MOLA_ZOOM = 5; // level 4 = 326 m/px
const MOLA_LEVEL = MOLA_ZOOM - 1; // 4
const TILES_WIDE = Math.pow(2, MOLA_ZOOM); // 32
const TILES_HIGH = Math.pow(2, MOLA_LEVEL); // 16
const TILE_SIZE = 256;

/**
 * Convert a lat/lng to tile column/row at the MOLA zoom level.
 */
function latLngToTile(lat: number, lng: number): { col: number; row: number } {
  const col = Math.floor(((lng + 180) / 360) * TILES_WIDE);
  const row = Math.floor(((90 - lat) / 180) * TILES_HIGH);
  return {
    col: Math.max(0, Math.min(TILES_WIDE - 1, col)),
    row: Math.max(0, Math.min(TILES_HIGH - 1, row)),
  };
}

/**
 * Convert a lat/lng to pixel coordinates within its tile.
 */
function latLngToPixel(lat: number, lng: number): { px: number; py: number; col: number; row: number } {
  const tile = latLngToTile(lat, lng);
  const px = Math.floor((((lng + 180) / 360) * TILES_WIDE - tile.col) * TILE_SIZE);
  const py = Math.floor((((90 - lat) / 180) * TILES_HIGH - tile.row) * TILE_SIZE);
  return { px: Math.max(0, Math.min(TILE_SIZE - 1, px)), py: Math.max(0, Math.min(TILE_SIZE - 1, py)), ...tile };
}

/**
 * Map a MOLA hillshade RGB color to an approximate elevation in meters.
 * The MOLA color ramp: blue (low) → green → yellow → orange → red → white (high).
 * Elevation range: -8000 m (Hellas) to +21000 m (Olympus Mons).
 *
 * NOTE: The MOLA color hillshade combines elevation color with terrain shading
 * (illumination). This mapping is approximate (±2 km) and should not be treated
 * as a measurement.
 */
function colorToElevation(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
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

  if (lightness > 0.85 && delta < 0.15) return 18000 + (lightness - 0.85) * 20000;
  if (lightness < 0.15) return -8000 + lightness * 20000;

  let elevationKm: number;
  if (hue >= 200 && hue < 260) elevationKm = -8 + ((hue - 200) / 60) * 6;
  else if (hue >= 160 && hue < 200) elevationKm = -2 + ((hue - 160) / 40) * 2;
  else if (hue >= 80 && hue < 160) elevationKm = 0 + ((hue - 80) / 80) * 4;
  else if (hue >= 40 && hue < 80) elevationKm = 4 + ((hue - 40) / 40) * 4;
  else if (hue >= 20 && hue < 40) elevationKm = 8 + ((hue - 20) / 20) * 4;
  else if (hue >= 0 && hue < 20) elevationKm = 12 + ((20 - hue) / 20) * 4;
  else if (hue >= 340 && hue <= 360) elevationKm = 12 + ((360 - hue) / 20) * 4;
  else elevationKm = -8 + lightness * 29;

  return elevationKm * 1000;
}

/**
 * Fetch a MOLA tile and return its ImageData. Cached by tile key.
 */
const tileCache = new Map<string, ImageData | null>();

async function fetchMolaTile(col: number, row: number): Promise<ImageData | null> {
  const key = `${MOLA_LEVEL}/${row}/${col}`;
  if (tileCache.has(key)) return tileCache.get(key)!;

  const url = MOLA_TILE_URL.replace('{z}', String(MOLA_LEVEL))
    .replace('{x}', String(col))
    .replace('{y}', String(row));

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      tileCache.set(key, null);
      return null;
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      tileCache.set(key, null);
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    tileCache.set(key, data);
    return data;
  } catch {
    tileCache.set(key, null);
    return null;
  }
}

/**
 * Build a terrain grid for a region. Fetches MOLA tiles covering the region
 * and samples pixel colors to estimate elevation per cell.
 *
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param gridCells Number of cells per side (e.g., 30 = 30×30 grid)
 * @param cellSizeM Approximate cell size in meters
 */
export async function buildTerrainGrid(
  centerLat: number,
  centerLng: number,
  gridCells: number = 30,
  cellSizeM: number = 500,
): Promise<TerrainGrid> {
  // Compute grid bounds in lat/lng
  const metersPerDegLat = 111320; // approximate
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const halfExtentLat = (gridCells * cellSizeM) / 2 / metersPerDegLat;
  const halfExtentLng = (gridCells * cellSizeM) / 2 / metersPerDegLng;

  const minLat = centerLat - halfExtentLat;
  const maxLat = centerLat + halfExtentLat;
  const minLng = centerLng - halfExtentLng;
  const maxLng = centerLng + halfExtentLng;

  // Fetch all tiles covering this region
  const tiles: Map<string, ImageData> = new Map();

  for (let row = 0; row < TILES_HIGH; row++) {
    for (let col = 0; col < TILES_WIDE; col++) {
      const tileMinLat = 90 - (row + 1) * (180 / TILES_HIGH);
      const tileMaxLat = 90 - row * (180 / TILES_HIGH);
      const tileMinLng = -180 + col * (360 / TILES_WIDE);
      const tileMaxLng = -180 + (col + 1) * (360 / TILES_WIDE);

      if (tileMaxLat < minLat || tileMinLat > maxLat) continue;
      if (tileMaxLng < minLng || tileMinLng > maxLng) continue;

      const data = await fetchMolaTile(col, row);
      if (data) tiles.set(`${row}/${col}`, data);
    }
  }

  // Build the grid
  const cells: TerrainCell[][] = [];
  for (let r = 0; r < gridCells; r++) {
    const row: TerrainCell[] = [];
    for (let c = 0; c < gridCells; c++) {
      const lat = maxLat - (r / (gridCells - 1)) * (maxLat - minLat);
      const lng = minLng + (c / (gridCells - 1)) * (maxLng - minLng);

      const { col, row: tileRow, px, py } = latLngToPixel(lat, lng);
      const tileData = tiles.get(`${tileRow}/${col}`);

      let elevationM: number | null = null;
      if (tileData) {
        const idx = (py * TILE_SIZE + px) * 4;
        const r = tileData.data[idx];
        const g = tileData.data[idx + 1];
        const b = tileData.data[idx + 2];
        elevationM = colorToElevation(r, g, b);
      }

      row.push({
        lat,
        lng,
        elevationM,
        slopeDeg: null,
        cost: 1,
        blocked: false,
      });
    }
    cells.push(row);
  }

  // Compute slopes between neighbors
  for (let r = 0; r < gridCells; r++) {
    for (let c = 0; c < gridCells; c++) {
      const cell = cells[r][c];
      if (cell.elevationM === null) {
        cell.blocked = false;
        cell.cost = 2; // conservative penalty for unknown
        continue;
      }
      // Compute max slope to any neighbor
      let maxSlope = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= gridCells || nc < 0 || nc >= gridCells) continue;
          const neighbor = cells[nr][nc];
          if (neighbor.elevationM === null) continue;
          const elevDiff = Math.abs(neighbor.elevationM - cell.elevationM);
          const dist = Math.sqrt(dr * dr + dc * dc) * cellSizeM;
          const slopeDeg = Math.atan2(elevDiff, dist) * (180 / Math.PI);
          maxSlope = Math.max(maxSlope, slopeDeg);
        }
      }
      cell.slopeDeg = maxSlope;
      // Cost: 1 for flat, up to 10 for steep
      cell.cost = 1 + Math.min(9, maxSlope / 5);
      cell.blocked = maxSlope > 30; // block cells steeper than 30°
    }
  }

  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    rows: gridCells,
    cols: gridCells,
    cellSizeM,
    cells,
    dataSource: 'NASA/JPL Mars Trek — MOLA Color Hillshade (color-encoded elevation, approximate)',
    dataSourceUrl: 'https://trek.nasa.gov/mars/',
  };
}