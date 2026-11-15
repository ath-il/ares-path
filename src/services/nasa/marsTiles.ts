import { MARS_LAYERS, layerById } from '../../data/layers';
import type { LayerId, MarsLayer } from '../../types/mars';

/**
 * Tiling arithmetic, derived from the published service metadata rather than
 * guessed.
 *
 * Leaflet's world is 256 · 2^z pixels wide at map zoom z (a fixed constant,
 * independent of the CRS when `crs.scale` is the default). Both integrated
 * providers serve 2:1 equirectangular pyramids anchored at the north-west
 * corner (lon −180, lat +90), so at service level L the pyramid is
 *
 *   columns = 2^(L+1), rows = 2^L, tile size T px
 *   world width in pixels = T · 2^(L+1)
 *
 * Equating that with 256 · 2^z gives
 *
 *   z = L + log2(T / 256) + 1
 *   L = z − log2(T / 256) − 1
 *
 * so the Leaflet `zoomOffset` (added to the map zoom to obtain the service
 * level) is:
 *
 *   NASA Mars Trek (T = 256):  zoomOffset = −1   → map zoom 1..8  = level 0..7
 *   Esri OnMars   (T = 512):  zoomOffset = −2   → map zoom 2..19 = LOD 0..17
 *
 * Both pyramids are north-up (`TopLeftCorner −180 90` / `origin {x:−180,y:90}`),
 * so `tms` must stay false; a TMS flip would mirror the rows.
 */
export function zoomOffsetForTileSize(tileSize: number): number {
  return -1 - Math.log2(tileSize / 256);
}

/** Service tile-matrix index for a Leaflet map zoom. */
export function tileMatrixIndexForZoom(layer: MarsLayer, mapZoom: number): number | null {
  if (!layer.tile) return null;
  return Math.round(mapZoom) + layer.tile.zoomOffset;
}

/** Map zoom range in which the service's own levels are used without upscaling. */
export function nativeZoomRange(layer: MarsLayer): { min: number; max: number } | null {
  if (!layer.tile) return null;
  return { min: layer.tile.minNativeZoom, max: layer.tile.maxNativeZoom };
}

export function tileUrlFor(
  layerId: LayerId,
  mapZoom: number,
  col: number,
  row: number,
): string | null {
  const layer = layerById(layerId);
  if (!layer?.tile) return null;
  const level = Math.round(mapZoom) + layer.tile.zoomOffset;
  return layer.tile.urlTemplate
    .replace('{z}', String(level))
    .replace('{x}', String(col))
    .replace('{y}', String(row));
}

export function layerByIdOrThrow(layerId: LayerId): MarsLayer {
  const layer = layerById(layerId);
  if (!layer) throw new Error(`Unknown Mars layer: ${layerId}`);
  return layer;
}

export const INTEGRATED_LAYER_COUNT = MARS_LAYERS.filter(
  (layer) => layer.status === 'available',
).length;
