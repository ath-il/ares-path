import { SCIENTIFIC_TARGETS } from '../data/scientificTargets';
import { useMission } from '../context/MissionContext';
import { formatCoordinate, formatDistanceKm } from '../utils/format';

export default function RightPanel() {
  const { selected, clearSelection, route, assessment, saveRoute } = useMission();

  const target = selected?.kind === 'target' && selected.id ? SCIENTIFIC_TARGETS.find((t) => t.id === selected.id) : undefined;

  return (
    <aside className="ap-panel flex h-full w-full flex-col overflow-hidden border-l border-ap-border">
      <div className="border-b border-ap-border px-4 py-3 pr-11">
        <div className="ap-font-display text-sm tracking-[0.22em] text-ap-text">SELECTION / TRAVERSE</div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-ap-text-faint">CONTEXT PANEL</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {selected ? (
          <div className="space-y-4">
            <div>
              <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">LOCATION</div>
              <div className="mt-2 ap-font-display text-lg text-ap-text">{selected.name}</div>
              <div className="mt-1 font-mono text-[10px] text-ap-ice">{formatCoordinate(selected.lat, selected.lng)}</div>
              <button
                type="button"
                onClick={clearSelection}
                className="mt-2 rounded border border-ap-border bg-ap-bg/60 px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-ap-text-dim"
              >
                CLEAR SELECTION
              </button>
            </div>
            {target ? (
              <>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">SUMMARY</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-ap-text">{target.summary}</p>
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">WHY INTERESTING</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-ap-text">{target.whyInteresting}</p>
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">DATA LIMITATIONS</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-ap-text-dim">{target.limitations}</p>
                </div>
                <div>
                  <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">SOURCE</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-ap-text">{target.source}</p>
                </div>
              </>
            ) : (
              <div>
                <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">COORDINATES</div>
                <p className="mt-2 text-[11px] leading-relaxed text-ap-text-dim">
                  Selected point is an astronaut-defined waypoint. Terrain assessment for custom points requires
                  elevation data coverage beyond the curated exploration zones.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {route ? (
          <div className="space-y-4 border-t border-ap-border pt-4">
            <div>
              <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">ACTIVE ROUTE</div>
              <div className="mt-2 ap-font-display text-lg text-ap-text">{route.name}</div>
              <div className="mt-1 font-mono text-[10px] text-ap-ice">{formatDistanceKm(route.distanceM)}</div>
            </div>
            {assessment ? (
              <div>
                <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">TERRAIN ASSESSMENT</div>
                <div className="mt-2 ap-font-display text-lg text-ap-text">{assessment.level.toUpperCase()}</div>
                <p className="mt-2 text-[11px] leading-relaxed text-ap-text-dim">{assessment.explanation}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                saveRoute(route);
              }}
              className="w-full rounded border border-ap-border bg-ap-bg/60 px-3 py-2 font-mono text-[9px] tracking-[0.25em] text-ap-text-dim"
            >
              SAVE ROUTE
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
