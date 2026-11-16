import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type {
  AppView,
  LatLng,
  LayerId,
  LayerLoadStatus,
  LayerLoadStatusMap,
  MissionSection,
  PlannedRoute,
  RouteAssessment,
  RouteResult,
  RouteSlot,
  ScienceTarget,
} from '../types/mars';
import { DEFAULT_LAYER_ID, createInitialLayerStatus } from '../data/layers';
import { DEFAULT_ROUTE_POINTS } from '../data/routeDefaults';
import { computeRouteAssessment } from '../services/routing/routeService';
import { routeDistanceM, durationSecondsFromDistance } from '../utils/geo';

interface MissionContextValue {
  view: AppView;
  section: MissionSection;
  setView: (view: AppView) => void;
  setSection: (section: MissionSection) => void;
  missionPhase: 'boot' | 'ready';
  setMissionPhase: (phase: 'boot' | 'ready') => void;
  /** Exactly one basemap is displayed at a time. */
  activeLayerId: LayerId;
  setActiveLayer: (layerId: LayerId) => void;
  layerStatus: LayerLoadStatusMap;
  setLayerStatus: (layerId: LayerId, next: LayerLoadStatus) => void;
  selected: { kind: 'target' | 'point'; id?: string; name: string; lat: number; lng: number } | null;
  selectTarget: (target: ScienceTarget) => void;
  selectPoint: (lat: number, lng: number, name?: string) => void;
  clearSelection: () => void;
  regionId: string;
  setRegionId: (id: string) => void;
  /** Live traverse endpoints, editable by clicking the map. */
  routeStart: LatLng;
  routeEnd: LatLng;
  setRoutePoint: (slot: RouteSlot, point: LatLng) => void;
  /** Terrain-aware route result (A* pathfinding). */
  terrainRoute: RouteResult | null;
  setTerrainRoute: (route: RouteResult | null) => void;
  resetRoutePoint: (slot: RouteSlot) => void;
  /** Non-null while the map is waiting for a click that sets that endpoint. */
  pickSlot: RouteSlot | null;
  setPickSlot: (slot: RouteSlot | null) => void;
  route: PlannedRoute | null;
  setRoute: (route: PlannedRoute | null) => void;
  savedRoutes: PlannedRoute[];
  saveRoute: (route: PlannedRoute) => void;
  deleteRoute: (id: string) => void;
  assessment: RouteAssessment | null;
  runAssessment: (points: LatLng[]) => RouteAssessment;
  lastRoutePoints: LatLng[];
  setLastRoutePoints: (points: LatLng[]) => void;
  reportOpen: boolean;
  setReportOpen: (open: boolean) => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('landing');
  const [section, setSection] = useState<MissionSection>('explore');
  const [missionPhase, setMissionPhase] = useState<'boot' | 'ready'>('ready');
  const [activeLayerId, setActiveLayerId] = useState<LayerId>(DEFAULT_LAYER_ID);
  const [layerStatus, setLayerStatusMap] = useState<LayerLoadStatusMap>(createInitialLayerStatus);
  const [selected, setSelected] = useState<MissionContextValue['selected']>(null);
  const [route, setRoute] = useState<PlannedRoute | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<PlannedRoute[]>(() => loadSavedRoutes());
  const [assessment, setAssessment] = useState<RouteAssessment | null>(null);
  const [lastRoutePoints, setLastRoutePoints] = useState<LatLng[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [regionId, setRegionId] = useState('jezero');
  const [routePoints, setRoutePoints] = useState<Record<RouteSlot, LatLng>>(DEFAULT_ROUTE_POINTS);
  const [terrainRoute, setTerrainRoute] = useState<RouteResult | null>(null);
  const [pickSlot, setPickSlot] = useState<RouteSlot | null>(null);

  const setRoutePoint = useCallback((slot: RouteSlot, point: LatLng) => {
    setRoutePoints((prev) => ({ ...prev, [slot]: { lat: point.lat, lng: point.lng } }));
  }, []);

  const resetRoutePoint = useCallback((slot: RouteSlot) => {
    setRoutePoints((prev) => ({ ...prev, [slot]: DEFAULT_ROUTE_POINTS[slot] }));
  }, []);

  const setActiveLayer = useCallback((layerId: LayerId) => {
    setActiveLayerId(layerId);
  }, []);

  const setLayerStatus = useCallback((layerId: LayerId, next: LayerLoadStatus) => {
    setLayerStatusMap((prev) => {
      const current = prev[layerId];
      if (
        current &&
        current.state === next.state &&
        current.tilesLoaded === next.tilesLoaded &&
        current.tilesFailed === next.tilesFailed &&
        current.message === next.message
      ) {
        // Avoid a re-render storm: Leaflet fires this per loaded tile.
        return prev;
      }
      return { ...prev, [layerId]: next };
    });
  }, []);

  const selectTarget = useCallback((target: ScienceTarget) => {
    setSelected({ kind: 'target', id: target.id, name: target.name, lat: target.lat, lng: target.lng });
  }, []);

  const selectPoint = useCallback((lat: number, lng: number, name?: string) => {
    setSelected({ kind: 'point', name: name ?? 'Exploration waypoint', lat, lng });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const runAssessment = useCallback((points: LatLng[]) => {
    const result = computeRouteAssessment(points);
    setAssessment(result);
    return result;
  }, []);

  const saveRoute = useCallback((newRoute: PlannedRoute) => {
    setSavedRoutes((prev) => {
      const next = [newRoute, ...prev.filter((r) => r.id !== newRoute.id)].slice(0, 6);
      try {
        window.localStorage.setItem('ares-path:saved-routes', JSON.stringify(next));
      } catch {
        // storage unavailable; keep in-memory only
      }
      return next;
    });
  }, []);

  const deleteRoute = useCallback((id: string) => {
    setSavedRoutes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try {
        window.localStorage.setItem('ares-path:saved-routes', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<MissionContextValue>(
    () => ({
      view,
      section,
      setView,
      setSection,
      missionPhase,
      setMissionPhase,
      activeLayerId,
      setActiveLayer,
      layerStatus,
      setLayerStatus,
      selected,
      selectTarget,
      selectPoint,
      clearSelection,
      route,
      setRoute,
      savedRoutes,
      saveRoute,
      deleteRoute,
      assessment,
      runAssessment,
      lastRoutePoints,
      setLastRoutePoints,
      reportOpen,
      setReportOpen,
      regionId,
      setRegionId,
      routeStart: routePoints.start,
      routeEnd: routePoints.end,
      setRoutePoint,
      resetRoutePoint,
      pickSlot,
      setPickSlot,
      terrainRoute,
      setTerrainRoute,
    }),
    [
      view,
      section,
      missionPhase,
      activeLayerId,
      setActiveLayer,
      layerStatus,
      setLayerStatus,
      selected,
      selectTarget,
      selectPoint,
      clearSelection,
      route,
      savedRoutes,
      saveRoute,
      deleteRoute,
      assessment,
      runAssessment,
      lastRoutePoints,
      setLastRoutePoints,
      reportOpen,
      setReportOpen,
      regionId,
      setRegionId,
      routePoints,
      setRoutePoint,
      resetRoutePoint,
      pickSlot,
      terrainRoute,
      setTerrainRoute,
    ],
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMission must be used within MissionProvider');
  return ctx;
}

export function loadSavedRoutes(): PlannedRoute[] {
  try {
    const raw = window.localStorage.getItem('ares-path:saved-routes');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlannedRoute[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedRoutes(routes: PlannedRoute[]) {
  try {
    window.localStorage.setItem('ares-path:saved-routes', JSON.stringify(routes));
  } catch {
    // ignore
  }
}

export function routeToPlannedRoute(points: { lat: number; lng: number }[], name?: string): PlannedRoute {
  const list = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  return {
    id: `route-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
    name: name ?? 'Untitled traverse',
    points: list,
    distanceM: routeDistanceM(list),
    durationS: durationSecondsFromDistance(routeDistanceM(list), 0.2),
    createdAt: new Date().toISOString(),
  };
}
