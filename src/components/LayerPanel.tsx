import { useState } from 'react';
import { MARS_LAYERS, layerById } from '../data/layers';
import { REGIONS } from '../data/scientificTargets';
import { useMission } from '../context/MissionContext';
import { nativeZoomRange, zoomOffsetForTileSize } from '../services/nasa/marsTiles';
import type { LayerId, MeasurementType } from '../types/mars';

const KIND_LABELS: Record<string, string> = {
  elevation: 'TOPOGRAPHY',
  imagery: 'IMAGERY',
  thermal: 'THERMAL',
  roughness: 'ROUGHNESS',
};

const MEASUREMENT_LABELS: Record<MeasurementType, { title: string; detail: string; tone: string }> = {
  measured: {
    title: 'MEASURED',
    detail: 'Direct instrument measurement.',
    tone: 'text-ap-green border-ap-green/40 bg-ap-green/5',
  },
  derived: {
    title: 'DERIVED FROM MEASUREMENTS',
    detail:
      'A rendered product computed from real measurements — colour and shading are visual encodings, not raw values.',
    tone: 'text-ap-ice border-ap-ice/40 bg-ap-ice/5',
  },
  mosaic: {
    title: 'MOSAIC · PARTIAL COVERAGE',
    detail:
      'Real images blended into a mosaic. Coverage is incomplete and seams or offsets may exist.',
    tone: 'text-ap-gold border-ap-gold/40 bg-ap-gold/5',
  },
  unavailable: {
    title: 'UNAVAILABLE',
    detail: 'No verified public service — nothing is drawn for this dataset.',
    tone: 'text-ap-gold border-ap-gold/40 bg-ap-gold/5',
  },
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="font-mono text-[8px] tracking-[0.22em] text-ap-text-faint">{label}</div>
      <div className="mt-0.5 text-[10px] leading-relaxed text-ap-text-dim">{value}</div>
    </div>
  );
}

