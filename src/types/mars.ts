export interface LatLng {
  lat: number;
  lng: number;
}

export type LayerId =
  | 'mola-colorshade'
  | 'mola-roughness'
  | 'mcolor-dem'
  | 'hirise'
  | 'ctx'
  | 'themis-infrared'
  | 'tes-thermal-inertia'
  | 'isro-mcc';

export type LayerStatus = 'available' | 'unavailable';

export type LayerKind = 'elevation' | 'imagery' | 'thermal' | 'roughness';

/**
 * How the layer relates to measurement. Used to keep derived or absent data
 * visually distinct from direct instrument measurements.
 */
export type MeasurementType =
  | 'measured'
  | 'derived'
  | 'mosaic'
  | 'unavailable';

/**
 * Tile pyramid description taken from the published service metadata, not
 * guessed. `zoomOffset` converts a Leaflet map zoom into the service's own
 * tile matrix index (see marsTiles.ts for the derivation).
 */
export interface MarsTileConfig {
  urlTemplate: string;
  tileSize: number;
  minNativeZoom: number;
  maxNativeZoom: number;
  zoomOffset: number;
  tms: boolean;
  attribution: string;
  format: string;
}

export interface MarsLayer {
  id: LayerId;
  name: string;
  datasetId: string;
  kind: LayerKind;
  status: LayerStatus;
  measurementType: MeasurementType;
  description: string;
  /** Organisation that produced and publishes the dataset. */
  sourceOrg: string;
  /** Short attribution line usable inside the map. */
  source: string;
  sourceUrl?: string;
  /** Machine endpoint used by this build (WMTS capabilities or REST service). */
  serviceUrl?: string;
  resolution?: string;
  coverage?: string;
  projection?: string;
  period?: string;
  limitations?: string;
  /** Factual reason a layer is not rendered. Never a placeholder substitute. */
  unavailableReason?: string;
  tile?: MarsTileConfig;
}

export type LayerLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface LayerLoadStatus {
  state: LayerLoadState;
  tilesLoaded: number;
  tilesFailed: number;
  message?: string;
}

export type TargetType =
  | 'ancient-water'
  | 'delta'
  | 'crater'
  | 'terrain'
  | 'rover';

export interface ScienceTarget {
  id: string;
  name: string;
  type: TargetType;
  regionId: string;
  lat: number;
  lng: number;
  summary: string;
  source: string;
  sourceUrl?: string;
  imageryAvailable: boolean;
  elevationM?: number | null;
  whyInteresting: string;
  limitations: string;
}

export type RouteAssessmentLevel = 'lower' | 'moderate' | 'higher' | 'insufficient';

export interface RouteFactor {
  id: string;
  label: string;
  value: number | null;
  available: boolean;
  unit: string;
  weight: number;
}

export interface RouteAssessment {
  distanceM: number;
  durationS: number;
  elevationChangeM: number | null;
  maxSlopePercent: number | null;
  factors: RouteFactor[];
  level: RouteAssessmentLevel;
  explanation: string;
}

export interface PlannedRoute {
  id: string;
  name: string;
  points: LatLng[];
  distanceM: number;
  durationS: number;
  createdAt: string;
}

export type MissionSection = 'explore' | 'route' | 'science' | 'about';
export type AppView = 'landing' | 'mission';

/** Which end of the traverse a map pick will set. */
export type RouteSlot = 'start' | 'end';

export interface Selection {
  kind: 'target' | 'point';
  id?: string;
  name: string;
  lat: number;
  lng: number;
}

export type LayerLoadStatusMap = Record<LayerId, LayerLoadStatus>;
