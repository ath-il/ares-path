import { useEffect, useMemo, useState } from 'react';
import { SCIENTIFIC_TARGETS } from '../data/scientificTargets';
import { DEFAULT_ROUTE_POINTS } from '../data/routeDefaults';
import TerrainRoutePlanner from './TerrainRoutePlanner';
import { useMission } from '../context/MissionContext';
import { formatCoordinate, formatDistanceKm, formatDurationHuman } from '../utils/format';
import { angularSeparationDeg, estimatedTraversalEnergyKJ, greatCircleWaypoints, haversineDistanceM } from '../utils/geo';
import { buildTerrainGrid } from '../services/terrain/terrainGrid';
import { astarRoute } from '../services/routing/astar';
import { computeRouteAssessment } from '../services/routing/routeService';
import type { LatLng, RouteMode, RouteSlot } from '../types/mars';

/** Name a point after a published target when the coordinates match exactly. */
function labelForPoint(point: LatLng): string {
  const target = SCIENTIFIC_TARGETS.find(
    (t) => Math.abs(t.lat - point.lat) < 1e-6 && Math.abs(t.lng - point.lng) < 1e-6,
  );
  return target ? target.name : 'Custom point';
}

function isDefaultPoint(point: LatLng, slot: RouteSlot): boolean {
  const preset = DEFAULT_ROUTE_POINTS[slot];
  return Math.abs(preset.lat - point.lat) < 1e-6 && Math.abs(preset.lng - point.lng) < 1e-6;
}