export default function LayerPanel() {
  const { activeLayerId, setActiveLayer, layerStatus, regionId, setRegionId } = useMission();
  const [inspectedId, setInspectedId] = useState<LayerId | null>(null);
  const recordId = inspectedId ?? activeLayerId;
  const active = layerById(recordId) ?? MARS_LAYERS[0];
  const status = layerStatus[recordId];
  const measurement = MEASUREMENT_LABELS[active.measurementType];
  const native = nativeZoomRange(active);
  const inspectingOnly = recordId !== activeLayerId;

  const statusLabel =
    status?.state === 'ready'
      ? `LIVE · ${status.tilesLoaded} TILES${status.tilesFailed ? ` · ${status.tilesFailed} MISSING` : ''}`
      : status?.state === 'loading'
        ? 'CONNECTING TO TILE SERVICE…'
        : status?.state === 'error'
          ? 'SERVICE UNAVAILABLE'
          : 'NOT REQUESTED YET';

  return (
    <aside className="ap-panel flex h-full w-full flex-col overflow-hidden border-r border-ap-border">
      <div className="border-b border-ap-border px-4 py-3 pr-11">
        <div className="ap-font-display text-sm tracking-[0.22em] text-ap-text">MAP BASEMAP</div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-ap-text-faint">
          NASA SCIENCE DATASETS · {MARS_LAYERS.filter((l) => l.status === 'available').length} INTEGRATED
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-4">
          <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">EXPLORE REGION</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {REGIONS.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => setRegionId(region.id)}
                className={`rounded border px-2 py-2 text-left font-mono text-[10px] ${
                  regionId === region.id
                    ? 'border-ap-orange/60 bg-ap-orange/10 text-ap-orange'
                    : 'border-ap-border bg-ap-bg/60 text-ap-text-dim'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-ap-text-faint">
            {REGIONS.find((r) => r.id === regionId)?.description}
          </p>
        </div>

        <div className="mb-2 flex items-baseline justify-between">
          <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-dim">BASEMAP LAYER</div>
          <div className="font-mono text-[8px] tracking-[0.18em] text-ap-text-faint">ONE ACTIVE</div>
        </div>

        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Mars basemap">
          {MARS_LAYERS.map((layer) => {
            const isActive = layer.id === activeLayerId;
            const isRecord = layer.id === recordId;
            const available = layer.status === 'available';
            const load = layerStatus[layer.id];
            return (
              <button
                key={layer.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-disabled={!available}
                onClick={() => {
                  if (available) {
                    setActiveLayer(layer.id);
                    setInspectedId(null);
                  } else {
                    setInspectedId(layer.id);
                  }
                }}
                className={`w-full rounded border p-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-ap-orange/60 bg-ap-orange/5'
                    : isRecord
                      ? 'border-ap-ice/40 bg-ap-ice/5'
                      : available
                        ? 'border-ap-border bg-ap-bg/60 hover:border-ap-orange/30'
                        : 'border-ap-border bg-ap-bg/40 opacity-60 hover:opacity-90'
                }`}
                data-testid={`layer-${layer.id}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
                      isActive ? 'border-ap-orange' : 'border-ap-text-faint'
                    }`}
                    aria-hidden
                  >
                    {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-ap-orange" /> : null}
                  </span>
                  <span className="ap-font-display text-xs tracking-wide text-ap-text">{layer.name}</span>
                  <span
                    className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                      !available
                        ? 'bg-ap-gold'
                        : load?.state === 'error'
                          ? 'bg-ap-red'
                          : load?.state === 'ready'
                            ? 'bg-ap-green'
                            : isActive
                              ? 'bg-ap-orange animate-pulse'
                              : 'bg-ap-text-faint'
                    }`}
                    aria-hidden
                  />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 font-mono text-[8px] tracking-[0.18em] text-ap-text-faint">
                  <span>{KIND_LABELS[layer.kind]}</span>
                  <span>·</span>
                  <span className={available ? 'text-ap-text-dim' : 'text-ap-gold'}>
                    {available
                      ? layer.tile?.format.replace('image/', '').toUpperCase()
                      : 'NO VERIFIED SERVICE — TAP FOR DETAILS'}
                  </span>
                  {available && layer.tile ? <span>· {layer.tile.tileSize} PX</span> : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded border border-ap-border bg-ap-bg/60 p-3" data-testid="dataset-record">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-[8px] tracking-[0.25em] text-ap-text-faint">DATASET RECORD</div>
              <div className="mt-1 ap-font-display text-sm tracking-wide text-ap-text">{active.name}</div>
              {inspectingOnly ? (
                <div className="mt-1 font-mono text-[8px] tracking-[0.15em] text-ap-ice">
                  REVIEWING RECORD — NOT DRAWN ON THE MAP
                </div>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[7px] tracking-[0.12em] ${measurement.tone}`}
            >
              {measurement.title}
            </span>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-ap-text-dim">{measuringText(active.measurementType)}</p>

          <div className="mt-3 flex flex-col gap-2.5">
            <Field label="DATASET ID" value={active.datasetId} />
            <Field label="SOURCE ORGANISATION" value={active.sourceOrg} />
            <Field label="SPATIAL RESOLUTION" value={active.resolution} />
            <Field label="GEOGRAPHIC COVERAGE" value={active.coverage} />
            <Field label="PROJECTION / TILING" value={active.projection} />
            {active.tile ? (
              <Field
                label="TILE MATRIX"
                value={`${active.tile.tileSize} px · zoomOffset ${zoomOffsetForTileSize(
                  active.tile.tileSize,
                )} · service levels ${(native?.min ?? 0) + active.tile.zoomOffset}–${
                  (native?.max ?? 0) + active.tile.zoomOffset
                } · ${active.tile.tms ? 'TMS' : 'north-up XYZ'}`}
              />
            ) : null}
            <Field label="ACQUISITION" value={active.period} />
            <Field label="LIMITATIONS" value={active.limitations} />
          </div>

          {active.status === 'unavailable' ? (
            <div className="mt-3 rounded border border-ap-gold/40 bg-ap-gold/5 px-2 py-2">
              <div className="font-mono text-[8px] tracking-[0.2em] text-ap-gold">WHY THIS IS NOT RENDERED</div>
              <p className="mt-1 text-[9px] leading-relaxed text-ap-text-dim">{active.unavailableReason}</p>
            </div>
          ) : null}

          <div className="mt-3 border-t border-ap-border pt-2">
            <div className="font-mono text-[8px] tracking-[0.2em] text-ap-text-faint">LIVE SERVICE STATUS</div>
            <div
              className={`mt-1 font-mono text-[9px] tracking-wider ${
                active.status !== 'available' || status?.state === 'error' ? 'text-ap-gold' : 'text-ap-green'
              }`}
            >
              {active.status !== 'available' ? 'NOT INTEGRATED — NO TILES REQUESTED' : statusLabel}
            </div>
            {status?.message ? (
              <p className="mt-1 text-[9px] leading-relaxed text-ap-text-faint">{status.message}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {active.sourceUrl ? (
                <a
                  href={active.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[8px] tracking-[0.15em] text-ap-ice underline decoration-dotted"
                >
                  DATASET SOURCE ↗
                </a>
              ) : null}
              {active.serviceUrl ? (
                <a
                  href={active.serviceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[8px] tracking-[0.15em] text-ap-ice underline decoration-dotted"
                >
                  SERVICE METADATA ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-ap-border px-4 py-3">
        <div className="font-mono text-[9px] tracking-[0.25em] text-ap-text-faint">DATA GOVERNANCE</div>
        <p className="mt-2 text-[10px] leading-relaxed text-ap-text-dim">
          Every basemap is a verified public NASA or NASA-derived tile service. Where no service could be
          verified the layer stays unavailable and nothing is drawn — no placeholder or synthesised Mars
          imagery is used.
        </p>
      </div>
    </aside>
  );
}

function measuringText(type: MeasurementType): string {
  switch (type) {
    case 'derived':
      return 'This is a derived visualisation built on real measurements. Elevation colour and hillshade are cartographic encodings: the imagery shows where terrain rises and falls, but no numeric value can be read from a pixel.';
    case 'mosaic':
      return 'This is a mosaic of real orbital images. Individual frames are genuine measurements; the blended mosaic adds resampling, seam removal and partial coverage.';
    case 'measured':
      return 'Real instrument measurements, served as published.';
    default:
      return 'Nothing is rendered for this dataset because no public tile service could be verified. It is listed for transparency only.';
  }
}
