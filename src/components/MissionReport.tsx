import { useMemo } from 'react';
import { useMission } from '../context/MissionContext';
import { formatDurationHuman, formatPlainCoordinate } from '../utils/format';
import { SCIENTIFIC_TARGETS } from '../data/scientificTargets';

export default function MissionReport() {
  const { reportOpen, setReportOpen, route, assessment, selected, missionPhase } = useMission();

  const routeName = route?.name ?? 'Untitled traverse';
  const missionId = useMemo(
    () => `MARS-EXP-${routeName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24)}-${new Date().getFullYear()}`,
    [routeName],
  );

  if (!reportOpen) return null;

  const distanceKm = route ? route.distanceM / 1000 : 0;
  const duration = route ? route.durationS : 0;
  const selectedName = selected?.name ?? 'Mars exploration waypoint';
  const firstPoint = route?.points[0];
  const lastPoint = route?.points[route.points.length - 1];
  const startLabel = firstPoint ? formatPlainCoordinate(firstPoint.lat, firstPoint.lng) : selectedName;
  const endLabel = lastPoint ? formatPlainCoordinate(lastPoint.lat, lastPoint.lng) : selectedName;

  const lines: string[] = [
    'ARES PATH - GAGANTRIX',
    'MISSION BRIEF',
    `MISSION ID: ${missionId}`,
    `MISSION NAME: ${routeName.toUpperCase()}`,
    `GENERATED: ${new Date().toISOString()}`,
    `START: ${startLabel}`,
    `DESTINATION: ${endLabel}`,
    `ROUTE DISTANCE: ${distanceKm > 0 ? `${distanceKm.toFixed(2)} km` : '0 m'}`,
    `EST. DURATION: ${formatDurationHuman(duration)}`,
    '',
    'TRAVERSE SUMMARY',
    `Selected route: ${routeName}`,
    `Waypoints: ${route?.points.length ?? 0}`,
    '',
    'TERRAIN OBSERVATIONS',
    'Elevation observations: NASA MOLA/HRSC blended DEM global coverage; numeric point sampling unavailable in current build.',
    'Slope information: derived slope requires elevation samples; unavailable.',
    'Surface roughness: dataset not integrated.',
    'Relevant thermal observations: dataset not integrated.',
    '',
    'SCIENTIFIC OPPORTUNITIES',
    ...SCIENTIFIC_TARGETS.slice(0, 3).map((t) => `- ${t.name}: ${t.summary}`),
    '',
    'DATA QUALITY AND LIMITATIONS',
    'Sources: NASA PDS, USGS Astrogeology, ESA, NASA/JPL, Esri.',
    'Assumptions: traverse duration uses assumed EVA walking speed of 0.2 m/s.',
    'Missing data: elevation point sampling and roughness layers not available.',
    '',
    'ROUTE ASSESSMENT',
    assessment ? assessment.explanation : 'No route assessed.',
  ];

  const print = () => {
    window.print();
  };

  const downloadPdf = async () => {
    // jsPDF (and its html2canvas/purify deps) is large, so load it on demand.
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 18;
    const maxWidth = 174;
    let y = 20;
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line.length ? line : ' ', maxWidth) as string[];
      for (const piece of wrapped) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(piece, margin, y);
        y += 4.6;
      }
    }
    doc.save(`ares-path-mission-brief-${missionId}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-ap-bg/90 p-4 backdrop-blur-sm">
      <div className="ap-panel ap-print-target max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="ap-font-display text-lg tracking-[0.22em] text-ap-text">MISSION BRIEF</div>
            <div className="mt-1 font-mono text-[9px] tracking-[0.25em] text-ap-text-faint">ARES PATH · GAGANTRIX</div>
          </div>
          <button
            type="button"
            onClick={() => setReportOpen(false)}
            className="rounded border border-ap-border bg-ap-bg/60 px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-ap-text-dim"
          >
            CLOSE
          </button>
        </div>
        <pre className="mt-6 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-ap-text-dim">{lines.join('\n')}</pre>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[9px] tracking-[0.25em] text-ap-text-faint">STATUS: {missionPhase.toUpperCase()}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              className="rounded border border-ap-ice/60 bg-ap-ice/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-ap-ice"
            >
              DOWNLOAD PDF
            </button>
            <button
              type="button"
              onClick={print}
              className="rounded border border-ap-orange/60 bg-ap-orange/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-ap-orange"
            >
              EXPORT / PRINT PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
