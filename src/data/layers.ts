import type { LayerId, LayerLoadStatus, LayerLoadStatusMap, MarsLayer } from '../types/mars';

/**
 * Verified tile services only.
 *
 * Every endpoint below was fetched during integration and returned real
 * imagery (HTTP 200 with a JPEG/PNG body and `access-control-allow-origin: *`).
 * Nothing here is a guessed URL. Where a dataset could not be verified, the
 * entry is marked `unavailable` and `unavailableReason` states exactly what was
 * checked — no placeholder imagery is substituted.
 */
export const MARS_LAYERS: MarsLayer[] = [
  {
    id: 'mola-colorshade',
    name: 'MOLA Color Hillshade',
    datasetId: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
    kind: 'elevation',
    status: 'available',
    measurementType: 'derived',
    description:
      'Global colourised topography from the Mars Orbiter Laser Altimeter on Mars Global Surveyor. Colour encodes elevation and shading encodes relief, so basins, volcanoes and canyon walls are readable directly.',
    sourceOrg: 'NASA / JPL · Mars Trek (MOLA investigation, NASA GSFC)',
    source: 'NASA/JPL Mars Trek · MOLA',
    sourceUrl: 'https://trek.nasa.gov/mars/',
    serviceUrl:
      'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml',
    resolution:
      '463 m/px dataset grid (per dataset identifier). Published WMTS pyramid tops out at level 7 = 256 × 256 tiles, ≈ 326 m/px at the equator.',
    coverage:
      'Global. WMTS BoundingBox 180.0000°W – 179.9983°E, 89.9992°S – 90.0000°N.',
    projection:
      'Mars equirectangular, urn:ogc:def:crs:EPSG::104905 (TileMatrixSet default028mm, TopLeftCorner −180 90), 256 px JPEG tiles.',
    period: 'MGS MOLA laser altimetry acquired 1999–2001.',
    limitations:
      'Colour is a rendering of interpolated elevation, not raw measurement values — no elevation can be read off the pixels. MOLA ground tracks are roughly 300 m along-track and 1 km cross-track at the equator, so detail below that scale is interpolation. Vertical accuracy degrades on steep slopes. Trek serves no level beyond 7, so further zoom only upscales the same tiles.',
    tile: {
      urlTemplate:
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
      tileSize: 256,
      minNativeZoom: 1,
      maxNativeZoom: 8,
      zoomOffset: -1,
      tms: false,
      attribution: 'MOLA colour hillshade · NASA/JPL Mars Trek',
      format: 'image/jpeg',
    },
  },
  {
    id: 'mcolor-dem',
    name: 'Mars Colorized DEM',
    datasetId: 'OnMars/MColorDEM (MarsColorDEM)',
    kind: 'elevation',
    status: 'available',
    measurementType: 'derived',
    description:
      'Colourised global digital elevation rendering of Mars published by Esri from NASA/JPL/ESA/DLR/USGS topography. Deeper tile pyramid than Mars Trek, useful when inspecting regional relief at close range.',
    sourceOrg: 'NASA / JPL / ESA / DLR / USGS, published by Esri (ArcGIS OnMars)',
    source: 'NASA/JPL/ESA/DLR/USGS/Esri · ArcGIS OnMars',
    sourceUrl: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/MColorDEM/MapServer',
    serviceUrl: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/MColorDEM/MapServer?f=pjson',
    resolution:
      'Pixel size is not declared in the REST metadata. Pyramid resolution runs from 0.3515625°/px at LOD 0 (≈ 20.8 km/px at the equator) to 2.68e−6°/px at LOD 17 (≈ 0.16 m/px). Real detail is limited by the source mosaic, not by the pyramid.',
    coverage:
      'Global. Service fullExtent −180.0000° – 180.0000° longitude, −90.0000° – 90.0000° latitude.',
    projection:
      'GCS_Mars_2000_Sphere, Esri wkid 104971 (sphere radius 3 396 190 m), 512 px tiles, origin (−180, 90), LOD 0–17.',
    limitations:
      'The service publishes no acquisition dates, no pixel size and no accuracy statement, so the true ground resolution and vertical error of this mosaic are undocumented here. Colour and shading are cartographic rendering, not photographic evidence.',
    tile: {
      urlTemplate:
        'https://astro.arcgis.com/arcgis/rest/services/OnMars/MColorDEM/MapServer/tile/{z}/{y}/{x}',
      tileSize: 512,
      minNativeZoom: 2,
      maxNativeZoom: 19,
      zoomOffset: -2,
      tms: false,
      attribution: 'Mars Colorized DEM · NASA/JPL/ESA/DLR/USGS/Esri',
      format: 'image/jpeg',
    },
  },
  {
    id: 'hirise',
    name: 'HiRISE Mosaic',
    datasetId: 'OnMars/HiRISE',
    kind: 'imagery',
    status: 'available',
    measurementType: 'mosaic',
    description:
      'High Resolution Imaging Science Experiment imagery from Mars Reconnaissance Orbiter, blended into regional footprints. Where a footprint exists it is the highest-resolution optical data in this build.',
    sourceOrg: 'NASA / JPL / University of Arizona (HiRISE team), published by Esri',
    source: 'NASA/JPL/University of Arizona/USGS/Esri',
    sourceUrl: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/HiRISE/MapServer',
    serviceUrl: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/HiRISE/MapServer?f=pjson',
    resolution:
      'Mosaic pixel size is not declared. HiRISE images are acquired at roughly 0.25–0.5 m/px depending on orbit altitude and binning.',
    coverage:
      'Targeted footprints only — no global coverage. The service declares a global fullExtent but serves blank tiles where no footprint exists.',
    projection:
      'GCS_Mars_2000_Sphere, Esri wkid 104971, 512 px tiles, origin (−180, 90), LOD 0–17.',
    limitations:
      'Sparse coverage: most of Mars returns no tile at any zoom, and blank areas are a coverage gap rather than a load failure. The mosaic is a beta blend and geometric offsets of up to a few hundred metres can occur between adjacent footprints. Not usable as a global basemap.',
    tile: {
      urlTemplate: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/HiRISE/MapServer/tile/{z}/{y}/{x}',
      tileSize: 512,
      minNativeZoom: 2,
      maxNativeZoom: 19,
      zoomOffset: -2,
      tms: false,
      attribution: 'HiRISE · NASA/JPL/University of Arizona/USGS/Esri',
      format: 'image/png',
    },
  },
  {
    id: 'ctx',
    name: 'CTX Mosaic',
    datasetId: 'OnMars/CTX',
    kind: 'imagery',
    status: 'available',
    measurementType: 'mosaic',
    description:
      'Context Camera imagery from Mars Reconnaissance Orbiter, blended into regional mosaics. Shows layered terrain, dunes and channel systems at a few metres per pixel.',
    sourceOrg:
      'NASA / JPL / Malin Space Science Systems / Caltech Murray Lab, published by Esri',
    source: 'NASA/JPL/MSSS/Caltech Murray Lab/Esri',
    sourceUrl: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer',
    serviceUrl: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer?f=pjson',
    resolution:
      'Mosaic pixel size is not declared. CTX images are acquired at roughly 6 m/px.',
    coverage:
      'Partial. The service does not publish which areas are filled; blank tiles indicate missing mosaic coverage.',
    projection:
      'GCS_Mars_2000_Sphere, Esri wkid 104971, 512 px tiles, origin (−180, 90), LOD 0–17.',
    limitations:
      'Beta-level mosaic: seams and small geometric offsets are possible between contributing images. Coverage is incomplete, so this layer cannot stand in for a global basemap.',
    tile: {
      urlTemplate: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{y}/{x}',
      tileSize: 512,
      minNativeZoom: 2,
      maxNativeZoom: 19,
      zoomOffset: -2,
      tms: false,
      attribution: 'CTX · NASA/JPL/MSSS/Caltech Murray Lab/Esri',
      format: 'image/png',
    },
  },
  {
    id: 'mola-roughness',
    name: 'MOLA Surface Roughness',
    datasetId: 'MGS MOLA Global Surface Roughness (requested)',
    kind: 'roughness',
    status: 'unavailable',
    measurementType: 'unavailable',
    description:
      'Requested as a companion layer to the MOLA hillshade. Roughness products are used in traverse planning to flag rocky or broken terrain that a rover or suited astronaut cannot cross safely.',
    sourceOrg: 'NASA / GSFC · MOLA investigation',
    source: 'NASA/GSFC MOLA',
    sourceUrl: 'https://trek.nasa.gov/mars/',
    resolution: 'Not available — no verified public tile service was found.',
    coverage: 'Not available.',
    projection: 'Not applicable — no service to project from.',
    limitations:
      'Nothing is rendered for this layer. Route assessments therefore still report roughness as unavailable instead of inventing a value.',
    unavailableReason:
      'No public tile service could be verified. NASA Mars Trek\'s WMTS index returns HTTP 404 for Mars_MGS_MOLA_Roughness_merge_global_463m and for the variants Mars_MGS_MOLA_SurfaceRoughness_merge_global_463m, Mars_MGS_MOLA_Rough_merge_global_463m and Mars_MOLA_Roughness_global_463m. The ArcGIS ImageServer paths of the same names answer HTTP 200 but return only an empty stub ({"description": ""}), not a service definition. The official Trek service directory lists 76 services and contains no roughness layer. No roughness tiles are requested or faked.',
  },
  {
    id: 'themis-infrared',
    name: 'THEMIS Infrared',
    datasetId: 'THEMIS IR (requested)',
    kind: 'thermal',
    status: 'unavailable',
    measurementType: 'unavailable',
    description:
      'Thermal Emission Imaging System infrared observations, used to characterise surface materials, dust cover and thermophysical properties.',
    sourceOrg: 'NASA / JPL / Arizona State University (THEMIS)',
    source: 'NASA/JPL/ASU THEMIS',
    sourceUrl: 'https://trek.nasa.gov/mars/',
    limitations: 'Not integrated, so thermal properties cannot be used in route assessment.',
    unavailableReason:
      'No verified public tile endpoint for a THEMIS infrared mosaic was located during this integration. The layer is declared as unavailable rather than filled with placeholder imagery.',
  },
  {
    id: 'tes-thermal-inertia',
    name: 'TES Thermal Inertia',
    datasetId: 'TES thermal inertia (requested)',
    kind: 'thermal',
    status: 'unavailable',
    measurementType: 'unavailable',
    description:
      'Thermal Emission Spectrometer thermal-inertia mapping describing how quickly surface material heats and cools, a proxy for dust cover and induration.',
    sourceOrg: 'NASA / JPL / Arizona State University (TES)',
    source: 'NASA/JPL/ASU TES',
    sourceUrl: 'https://trek.nasa.gov/mars/',
    limitations: 'Not integrated, so thermal inertia cannot be used in route assessment.',
    unavailableReason:
      'No verified public tile endpoint for a TES thermal-inertia mosaic was located during this integration. The layer is declared as unavailable rather than filled with placeholder imagery.',
  },
  {
    id: 'isro-mcc',
    name: 'ISRO Mars Colour Camera (MCC)',
    datasetId: 'ISRO MOM / Mangalyaan — Mars Colour Camera',
    kind: 'imagery',
    status: 'unavailable',
    measurementType: 'unavailable',
    description:
      'True-colour imagery of Mars from the Mars Colour Camera on ISRO\u2019s Mars Orbiter Mission (Mangalyaan). MCC acquired global and regional colour images of the Martian surface during the 2014–2022 mission lifetime.',
    sourceOrg: 'Indian Space Research Organisation (ISRO) · Mars Orbiter Mission (MOM)',
    source: 'ISRO / ISSDC · Mars Orbiter Mission',
    sourceUrl: 'https://www.isro.gov.in/MarsOrbiterMissionSpacecraft.html',
    resolution: 'Not available as a tile service — MCC images are distributed as downloadable products.',
    coverage: 'Global and regional colour imaging acquired during the MOM mission (2014–2022).',
    projection: 'Not applicable — no verified public tile service was found.',
    limitations:
      'Not integrated, so ISRO MCC imagery cannot be displayed in this build. MCC data products are available for download from the ISRO Science Data Archive (ISSDC) but no public WMTS/REST tile endpoint was verified.',
    unavailableReason:
      'No public tile service could be verified. ISRO\u2019s Mars Colour Camera data is distributed as downloadable image products through the Indian Space Science Data Centre (ISSDC, https://www.issdc.gov.in/), not as a WMTS/REST tile pyramid. No tile endpoint returning HTTP 200 with image bodies and CORS headers was located for MCC or for any other ISRO Mars product (TIS, MSM, MENCA, LAP). The layer is declared as unavailable rather than filled with placeholder imagery.',
  },
];

export const DEFAULT_LAYER_ID: LayerId = 'mola-colorshade';

export const AVAILABLE_LAYERS: MarsLayer[] = MARS_LAYERS.filter(
  (layer) => layer.status === 'available',
);

export function layerById(id: LayerId): MarsLayer | undefined {
  return MARS_LAYERS.find((layer) => layer.id === id);
}

export function createInitialLayerStatus(): LayerLoadStatusMap {
  return MARS_LAYERS.reduce((acc, layer) => {
    acc[layer.id] = { state: 'idle', tilesLoaded: 0, tilesFailed: 0 };
    return acc;
  }, {} as LayerLoadStatusMap);
}

export const IDLE_LAYER_STATUS: LayerLoadStatus = {
  state: 'idle',
  tilesLoaded: 0,
  tilesFailed: 0,
};
