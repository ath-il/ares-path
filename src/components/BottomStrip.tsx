import { useMission } from '../context/MissionContext';
import { formatCoordinate } from '../utils/format';
import { layerById } from '../data/layers';

export default function BottomStrip() {
  const { selected, activeLayerId, layerStatus, missionPhase } = useMission();
  const active = layerById(activeLayerId);
  const status = layerStatus[activeLayerId];

  const center = selected ?? { lat: 18.44, lng: 77.45 };

  return (
    <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-ap-border bg-ap-bg/85 px-4 py-2 font-mono text-[9px] tracking-[0.2em] text-ap-text-dim backdrop-blur">
      <span className="text-ap-text-faint">{selected ? 'FIX' : 'JPL ZONE'}</span>
      <span>
        LAT <span className="text-ap-ice">{center.lat.toFixed(4)}°</span>
      </span>
      <span>
        LON <span className="text-ap-ice">{center.lng.toFixed(4)}°</span>
      </span>
      <span>
        POS <span className="text-ap-text-dim">{formatCoordinate(center.lat, center.lng)}</span>
      </span>
      <span>
        SYSTEM <span className="text-ap-green">{missionPhase === 'boot' ? 'BOOTING' : 'ONLINE'}</span>
      </span>
      <span>
        BASEMAP{' '}
        <span className={status?.state === 'error' ? 'text-ap-gold' : 'text-ap-ice'}>
          {active ? active.name.toUpperCase() : 'NONE'}
        </span>
      </span>
      <span className="ml-auto hidden max-w-[46%] truncate text-ap-text-faint md:inline">
        {active?.tile
          ? `${active.datasetId} · ${status?.state === 'ready' ? `${status.tilesLoaded} TILES${status.tilesFailed ? ` / ${status.tilesFailed} MISSING` : ''}` : status?.state === 'error' ? 'SERVICE UNAVAILABLE' : 'CONNECTING'}`
          : 'NO VERIFIED TILE SERVICE'}
      </span>
    </footer>
  );
}
