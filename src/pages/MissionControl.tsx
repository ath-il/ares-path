import { useEffect, useRef, useState } from 'react';
import MarsMap from '../components/MarsMap';
import LayerPanel from '../components/LayerPanel';
import RoutePlannerPanel from '../components/RoutePlannerPanel';
import SciencePanel from '../components/SciencePanel';
import RightPanel from '../components/RightPanel';
import BottomStrip from '../components/BottomStrip';
import MissionReport from '../components/MissionReport';
import { useMission } from '../context/MissionContext';
import { MARS_FACTS } from '../data/marsFacts';

/**
 * Docked panel widths. The map is inset by these amounts on wide screens so
 * that Leaflet's idea of the viewport centre matches the part of the map the
 * user can actually see; otherwise zoom and target focus land behind a panel.
 */
const LEFT_PANEL_WIDTH = 300;
const RIGHT_PANEL_WIDTH = 380;

export default function MissionControl() {
  const { section, pickSlot } = useMission();
  const isCompact = useIsCompact();
  const [leftOpen, setLeftOpen] = useState(!isCompact);
  const [rightOpen, setRightOpen] = useState(!isCompact);
  const lastSectionRef = useRef(section);

  // Compact layouts use overlay drawers, which start closed; wide layouts dock
  // both panels. Re-apply whenever the breakpoint is crossed.
  useEffect(() => {
    setLeftOpen(!isCompact);
    setRightOpen(!isCompact);
  }, [isCompact]);

  // Switching section only collapses the overlay drawers. On a wide screen the
  // panels stay docked (or closed) exactly as the user left them.
  useEffect(() => {
    if (lastSectionRef.current === section) return;
    lastSectionRef.current = section;
    if (isCompact) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, [section, isCompact]);

  // Picking a traverse endpoint happens on the map, so nothing may cover it.
  useEffect(() => {
    if (pickSlot) {
      setLeftOpen(false);
      setRightOpen(false);
    }
  }, [pickSlot]);

  const showLeft = section === 'explore' || section === 'route' || section === 'science';
  const showRight = section !== 'about';

  const leftPanel =
    section === 'explore' ? (
      <LayerPanel />
    ) : section === 'route' ? (
      <RoutePlannerPanel />
    ) : (
      <SciencePanel />
    );

  return (
    <div className="relative h-full w-full overflow-hidden bg-ap-bg">
      <div
        className="absolute bottom-0 top-0 transition-[left,right] duration-200"
        style={{
          left: !isCompact && showLeft && leftOpen ? LEFT_PANEL_WIDTH : 0,
          right: !isCompact && showRight && rightOpen ? RIGHT_PANEL_WIDTH : 0,
        }}
      >
        <MarsMap />
      </div>

      {showLeft ? (
        <>
          {isCompact && leftOpen ? (
            <div className="absolute inset-0 z-10 bg-black/50" onClick={() => setLeftOpen(false)} />
          ) : null}
          <div
            className={`absolute bottom-14 left-0 top-0 z-20 flex h-[calc(100vh-3.5rem)] w-[300px] max-w-[88vw] flex-col bg-ap-panel ${
              leftOpen ? '' : 'hidden'
            }`}
          >
            <button
              type="button"
              onClick={() => setLeftOpen(false)}
              aria-label="Collapse panel"
              className="absolute right-2 top-2 z-30 rounded border border-ap-border bg-ap-bg/80 px-2 py-1 font-mono text-[9px] text-ap-text-dim hover:border-ap-border-strong hover:text-ap-ice"
              data-testid="close-left"
            >
              ✕
            </button>
            {leftPanel}
          </div>
        </>
      ) : null}

      {showRight ? (
        <div
          className={`absolute bottom-14 right-0 top-0 z-20 flex h-[calc(100vh-3.5rem)] w-[380px] max-w-[92vw] flex-col bg-ap-panel ${
            rightOpen ? '' : 'hidden'
          }`}
        >
          <button
            type="button"
            onClick={() => setRightOpen(false)}
            aria-label="Collapse panel"
            className="absolute left-2 top-2 z-30 rounded border border-ap-border bg-ap-bg/80 px-2 py-1 font-mono text-[9px] text-ap-text-dim hover:border-ap-border-strong hover:text-ap-ice"
            data-testid="close-right"
          >
            ✕
          </button>
          <RightPanel />
        </div>
      ) : null}

      {showLeft && !leftOpen ? (
        <button
          type="button"
          onClick={() => setLeftOpen(true)}
          className="absolute bottom-20 left-3 z-30 rounded border border-ap-border bg-ap-panel/90 px-3 py-2 font-mono text-[9px] tracking-[0.25em] text-ap-text-dim hover:border-ap-border-strong hover:text-ap-ice"
          data-testid="toggle-left"
        >
          {section === 'route' ? 'ROUTE PANEL' : section === 'science' ? 'SCIENCE TARGETS' : 'EXPLORE PANEL'}
        </button>
      ) : null}

      {showRight && !rightOpen ? (
        <button
          type="button"
          onClick={() => setRightOpen(true)}
          className="absolute bottom-20 right-3 z-30 rounded border border-ap-border bg-ap-panel/90 px-3 py-2 font-mono text-[9px] tracking-[0.25em] text-ap-text-dim hover:border-ap-border-strong hover:text-ap-ice"
          data-testid="toggle-right"
        >
          INSPECT
        </button>
      ) : null}

      <BottomStrip />

      {section === 'about' ? (
        <div className="absolute bottom-14 left-0 right-0 top-0 z-20 px-3 py-3 md:px-6 md:py-5 xl:px-8 xl:py-8" data-testid="about-content">
          <AboutContent />
        </div>
      ) : null}

      <MissionReport />
    </div>
  );
}

function AboutContent() {
  return (
    <div className="ap-panel h-full w-full overflow-y-auto border border-ap-border p-4 sm:p-6 xl:p-8">
      <div className="ap-font-display text-lg tracking-[0.22em] text-ap-text">ABOUT THE MISSION</div>
      <p className="mt-4 text-xs leading-relaxed text-ap-text-dim">
        ARES PATH is a GAGANTRIX mission-planning prototype for the NASA Space Apps Challenge 2026. It combines publicly
        available NASA Mars science datasets into an interactive exploration and route-planning interface.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ap-text-dim">
        The platform is an educational research prototype. It does not constitute an operational navigation system and
        must not be used for safety-critical surface operations.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-ap-text-faint">
        Developed with AI assistance (OpenCode / Beam) for code and documentation. All scientific data is from verified
        NASA sources; no NASA branding or mission identifiers were AI-generated.
      </p>

      <div className="mt-8">
        <div className="ap-font-display text-sm tracking-[0.25em] text-ap-text">UNDERSTAND YOUR PLANET</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MARS_FACTS.map((fact) => (
            <div key={fact.id} className="rounded border border-ap-border bg-ap-bg/60 p-3">
              <div className="ap-font-display text-xs tracking-wide text-ap-ice">{fact.title}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-ap-text-dim">{fact.text}</p>
              <div className="mt-2 font-mono text-[8px] tracking-[0.2em] text-ap-text-faint">{fact.source}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COMPACT_QUERY = '(max-width: 1023px)';

function useIsCompact(): boolean {
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const onChange = () => setIsCompact(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isCompact;
}
