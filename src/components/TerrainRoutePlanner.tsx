import { useState, useCallback } from 'react';
import { useMission } from '../context/MissionContext';
import { buildTerrainGrid } from '../services/terrain/terrainGrid';
import { astarRoute } from '../services/routing/astar';
import type { RouteMode } from '../types/mars';
import { formatDistanceKm } from '../utils/format';
import { haversineDistanceM } from '../utils/geo';

export default function TerrainRoutePlanner() {
  const { routeStart, routeEnd, terrainRoute, setTerrainRoute } = useMission();
  const [mode, setMode] = useState<RouteMode>('rover');
  const [maxSlope, setMaxSlope] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const distance = haversineDistanceM(routeStart, routeEnd);

  const handleCalculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress('Fetching terrain data...');

    try {
      // Determine grid size based on distance
      const distKm = distance / 1000;
      let gridCells = 20;
      let cellSizeM = 500;
      if (distKm > 50) {
        gridCells = 25;
        cellSizeM = Math.ceil((distKm * 1000) / (gridCells - 1));
      } else if (distKm > 100) {
        gridCells = 30;
        cellSizeM = Math.ceil((distKm * 1000) / (gridCells - 1));
      }

      const grid = await buildTerrainGrid(
        (routeStart.lat + routeEnd.lat) / 2,
        (routeStart.lng + routeEnd.lng) / 2,
        gridCells,
        cellSizeM,
      );

      setProgress('Running A* pathfinding...');

      const result = astarRoute(
        grid,
        routeStart.lat,
        routeStart.lng,
        routeEnd.lat,
        routeEnd.lng,
        mode,
        maxSlope,
      );

      if (!result) {
        setError('No path found. The terrain may be too steep or the region too large.');
        setTerrainRoute(null);
      } else {
        setTerrainRoute(result);
      }
    } catch (e) {
      setError(`Terrain analysis failed: ${e instanceof Error ? e.message : 'unknown error'}`);
      setTerrainRoute(null);
    } finally {
      setLoading(false);
      setProgress('');
    }
  }, [routeStart, routeEnd, mode, maxSlope, distance, setTerrainRoute]);

  return (
    <div className="space-y-3">
      <div className="rounded border border-ap-border bg-ap-bg/60 p-3">
        <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">TERRAIN ROUTE (A*)</div>
        <p className="mt-1 text-[9px] leading-relaxed text-ap-text-faint">
          Fetches MOLA elevation tiles for the region between your endpoints and runs A* pathfinding with terrain cost.
          Elevation is approximate (±2 km) — derived from MOLA color hillshade pixel colors.
        </p>

        {/* Mode selector */}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('rover')}
            className={`flex-1 rounded border px-2 py-1.5 font-mono text-[9px] tracking-[0.18em] ${
              mode === 'rover'
                ? 'border-ap-orange bg-ap-orange/15 text-ap-orange'
                : 'border-ap-border bg-ap-bg/60 text-ap-text-dim'
            }`}
          >
            ROVER
          </button>
          <button
            type="button"
            onClick={() => setMode('astronaut')}
            className={`flex-1 rounded border px-2 py-1.5 font-mono text-[9px] tracking-[0.18em] ${
              mode === 'astronaut'
                ? 'border-ap-orange bg-ap-orange/15 text-ap-orange'
                : 'border-ap-border bg-ap-bg/60 text-ap-text-dim'
            }`}
          >
            ASTRONAUT
          </button>
        </div>

        {/* Max slope */}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[8px] text-ap-text-faint">MAX SLOPE</span>
          <input
            type="range"
            min={10}
            max={45}
            value={maxSlope}
            onChange={(e) => setMaxSlope(Number(e.target.value))}
            className="flex-1"
          />
          <span className="font-mono text-[8px] text-ap-text-dim">{maxSlope}°</span>
        </div>

        {/* Calculate button */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={loading}
          className="mt-3 w-full rounded border border-ap-orange/60 bg-ap-orange/10 px-3 py-2 font-mono text-[10px] tracking-[0.25em] text-ap-orange disabled:opacity-50"
          data-testid="calculate-terrain-route"
        >
          {loading ? (progress || 'CALCULATING...') : 'CALCULATE TERRAIN ROUTE'}
        </button>

        {error ? (
          <div className="mt-2 rounded border border-ap-gold/40 bg-ap-gold/5 px-2 py-1.5 font-mono text-[8px] text-ap-gold">
            {error}
          </div>
        ) : null}
      </div>

      {/* Results */}
      {terrainRoute ? (
        <div className="rounded border border-ap-border bg-ap-bg/70 p-3" data-testid="terrain-route-results">
          <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">TERRAIN ROUTE RESULTS</div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] text-ap-text-faint">Mode</span>
              <span className="font-mono text-[9px] text-ap-text-dim">{terrainRoute.mode.toUpperCase()}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] text-ap-text-faint">Path distance</span>
              <span className="font-mono text-[9px] text-ap-text-dim">{formatDistanceKm(terrainRoute.distanceM)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] text-ap-text-faint">Elevation gain</span>
              <span className="font-mono text-[9px] text-ap-text-dim">{terrainRoute.elevationGainM.toFixed(0)} m</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] text-ap-text-faint">Max slope</span>
              <span className="font-mono text-[9px] text-ap-text-dim">{terrainRoute.maxSlopeDeg.toFixed(1)}°</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] text-ap-text-faint">Terrain cost</span>
              <span className="font-mono text-[9px] text-ap-text-dim">{terrainRoute.totalCost.toFixed(1)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] text-ap-text-faint">Waypoints</span>
              <span className="font-mono text-[9px] text-ap-text-dim">{terrainRoute.waypoints.length}</span>
            </div>
            {terrainRoute.blockedCells > 0 ? (
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[8px] text-ap-text-faint">Blocked cells</span>
                <span className="font-mono text-[9px] text-ap-gold">{terrainRoute.blockedCells}</span>
              </div>
            ) : null}
            {terrainRoute.unknownCells > 0 ? (
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[8px] text-ap-text-faint">Unknown cells</span>
                <span className="font-mono text-[9px] text-ap-gold">{terrainRoute.unknownCells}</span>
              </div>
            ) : null}
          </div>
          <div className="mt-2 font-mono text-[7px] leading-relaxed text-ap-text-faint">
            Elevation derived from MOLA color hillshade (approximate, ±2 km). Slope and cost are computed from approximate elevation. Route is a lowest-cost path, not a validated traverse.
          </div>
        </div>
      ) : null}
    </div>
  );
}