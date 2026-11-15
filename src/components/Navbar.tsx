import { useMission } from '../context/MissionContext';
import type { MissionSection } from '../types/mars';

const NAV_ITEMS: { id: MissionSection; label: string }[] = [
  { id: 'explore', label: 'Mission Overview' },
  { id: 'route', label: 'Route Planner' },
  { id: 'science', label: 'Science Targets' },
  { id: 'about', label: 'About the Mission' },
];

export default function Navbar() {
  const { view, section, setView, setSection, missionPhase } = useMission();

  if (view !== 'mission') return null;

  const go = (id: MissionSection) => {
    setSection(id);
    setView('mission');
  };

  return (
    <header className="relative z-30 flex h-14 items-center gap-4 border-b border-ap-border bg-ap-bg/90 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        className="flex items-center gap-2"
        onClick={() => go('explore')}
        data-testid="nav-brand"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-ap-orange shadow-[0_0_10px_rgba(232,117,66,0.8)]" />
        <span className="ap-font-display text-lg tracking-[0.18em] text-ap-text">ARES PATH</span>
        <span className="hidden font-mono text-[9px] tracking-[0.25em] text-ap-text-faint md:inline">GAGANTRIX</span>
      </button>

      <nav className="ml-6 hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            className={`rounded px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] transition-colors ${
              section === item.id ? 'bg-ap-orange/10 text-ap-orange' : 'text-ap-text-dim hover:text-ap-text'
            }`}
          >
            {item.label.toUpperCase()}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded border border-ap-border bg-ap-panel px-3 py-1.5 md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ap-green" />
          <span className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">SYSTEM ONLINE</span>
        </div>
        <div className="hidden items-center gap-2 rounded border border-ap-border bg-ap-panel px-3 py-1.5 xl:flex">
          <span className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">MISSION</span>
          <span className="ap-font-display text-xs tracking-[0.18em] text-ap-text">
            {missionPhase === 'boot' ? 'BOOTING' : 'MARS SURFACE EXPLORATION'}
          </span>
        </div>
      </div>
    </header>
  );
}
