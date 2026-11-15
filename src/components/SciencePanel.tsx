import { useMemo, useState } from 'react';
import { SCIENTIFIC_TARGETS } from '../data/scientificTargets';
import { useMission } from '../context/MissionContext';
import type { TargetType } from '../types/mars';

const FILTERS: { id: TargetType | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'ancient-water', label: 'ANCIENT WATER' },
  { id: 'delta', label: 'DELTA' },
  { id: 'crater', label: 'CRATER' },
  { id: 'terrain', label: 'TERRAIN' },
  { id: 'rover', label: 'ROVER' },
];

export default function SciencePanel() {
  const { selectTarget } = useMission();
  const [filter, setFilter] = useState<TargetType | 'all'>('all');

  const targets = useMemo(
    () => SCIENTIFIC_TARGETS.filter((t) => filter === 'all' || t.type === filter),
    [filter],
  );

  return (
    <aside className="ap-panel flex h-full w-full flex-col overflow-hidden border-r border-ap-border">
      <div className="border-b border-ap-border px-4 py-3 pr-11">
        <div className="ap-font-display text-sm tracking-[0.22em] text-ap-text">SCIENCE TARGETS</div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-ap-text-faint">CURATED POINTS OF INTEREST</div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-ap-border px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded px-2 py-1 font-mono text-[9px] tracking-[0.18em] ${
              filter === f.id ? 'bg-ap-orange/10 text-ap-orange' : 'text-ap-text-dim'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-2">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => selectTarget(target)}
              className="rounded border border-ap-border bg-ap-bg/60 p-3 text-left transition-colors hover:border-ap-ice/40"
              data-testid={`target-${target.id}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="ap-font-display text-xs tracking-wide text-ap-text">{target.name}</span>
                <span className="font-mono text-[8px] tracking-[0.2em] text-ap-ice">{target.type.toUpperCase()}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-ap-text-dim">{target.summary}</p>
              <div className="mt-2 font-mono text-[9px] text-ap-text-faint">
                {target.lat.toFixed(2)}° {target.lat >= 0 ? 'N' : 'S'} / {Math.abs(target.lng).toFixed(2)}° {target.lng >= 0 ? 'E' : 'W'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
