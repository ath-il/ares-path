import { type RouteMode } from '../types/mars';

interface Props {
  mode: RouteMode;
  onModeChange: (mode: RouteMode) => void;
  maxSlope: number;
  onMaxSlopeChange: (slope: number) => void;
  loading: boolean;
  error: string | null;
}

export default function TerrainRoutePlanner({ mode, onModeChange, maxSlope, onMaxSlopeChange, loading, error }: Props) {
  return (
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
          onClick={() => onModeChange('rover')}
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
          onClick={() => onModeChange('astronaut')}
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
          onChange={(e) => onMaxSlopeChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="font-mono text-[8px] text-ap-text-dim">{maxSlope}°</span>
      </div>

      <div className="mt-2 font-mono text-[8px] text-ap-text-faint">
        Click <span className="text-ap-orange">CALCULATE ROUTE</span> above to compute both the straight-line displacement and the terrain-aware route.
      </div>

      {loading ? (
        <div className="mt-2 rounded border border-ap-border bg-ap-bg/60 px-2 py-1.5 font-mono text-[8px] text-ap-text-dim">
          Calculating terrain route...
        </div>
      ) : null}

      {error ? (
        <div className="mt-2 rounded border border-ap-gold/40 bg-ap-gold/5 px-2 py-1.5 font-mono text-[8px] text-ap-gold">
          {error}
        </div>
      ) : null}
    </div>
  );
}