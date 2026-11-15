import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARS_CRS_VALUE } from '../utils/marsCRS';
import { MARS_LAYERS, layerById } from '../data/layers';
import { SCIENTIFIC_TARGETS, REGIONS } from '../data/scientificTargets';
import { useMission } from '../context/MissionContext';
import type { LatLng, LayerLoadStatus, RouteSlot } from '../types/mars';

const MIN_MAP_ZOOM = 0;
const MAX_MAP_ZOOM = 14;
const TARGET_ZOOM = 7;

const MEASUREMENT_BADGE: Record<string, { label: string; className: string }> = {
  measured: { label: 'MEASURED', className: 'text-ap-green' },
  derived: { label: 'DERIVED FROM MEASUREMENTS', className: 'text-ap-ice' },
  mosaic: { label: 'MOSAIC · PARTIAL COVERAGE', className: 'text-ap-gold' },
  unavailable: { label: 'UNAVAILABLE', className: 'text-ap-gold' },
};

export default function MarsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);
  const endMarkerRef = useRef<L.CircleMarker | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeStartMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeEndMarkerRef = useRef<L.CircleMarker | null>(null);
  const pickSlotRef = useRef<RouteSlot | null>(null);
  const routeRef = useRef<{ points: LatLng[] } | null>(null);
  const selectedRef = useRef<{ lat: number; lng: number; name: string; kind: string; id?: string } | null>(null);
  const [mapView, setMapView] = useState({ lat: 18.44, lng: 77.45 });
  const [mapZoom, setMapZoom] = useState(3);
  const [retryToken, setRetryToken] = useState(0);

  const activeLayerId = useMission().activeLayerId;
  const layerStatus = useMission().layerStatus;
  const setLayerStatus = useMission().setLayerStatus;
  const selected = useMission().selected;
  const route = useMission().route;
  const selectPoint = useMission().selectPoint;
  const missionPhase = useMission().missionPhase;
  const regionId = useMission().regionId;
  const section = useMission().section;
  const routeStart = useMission().routeStart;
  const routeEnd = useMission().routeEnd;
  const pickSlot = useMission().pickSlot;
  const setPickSlot = useMission().setPickSlot;
  const setRoutePoint = useMission().setRoutePoint;

  const activeLayer = MARS_LAYERS.find((layer) => layer.id === activeLayerId) ?? MARS_LAYERS[0];
  const status: LayerLoadStatus =
    layerStatus[activeLayerId] ?? { state: 'idle', tilesLoaded: 0, tilesFailed: 0 };
  const badge = MEASUREMENT_BADGE[activeLayer.measurementType] ?? MEASUREMENT_BADGE.measured;

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    pickSlotRef.current = pickSlot;
  }, [pickSlot]);

  useEffect(() => {
    if (!pickSlot) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickSlot(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pickSlot, setPickSlot]);

  /**
   * Leaflet adds its own classes to the container element, so React must never
   * own that className after mount: rewriting it strips `leaflet-container`
   * and the map collapses. Toggle a marker class imperatively instead.
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.toggle('ap-picking', Boolean(pickSlot));
  }, [pickSlot]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      crs: MARS_CRS_VALUE,
      center: L.latLng(18.44, 77.45),
      zoom: 3,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: MAX_MAP_ZOOM,
      zoomSnap: 0,
      zoomControl: false,
      attributionControl: false,
      // Keep the viewport on Mars: without bounds, a drag can push the centre
      // past the poles and several world-widths east, where there is nothing
      // to show and the coordinate readout becomes meaningless.
      maxBounds: L.latLngBounds([-90, -180], [90, 180]),
      maxBoundsViscosity: 1.0,
    });
    mapRef.current = map;

    /**
     * The equirectangular world is 256·2^z px wide and half as tall. Below the
     * zoom where it covers the viewport there is empty space around the planet
     * and `maxBounds` pulls every drag back to the middle, which reads as "the
     * map is stuck in the centre". Keep the floor at world-covers-viewport.
     */
    const applyMinZoom = () => {
      const size = map.getSize();
      if (!size.x || !size.y) return;
      const fit = Math.max(size.x / 256, size.y / 128);
      const min = Math.max(MIN_MAP_ZOOM, Math.ceil(Math.log2(fit) * 100) / 100);
      if (Math.abs(map.getMinZoom() - min) > 0.001) map.setMinZoom(min);
      if (map.getZoom() < min) map.setZoom(min, { animate: false });
    };
    applyMinZoom();

    map.on('moveend', () => {
      const c = map.getCenter();
      setMapView({ lat: c.lat, lng: c.lng });
      setMapZoom(map.getZoom());
    });

    map.on('click', (e) => {
      const slot = pickSlotRef.current;
      if (slot) {
        setRoutePoint(slot, { lat: e.latlng.lat, lng: e.latlng.lng });
        setPickSlot(null);
        selectPoint(
          e.latlng.lat,
          e.latlng.lng,
          slot === 'start' ? 'EVA start point' : 'EVA destination',
        );
        return;
      }
      selectPoint(e.latlng.lat, e.latlng.lng, 'Exploration waypoint');
    });

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      applyMinZoom();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * One basemap at a time. Tile events are counted so the UI can distinguish
   * "loaded", "partly missing coverage" and "service unreachable" instead of
   * showing an empty canvas as if it were a map.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {
        // ignore
      }
      tileLayerRef.current = null;
    }

    const layer = layerById(activeLayerId);
    if (!layer || !layer.tile) {
      setLayerStatus(activeLayerId, {
        state: 'error',
        tilesLoaded: 0,
        tilesFailed: 0,
        message:
          layer?.unavailableReason ??
          'No verified tile service is configured for this dataset.',
      });
      return;
    }

    const counts = { loaded: 0, failed: 0 };
    setLayerStatus(activeLayerId, {
      state: 'loading',
      tilesLoaded: 0,
      tilesFailed: 0,
      message: `Requesting ${layer.datasetId} tiles…`,
    });

    const tileLayer = L.tileLayer(layer.tile.urlTemplate, {
      tileSize: layer.tile.tileSize,
      minZoom: MIN_MAP_ZOOM,
      maxZoom: MAX_MAP_ZOOM,
      minNativeZoom: layer.tile.minNativeZoom,
      maxNativeZoom: layer.tile.maxNativeZoom,
      zoomOffset: layer.tile.zoomOffset,
      tms: layer.tile.tms,
      attribution: layer.tile.attribution,
      crossOrigin: 'anonymous',
      detectRetina: false,
      updateWhenZooming: false,
      keepBuffer: 2,
    });

    const handleTileLoad = () => {
      counts.loaded += 1;
    };
    const handleTileError = () => {
      counts.failed += 1;
    };
    const handleLoad = () => {
      const host = (() => {
        try {
          return new URL(layer.tile!.urlTemplate).host;
        } catch {
          return 'the tile service';
        }
      })();
      if (counts.loaded === 0) {
        setLayerStatus(activeLayerId, {
          state: 'error',
          tilesLoaded: 0,
          tilesFailed: counts.failed,
          message: `No tiles could be loaded from ${host}. The service may be offline, blocked, or unreachable from this network.`,
        });
        return;
      }
      setLayerStatus(activeLayerId, {
        state: 'ready',
        tilesLoaded: counts.loaded,
        tilesFailed: counts.failed,
        message:
          counts.failed > 0
            ? `${counts.failed} tile(s) had no data at this view — that is a coverage gap in the source product, not a projection error.`
            : undefined,
      });
    };

    tileLayer.on('tileload', handleTileLoad);
    tileLayer.on('tileerror', handleTileError);
    tileLayer.on('load', handleLoad);

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    return () => {
      // Only unbind our own counters. `tileLayer.off()` with no arguments also
      // removes Leaflet's internal `once('remove', …)` teardown listener, which
      // leaves map handlers bound to a layer whose `_map` is already null —
      // the next map move then throws in GridLayer._resetView and no tiles load.
      tileLayer.off('tileload', handleTileLoad);
      tileLayer.off('tileerror', handleTileError);
      tileLayer.off('load', handleLoad);
      try {
        map.removeLayer(tileLayer);
      } catch {
        // ignore
      }
      if (tileLayerRef.current === tileLayer) {
        tileLayerRef.current = null;
      }
    };
  }, [activeLayerId, retryToken, setLayerStatus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clearMarkers = () => {
      if (startMarkerRef.current) {
        map.removeLayer(startMarkerRef.current);
        startMarkerRef.current = null;
      }
      if (endMarkerRef.current) {
        map.removeLayer(endMarkerRef.current);
        endMarkerRef.current = null;
      }
      if (selectedMarkerRef.current) {
        map.removeLayer(selectedMarkerRef.current);
        selectedMarkerRef.current = null;
      }
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
    };

    const drawRoute = () => {
      const current = routeRef.current;
      clearMarkers();
      if (current && current.points.length >= 2) {
        const latlngs: L.LatLngExpression[] = current.points.map((p) => L.latLng(p.lat, p.lng));
        const polyline = L.polyline(latlngs, {
          color: '#e87542',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          dashArray: '1 14',
        });
        polyline.addTo(map);
        routeLayerRef.current = polyline;
      }
    };

    const updateSelectedMarker = () => {
      const sel = selectedRef.current;
      if (selectedMarkerRef.current) {
        map.removeLayer(selectedMarkerRef.current);
        selectedMarkerRef.current = null;
      }
      if (sel) {
        const marker = L.circleMarker(L.latLng(sel.lat, sel.lng), {
          radius: 7,
          color: '#73c7e8',
          weight: 3,
          fillColor: '#73c7e8',
          fillOpacity: 0.95,
        });
        marker.addTo(map);
        selectedMarkerRef.current = marker;
      }
    };

    drawRoute();
    updateSelectedMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, selected]);

  /**
   * Endpoint pins for the traverse. Shown in the route-planner section so the
   * two points being edited are visible even before a route is calculated.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeStartMarkerRef.current) {
      map.removeLayer(routeStartMarkerRef.current);
      routeStartMarkerRef.current = null;
    }
    if (routeEndMarkerRef.current) {
      map.removeLayer(routeEndMarkerRef.current);
      routeEndMarkerRef.current = null;
    }
    if (section !== 'route') return;

    routeStartMarkerRef.current = L.circleMarker(L.latLng(routeStart.lat, routeStart.lng), {
      radius: 8,
      color: '#e87542',
      weight: 3,
      fillColor: '#e87542',
      fillOpacity: 0.85,
    })
      .bindTooltip('EVA START', { direction: 'top', offset: L.point(0, -6) })
      .addTo(map);
    routeStartMarkerRef.current.bringToFront();

    routeEndMarkerRef.current = L.circleMarker(L.latLng(routeEnd.lat, routeEnd.lng), {
      radius: 8,
      color: '#73c7e8',
      weight: 3,
      fillColor: '#73c7e8',
      fillOpacity: 0.85,
    })
      .bindTooltip('EVA DESTINATION', { direction: 'top', offset: L.point(0, -6) })
      .addTo(map);
    routeEndMarkerRef.current.bringToFront();
  }, [routeStart, routeEnd, section]);

  const focusMap = (map: L.Map, center: L.LatLng, zoom: number) => {
    const start = map.getCenter();
    const startZoom = map.getZoom();
    map.flyTo(center, zoom, { duration: 1.4 });
    // Browser animation frames are throttled when the window is unfocused, which
    // would leave the viewport stranded where it started. Snap if nothing moved.
    window.setTimeout(() => {
      if (mapRef.current !== map) return;
      const current = map.getCenter();
      const moved =
        Math.abs(current.lat - start.lat) > 0.01 ||
        Math.abs(current.lng - start.lng) > 0.01 ||
        Math.abs(map.getZoom() - startZoom) > 0.01;
      if (!moved) map.setView(center, zoom, { animate: false });
    }, 900);
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const targetId = selectedRef.current?.kind === 'target' ? selectedRef.current.id : undefined;
    const target = targetId ? SCIENTIFIC_TARGETS.find((t) => t.id === targetId) : undefined;
    if (target) {
      focusMap(map, L.latLng(target.lat, target.lng), Math.min(TARGET_ZOOM, MAX_MAP_ZOOM));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const region = REGIONS.find((r) => r.id === regionId);
    if (!region) return;
    const bounds = L.latLngBounds([
      L.latLng(region.bounds.minLat, region.bounds.minLng),
      L.latLng(region.bounds.maxLat, region.bounds.maxLng),
    ]);
    const zoom = Math.min(6, map.getBoundsZoom(bounds, false, L.point(120, 180)));
    focusMap(map, bounds.getCenter(), zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  const showError = status.state === 'error';

  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + delta, { animate: true });
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    focusMap(map, L.latLng(18.44, 77.45), Math.max(map.getMinZoom(), 4));
  };

  return (
    <div className="relative isolate h-full w-full">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full bg-ap-bg"
        data-testid="mars-map"
      />
      {missionPhase === 'boot' ? (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-ap-bg/85 backdrop-blur-sm">
          <div className="ap-animate-slide-up text-center">
            <div className="ap-font-display text-2xl tracking-[0.4em] text-ap-ice">ARES PATH</div>
            <div className="mt-4 font-mono text-xs tracking-[0.3em] text-ap-text-dim">MISSION INITIALIZATION</div>
            <div className="mt-6 h-1 w-64 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 animate-[ap-slide-up_1.2s_ease_infinite] rounded-full bg-ap-orange" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[900] flex items-start justify-between gap-2">
        <div className="min-w-0 rounded border border-ap-border bg-ap-panel/80 px-3 py-2 font-mono text-[10px] tracking-wider text-ap-text-dim backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-ap-green" />
            <span className="truncate" data-testid="active-layer-badge">
              {activeLayer.name.toUpperCase()}
            </span>
          </div>
          <div className="mt-1 hidden truncate text-[9px] text-ap-text-faint sm:block">
            MARS ORBITAL TERMINAL 07 · NASA TILE BASEMAP
          </div>
        </div>

        <div className="flex max-w-[45%] shrink-0 flex-col items-end gap-2">
          <span
            className="rounded border border-ap-border bg-ap-panel/80 px-2 py-1 text-right font-mono text-[9px] tracking-wider text-ap-text-dim backdrop-blur"
            data-testid="measurement-badge"
          >
            {badge.label}
          </span>
          <span className="rounded border border-ap-border bg-ap-panel/80 px-2 py-1 text-right font-mono text-[9px] tracking-wider text-ap-text-faint backdrop-blur">
            {status.state === 'loading'
              ? 'TILES: LOADING'
              : status.state === 'ready'
                ? `TILES: ${status.tilesLoaded} OK${status.tilesFailed ? ` / ${status.tilesFailed} MISSING` : ''}`
                : status.state === 'error'
                  ? 'TILES: UNAVAILABLE'
                  : 'TILES: IDLE'}
            <div className="mt-0.5 whitespace-nowrap text-[8px] text-ap-text-faint">
              Z {mapZoom.toFixed(1)} · {mapView.lat.toFixed(2)}°N {mapView.lng.toFixed(2)}°E
            </div>
          </span>
        </div>
      </div>

      <div
        className="absolute right-3 top-1/2 z-[900] flex -translate-y-1/2 flex-col overflow-hidden rounded border border-ap-border bg-ap-panel/85 shadow-lg backdrop-blur"
        data-testid="map-zoom-controls"
      >
        <button
          type="button"
          onClick={() => zoomBy(1)}
          aria-label="Zoom in"
          title="Zoom in"
          data-testid="zoom-in"
          className="flex h-9 w-9 items-center justify-center border-b border-ap-border font-mono text-base leading-none text-ap-text-dim transition-colors hover:bg-ap-panel hover:text-ap-ice"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          aria-label="Zoom out"
          title="Zoom out"
          data-testid="zoom-out"
          className="flex h-9 w-9 items-center justify-center border-b border-ap-border font-mono text-base leading-none text-ap-text-dim transition-colors hover:bg-ap-panel hover:text-ap-ice"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset view to Jezero Crater"
          title="Reset view"
          data-testid="zoom-reset"
          className="flex h-9 w-9 items-center justify-center font-mono text-[13px] leading-none text-ap-text-dim transition-colors hover:bg-ap-panel hover:text-ap-ice"
        >
          ⟲
        </button>
      </div>

      {pickSlot ? (
        <div
          className="pointer-events-auto absolute left-1/2 top-[4.5rem] z-[950] flex -translate-x-1/2 items-center gap-3 rounded border border-ap-orange/60 bg-ap-panel/95 px-3 py-2 shadow-lg backdrop-blur lg:top-3"
          data-testid="pick-banner"
          role="status"
        >
          <span className="whitespace-nowrap font-mono text-[9px] tracking-[0.18em] text-ap-orange">
            PICKING {pickSlot === 'start' ? 'START' : 'DESTINATION'} · CLICK THE MAP
          </span>
          <button
            type="button"
            onClick={() => setPickSlot(null)}
            className="rounded border border-ap-border bg-ap-bg/70 px-2 py-1 font-mono text-[8px] tracking-[0.18em] text-ap-text-dim"
          >
            ESC / CANCEL
          </button>
        </div>
      ) : null}

      {showError ? (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-ap-bg/70 p-6 backdrop-blur-[2px]">
          <div
            className="pointer-events-auto max-w-md rounded border border-ap-gold/50 bg-ap-panel/95 p-5 text-center"
            data-testid="basemap-error"
          >
            <div className="font-mono text-[10px] tracking-[0.3em] text-ap-gold">BASEMAP UNAVAILABLE</div>
            <div className="mt-2 ap-font-display text-sm tracking-wide text-ap-text">{activeLayer.name}</div>
            <p className="mt-3 text-[11px] leading-relaxed text-ap-text-dim">{status.message}</p>
            <p className="mt-2 font-mono text-[9px] leading-relaxed text-ap-text-faint">
              Nothing is drawn in place of the missing tiles, so no invented terrain is shown.
            </p>
            {activeLayer.serviceUrl ? (
              <p className="mt-2 break-all font-mono text-[8px] leading-relaxed text-ap-text-faint">
                {activeLayer.serviceUrl}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setRetryToken((n) => n + 1)}
              className="mt-4 rounded border border-ap-orange/60 bg-ap-orange/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-ap-orange"
            >
              RETRY TILE SERVICE
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-16 right-3 z-[900] max-w-[60%] truncate text-right font-mono text-[8px] tracking-wider text-ap-text-faint">
        {activeLayer.tile?.attribution}
      </div>
    </div>
  );
}