export default function RoutePlannerPanel() {
  const {
    route,
    setRoute,
    runAssessment,
    saveRoute,
    deleteRoute,
    setReportOpen,
    setRoutePoint,
    routeStart,
    routeEnd,
    pickSlot,
    setPickSlot,
    resetRoutePoint,
    savedRoutes,
    terrainRoute,
    setTerrainRoute,
  } = useMission();

  const plannedRoute = route;

  const [terrainMode, setTerrainMode] = useState<RouteMode>('rover');
  const [terrainMaxSlope, setTerrainMaxSlope] = useState(25);
  const [terrainLoading, setTerrainLoading] = useState(false);
  const [terrainError, setTerrainError] = useState<string | null>(null);

  const assessment = useMemo(
    () => (plannedRoute && plannedRoute.points.length >= 2 ? computeRouteAssessment(plannedRoute.points) : null),
    [plannedRoute],
  );

  const [showWaypoints, setShowWaypoints] = useState(false);

  const waypoints = useMemo(() => {
    if (!plannedRoute || plannedRoute.points.length < 2) return [];
    return greatCircleWaypoints(plannedRoute.points[0], plannedRoute.points[plannedRoute.points.length - 1], 6);
  }, [plannedRoute]);

  const energyKJ = useMemo(() => {
    if (!plannedRoute) return 0;
    return estimatedTraversalEnergyKJ(plannedRoute.distanceM, 0.2);
  }, [plannedRoute]);

  const angularSep = useMemo(() => {
    if (!plannedRoute || plannedRoute.points.length < 2) return 0;
    return angularSeparationDeg(plannedRoute.points[0], plannedRoute.points[plannedRoute.points.length - 1]);
  }, [plannedRoute]);

  // Publish the assessment to mission state after render (never during render).
  useEffect(() => {
    if (plannedRoute && plannedRoute.points.length >= 2) {
      runAssessment(plannedRoute.points);
    }
  }, [plannedRoute, runAssessment]);

  const startLabel = labelForPoint(routeStart);
  const endLabel = labelForPoint(routeEnd);
  const previewDistanceM = haversineDistanceM(routeStart, routeEnd);

  const handleSetRoute = async () => {
    const points = [routeStart, routeEnd];
    const distanceM = haversineDistanceM(points[0], points[1]);
    setRoute({
      id: `route-${Date.now()}`,
      name: `${startLabel} → ${endLabel}`,
      points,
      distanceM,
      durationS: distanceM / 0.2,
      createdAt: new Date().toISOString(),
    });

    // Also calculate terrain route
    setTerrainLoading(true);
    setTerrainError(null);
    try {
      const distKm = distanceM / 1000;
      let gridCells = 20;
      let cellSizeM = 500;
      if (distKm > 50) {
        gridCells = 25;
        cellSizeM = Math.ceil((distKm * 1000) / (gridCells - 1));
      }
      if (distKm > 100) {
        gridCells = 30;
        cellSizeM = Math.ceil((distKm * 1000) / (gridCells - 1));
      }
      const grid = await buildTerrainGrid(
        (routeStart.lat + routeEnd.lat) / 2,
        (routeStart.lng + routeEnd.lng) / 2,
        gridCells,
        cellSizeM,
      );
      const result = astarRoute(grid, routeStart.lat, routeStart.lng, routeEnd.lat, routeEnd.lng, terrainMode, terrainMaxSlope);
      if (!result) {
        setTerrainError('No terrain path found. Terrain may be too steep or region too large.');
        setTerrainRoute(null);
      } else {
        setTerrainRoute(result);
      }
    } catch (e) {
      setTerrainError(`Terrain analysis failed: ${e instanceof Error ? e.message : 'unknown error'}`);
      setTerrainRoute(null);
    } finally {
      setTerrainLoading(false);
    }
  };

  const slotCard = (slot: RouteSlot, label: string, point: LatLng) => {
    const active = pickSlot === slot;
    return (
      <div
        className={`rounded border p-2.5 ${
          active ? 'border-ap-orange/70 bg-ap-orange/5' : 'border-ap-border bg-ap-bg/60'
        }`}
        data-testid={`route-slot-${slot}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">{label}</span>
          <span className="truncate ap-font-display text-[11px] text-ap-text">{labelForPoint(point)}</span>
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-wide text-ap-ice" data-testid={`route-${slot}-coords`}>
          {formatCoordinate(point.lat, point.lng)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPickSlot(active ? null : slot)}
            className={`rounded border px-2 py-1.5 font-mono text-[9px] tracking-[0.18em] ${
              active
                ? 'border-ap-orange bg-ap-orange/15 text-ap-orange'
                : 'border-ap-border bg-ap-bg/60 text-ap-text-dim hover:border-ap-orange/40'
            }`}
            data-testid={`pick-${slot}`}
          >
            {active ? 'CLICK MAP…' : 'PICK ON MAP'}
          </button>
          <button
            type="button"
            onClick={() => {
              resetRoutePoint(slot);
              if (active) setPickSlot(null);
            }}
            disabled={isDefaultPoint(point, slot)}
            className="rounded border border-ap-border bg-ap-bg/60 px-2 py-1.5 font-mono text-[9px] tracking-[0.18em] text-ap-text-dim disabled:opacity-40"
            data-testid={`reset-${slot}`}
          >
            RESET
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="ap-panel flex h-full w-full flex-col overflow-hidden border-r border-ap-border">
      <div className="border-b border-ap-border px-4 py-3 pr-11">
        <div className="ap-font-display text-sm tracking-[0.22em] text-ap-text">ROUTE PLANNER</div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-ap-text-faint">
          HYPOTHETICAL EVA TRAVERSE
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          <p className="text-[10px] leading-relaxed text-ap-text-faint">
            PICK ON MAP, then click anywhere on Mars to set that end of the traverse. Coordinates come
            straight from the click — nothing is snapped to a target.
          </p>

          {slotCard('start', 'START POINT', routeStart)}
          {slotCard('end', 'DESTINATION', routeEnd)}

          <div className="rounded border border-ap-border bg-ap-bg/60 px-2.5 py-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">GREAT-CIRCLE PATH</span>
              <span className="font-mono text-[9px] text-ap-text-dim">
                {formatDistanceKm(previewDistanceM)} · {formatDurationHuman(previewDistanceM / 0.2)}
              </span>
            </div>
            <div className="mt-1 font-mono text-[8px] tracking-[0.15em] text-ap-text-faint">
              DURATION ASSUMES A 0.2 m/s SUITED WALK · NOT A TERRAIN ROUTE
            </div>
          </div>

          <button
            type="button"
            onClick={handleSetRoute}
            disabled={terrainLoading}
            className="w-full rounded border border-ap-orange/60 bg-ap-orange/10 px-3 py-2 font-mono text-[10px] tracking-[0.25em] text-ap-orange disabled:opacity-50"
            data-testid="calculate-route"
          >
            {terrainLoading ? 'CALCULATING...' : 'CALCULATE ROUTE'}
          </button>

          {savedRoutes.length > 0 ? (
            <div className="rounded border border-ap-border bg-ap-bg/70 p-3" data-testid="saved-routes">
              <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">SAVED ROUTES</div>
              <div className="mt-2 space-y-1.5">
                {savedRoutes.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded border border-ap-border bg-ap-bg/60 px-2 py-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (r.points.length >= 2) {
                          setRoutePoint('start', r.points[0]);
                          setRoutePoint('end', r.points[1]);
                          setRoute(r);
                        }
                      }}
                      className="min-w-0 flex-1 text-left"
                      data-testid={`load-route-${r.id}`}
                    >
                      <div className="truncate ap-font-display text-[10px] text-ap-text">{r.name}</div>
                      <div className="font-mono text-[8px] text-ap-text-faint">
                        {formatDistanceKm(r.distanceM)} · {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRoute(r.id)}
                      className="shrink-0 rounded border border-ap-border bg-ap-bg/60 px-1.5 py-0.5 font-mono text-[8px] text-ap-text-faint hover:border-ap-red/40 hover:text-ap-red"
                      data-testid={`delete-route-${r.id}`}
                      aria-label="Delete saved route"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <TerrainRoutePlanner
            mode={terrainMode}
            onModeChange={setTerrainMode}
            maxSlope={terrainMaxSlope}
            onMaxSlopeChange={setTerrainMaxSlope}
            loading={terrainLoading}
            error={terrainError}
          />

          {plannedRoute ? (
            <div className="rounded border border-ap-border bg-ap-bg/70 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">ROUTE</span>
                <span className="ap-font-display text-right text-xs text-ap-text">{plannedRoute.name}</span>
              </div>
              {terrainRoute ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded border border-ap-green/40 bg-ap-green/5 p-2">
                    <div className="font-mono text-[8px] tracking-[0.25em] text-ap-green">CORRECT DISTANCE (TERRAIN)</div>
                    <div className="mt-1 ap-font-display text-sm text-ap-green">
                      {formatDistanceKm(terrainRoute.distanceM)}
                    </div>
                  </div>
                  <div className="rounded border border-ap-green/40 bg-ap-green/5 p-2">
                    <div className="font-mono text-[8px] tracking-[0.25em] text-ap-green">EST. DURATION (TERRAIN)</div>
                    <div className="mt-1 ap-font-display text-sm text-ap-green">
                      {formatDurationHuman(terrainRoute.distanceM / 0.2)}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded border border-ap-red/40 bg-ap-red/5 p-2">
                  <div className="font-mono text-[8px] tracking-[0.25em] text-ap-red">DISPLACEMENT (STRAIGHT LINE)</div>
                  <div className="mt-1 ap-font-display text-sm text-ap-red">
                    {formatDistanceKm(plannedRoute.distanceM)}
                  </div>
                </div>
                <div className="rounded border border-ap-red/40 bg-ap-red/5 p-2">
                  <div className="font-mono text-[8px] tracking-[0.25em] text-ap-red">STRAIGHT-LINE DURATION</div>
                  <div className="mt-1 ap-font-display text-sm text-ap-red">
                    {formatDurationHuman(plannedRoute.durationS)}
                  </div>
                </div>
              </div>
              {assessment ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded border border-ap-border bg-ap-panel/60 p-2">
                    <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">INITIAL BEARING</div>
                    <div className="mt-1 ap-font-display text-sm text-ap-text">
                      {assessment.bearingDeg.toFixed(1)}°
                    </div>
                  </div>
                  <div className="rounded border border-ap-border bg-ap-panel/60 p-2">
                    <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">MIDPOINT</div>
                    <div className="mt-1 font-mono text-[9px] text-ap-ice">
                      {formatCoordinate(assessment.midpoint.lat, assessment.midpoint.lng)}
                    </div>
                  </div>
                </div>
              ) : null}
              {assessment ? (
                <div className="mt-3">
                  <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">TRAVERSE TIMES</div>
                  <div className="mt-1.5 space-y-1">
                    {[
                      { label: 'Suited walk (0.2 m/s)', seconds: plannedRoute.distanceM / 0.2 },
                      { label: 'Rover (1.0 m/s)', seconds: plannedRoute.distanceM / 1.0 },
                      { label: 'Aerial drone (5.0 m/s)', seconds: plannedRoute.distanceM / 5.0 },
                    ].map((t) => (
                      <div key={t.label} className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[8px] text-ap-text-faint">{t.label}</span>
                        <span className="font-mono text-[9px] text-ap-text-dim">{formatDurationHuman(t.seconds)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
          {plannedRoute ? (
                <div className="mt-3 rounded border border-ap-border bg-ap-panel/60 p-2.5">
                  <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">TRAVERSE ANALYSIS</div>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[8px] text-ap-text-faint">Angular separation</span>
                      <span className="font-mono text-[9px] text-ap-text-dim">{angularSep.toFixed(2)}°</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[8px] text-ap-text-faint">Energy (suited, 300 W)</span>
                      <span className="font-mono text-[9px] text-ap-text-dim">{(energyKJ / 1000).toFixed(1)} MJ ({Math.round(energyKJ / 4.184)} kcal)</span>
                    </div>
                  </div>
                  <div className="mt-1.5 font-mono text-[7px] leading-relaxed text-ap-text-faint">
                    Energy assumes a 120 kg suited astronaut at 300 W metabolic rate (stated assumption, not a measurement). Mars gravity is 3.71 m/s². No elevation or slope data is available, so this is a flat-traverse lower bound.
                  </div>
                </div>
              ) : null}

              {plannedRoute && waypoints.length > 0 ? (
                <div className="mt-3 rounded border border-ap-border bg-ap-panel/60 p-2.5">
                  <button
                    type="button"
                    onClick={() => setShowWaypoints((v) => !v)}
                    className="flex w-full items-center justify-between font-mono text-[8px] tracking-[0.25em] text-ap-text-faint"
                  >
                    <span>GREAT-CIRCLE WAYPOINTS ({waypoints.length})</span>
                    <span>{showWaypoints ? '−' : '+'}</span>
                  </button>
                  {showWaypoints ? (
                    <div className="mt-1.5 space-y-1">
                      {waypoints.map((wp, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-[8px] text-ap-text-faint">
                            {i === 0 ? 'START' : i === waypoints.length - 1 ? 'END' : 'WP' + i}
                          </span>
                          <span className="font-mono text-[8px] text-ap-ice">{formatCoordinate(wp.lat, wp.lng)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {assessment ? (
                <div className="mt-3">
                  <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">ASSESSMENT</div>
                  <div className="mt-1 ap-font-display text-sm text-ap-text">{assessment.level.toUpperCase()}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-ap-text-dim">{assessment.explanation}</p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  saveRoute({
                    id: `route-${Date.now()}`,
                    name: plannedRoute.name,
                    points: plannedRoute.points,
                    distanceM: plannedRoute.distanceM,
                    durationS: plannedRoute.durationS,
                    createdAt: new Date().toISOString(),
                  })
                }
                className="mt-3 w-full rounded border border-ap-border bg-ap-bg/60 px-3 py-2 font-mono text-[9px] tracking-[0.25em] text-ap-text-dim"
              >
                SAVE ROUTE
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="mt-3 w-full rounded border border-ap-orange/60 bg-ap-orange/10 px-3 py-2 font-mono text-[9px] tracking-[0.25em] text-ap-orange"
              >
                GENERATE MISSION BRIEF
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}