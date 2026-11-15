import L from 'leaflet';
import type { LatLng, Point, PointExpression } from 'leaflet';

/**
 * Mars 2000 sphere radius used by every service integrated in this build:
 * GCS_Mars_2000_Sphere (Esri wkid 104971) publishes 3396190 m, and NASA Mars
 * Trek's equirectangular pyramid (EPSG:104905) is a geographic grid, so the
 * sphere size only matters for ground-distance calculations.
 */
export const MARS_SURFACE_RADIUS_M = 3396190;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Mars equirectangular (plate carrée) CRS.
 *
 * Both verified tile services are geographic pyramids over the full
 * 360° × 180° Mars graticule:
 *   - NASA Mars Trek: SupportedCRS urn:ogc:def:crs:EPSG::104905,
 *     TopLeftCorner -180 90, TileMatrixSet default028mm.
 *   - Esri OnMars: GCS_Mars_2000_Sphere (wkid 104971),
 *     origin { x: -180, y: 90 }, full extent -180/-90/180/90.
 *
 * So the Leaflet world is a plain rectangle: longitude maps linearly to x and
 * latitude maps linearly to y, with a 2:1 aspect ratio (360° wide, 180° tall).
 * There is no Mercator y-warp and therefore no latitude clamp or infinity at
 * the poles. Using a Mercator CRS here would misplace every projected
 * coordinate and request the wrong tiles.
 */
const MARS_PROJECTION = {
  project(latlng: LatLng | { lat: number; lng: number }): Point {
    const lat = Math.max(-90, Math.min(90, latlng.lat));
    return new L.Point(
      MARS_SURFACE_RADIUS_M * latlng.lng * D2R,
      MARS_SURFACE_RADIUS_M * lat * D2R,
    );
  },
  unproject(point: PointExpression): LatLng {
    const p = L.point(point);
    const lng = ((((p.x * R2D) / MARS_SURFACE_RADIUS_M + 180) % 360) + 360) % 360 - 180;
    const lat = Math.max(-90, Math.min(90, (p.y * R2D) / MARS_SURFACE_RADIUS_M));
    return new L.LatLng(lat, lng);
  },
};

const MARS_CRS = {
  code: 'MARS-EQ',
  infinite: false,
  // Longitude wraps (the planet is a cylinder); latitude does not.
  // Defining wrapLat here would make Leaflet compute an inverted row-wrap range
  // in a north-up pixel space and request tile rows beyond the south pole.
  wrapLng: [-180, 180] as [number, number],
  latLngToPoint(latlng: LatLng, zoom: number): Point {
    const worldSize = 256 * Math.pow(2, zoom);
    const lat = Math.max(-90, Math.min(90, latlng.lat));
    // The world is 2:1 (360° wide, 180° tall), so one pixel covers
    // 360/worldSize degrees on both axes. Dividing y by worldSize instead of
    // worldSize/2 would halve the latitude scale and request the wrong tile row.
    return new L.Point(
      (worldSize * (latlng.lng + 180)) / 360,
      (worldSize * (90 - lat)) / 360,
    );
  },
  pointToLatLng(point: Point, zoom: number): LatLng {
    const worldSize = 256 * Math.pow(2, zoom);
    const lng = (point.x / worldSize) * 360 - 180;
    const lat = 90 - (point.y / worldSize) * 360;
    return new L.LatLng(Math.max(-90, Math.min(90, lat)), lng);
  },
  project(latlng: LatLng): Point {
    return MARS_PROJECTION.project(latlng);
  },
  unproject(point: Point): LatLng {
    return MARS_PROJECTION.unproject(point);
  },
  scale(zoom: number): number {
    return 256 * Math.pow(2, zoom);
  },
  zoom(scale: number): number {
    return Math.log(scale / 256) / Math.LN2;
  },
  getProjectedBounds(zoom: number): L.Bounds {
    const worldSize = 256 * Math.pow(2, zoom);
    return new L.Bounds(new L.Point(0, 0), new L.Point(worldSize, worldSize / 2));
  },
  distance(latlng1: LatLng, latlng2: LatLng): number {
    // Great-circle distance on the Mars sphere (not planar pixel distance).
    const lat1 = latlng1.lat * D2R;
    const lat2 = latlng2.lat * D2R;
    const sinDLat = Math.sin(((latlng2.lat - latlng1.lat) * D2R) / 2);
    const sinDLon = Math.sin(((latlng2.lng - latlng1.lng) * D2R) / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return MARS_SURFACE_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  },
  wrapLatLng(latlng: LatLng): LatLng {
    const lng = ((((latlng.lng + 180) % 360) + 360) % 360) - 180;
    const lat = Math.max(-90, Math.min(90, latlng.lat));
    return new L.LatLng(lat, lng, latlng.alt);
  },
  wrapLatLngBounds(bounds: L.LatLngBounds): L.LatLngBounds {
    // Same algorithm as Leaflet's default: shift the box so its centre is
    // wrapped, preserving its size (important for fitBounds across the seam).
    const center = bounds.getCenter();
    const newCenter = MARS_CRS.wrapLatLng(center);
    const latShift = center.lat - newCenter.lat;
    const lngShift = center.lng - newCenter.lng;
    if (latShift === 0 && lngShift === 0) {
      return bounds;
    }
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return new L.LatLngBounds(
      new L.LatLng(sw.lat - latShift, sw.lng - lngShift),
      new L.LatLng(ne.lat - latShift, ne.lng - lngShift),
    );
  },
};

export const MARS_CRS_VALUE: L.CRS = MARS_CRS as unknown as L.CRS;
export const MARS_TILE_SIZE = 256;

/** Leaflet zoom at which the full 360° Mars circumference is 256·2^z px. */
export function worldPixelsAtZoom(zoom: number): number {
  return 256 * Math.pow(2, zoom);
}

/**
 * Ground resolution of the equirectangular grid at a given Leaflet zoom,
 * in degrees of longitude per pixel (valid at the equator for metres).
 */
export function degreesPerPixelAtZoom(zoom: number): number {
  return 360 / worldPixelsAtZoom(zoom);
}
