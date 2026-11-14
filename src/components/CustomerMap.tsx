import { useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CandidateResult, DataCenter } from '../engine/types';
import { DISCLAIMER, STATUS_COLOR, STATUS_LABEL, fmtDistance } from '../format';

interface Props {
  dc: DataCenter;
  ranked: CandidateResult[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function LeafletView({ dc, ranked, selectedId, onSelect }: Props) {
  return (
    <MapContainer center={[dc.lat, dc.lon]} zoom={14} scrollWheelZoom={false} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {ranked.map((r) => (
        <Polyline
          key={`l-${r.customer.id}`}
          positions={[
            [dc.lat, dc.lon],
            [r.customer.lat, r.customer.lon],
          ]}
          pathOptions={{
            color: STATUS_COLOR[r.status],
            weight: r.customer.id === selectedId ? 3 : 1.5,
            dashArray: '4 6',
            opacity: r.customer.id === selectedId ? 0.95 : 0.55,
          }}
        />
      ))}
      <CircleMarker center={[dc.lat, dc.lon]} radius={11} pathOptions={{ color: '#fff', weight: 2, fillColor: '#14213d', fillOpacity: 1 }}>
        <Tooltip direction="top" offset={[0, -8]}>
          {dc.name}
        </Tooltip>
      </CircleMarker>
      {ranked.map((r) => {
        const sel = r.customer.id === selectedId;
        return (
          <CircleMarker
            key={`${r.customer.id}-${r.status}-${sel}`}
            center={[r.customer.lat, r.customer.lon]}
            radius={sel ? 11 : 8}
            pathOptions={{ color: sel ? '#14213d' : '#fff', weight: sel ? 3 : 2, fillColor: STATUS_COLOR[r.status], fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(r.customer.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <strong>
                #{r.rank} {r.customer.name}
              </strong>
              <br />
              {STATUS_LABEL[r.status]} · {fmtDistance(r.straightLineM)} away
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

/** Offline fallback: coordinate-based plot with distance rings (no network needed). */
function SchematicView({ dc, ranked, selectedId, onSelect }: Props) {
  const size = 400;
  const half = size / 2;
  const extentM = 3000; // radius shown
  const pxPerM = (half - 24) / extentM;
  const project = (lat: number, lon: number) => {
    const xM = (lon - dc.lon) * Math.cos((dc.lat * Math.PI) / 180) * 111_320;
    const yM = (lat - dc.lat) * 110_540;
    return [half + xM * pxPerM, half - yM * pxPerM];
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="map schematic" role="img" aria-label="Schematic map of candidate customers">
      {[1000, 2000, 3000].map((m) => (
        <g key={m}>
          <circle cx={half} cy={half} r={m * pxPerM} className="ring" />
          <text x={half + 4} y={half - m * pxPerM + 12} className="ring-label">
            {m / 1000} km
          </text>
        </g>
      ))}
      {ranked.map((r) => {
        const [x, y] = project(r.customer.lat, r.customer.lon);
        return <line key={`l-${r.customer.id}`} x1={half} y1={half} x2={x} y2={y} stroke={STATUS_COLOR[r.status]} strokeDasharray="4 5" strokeWidth={r.customer.id === selectedId ? 2.5 : 1.2} opacity={0.7} />;
      })}
      <rect x={half - 9} y={half - 9} width={18} height={18} rx={3} fill="var(--navy)" />
      <text x={half} y={half + 24} textAnchor="middle" className="pt-label strong">
        Data center
      </text>
      {ranked.map((r) => {
        const [x, y] = project(r.customer.lat, r.customer.lon);
        const sel = r.customer.id === selectedId;
        return (
          <g key={r.customer.id} className="pt" onClick={() => onSelect(r.customer.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(r.customer.id)}>
            <circle cx={x} cy={y} r={sel ? 10 : 7} fill={STATUS_COLOR[r.status]} stroke={sel ? 'var(--navy)' : '#fff'} strokeWidth={sel ? 3 : 2} />
            <text x={x} y={y - 13} textAnchor="middle" className={`pt-label ${sel ? 'strong' : ''}`}>
              {r.customer.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CustomerMap(props: Props) {
  const [mode, setMode] = useState<'map' | 'schematic'>('map');
  return (
    <section className="panel map-panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">Nearby buildings</div>
          <div className="panel-sub">Fictional demo locations · dashed lines show straight-line distance, not real pipe routes</div>
        </div>
        <div className="seg" role="tablist">
          <button className={mode === 'map' ? 'active' : ''} onClick={() => setMode('map')}>
            Map
          </button>
          <button className={mode === 'schematic' ? 'active' : ''} onClick={() => setMode('schematic')}>
            Simple view
          </button>
        </div>
      </div>
      {mode === 'map' ? <LeafletView {...props} /> : <SchematicView {...props} />}
      <div className="legend">
        {(['Promising', 'Marginal', 'Not viable'] as const).map((s) => (
          <span key={s}>
            <i style={{ background: STATUS_COLOR[s] }} /> {STATUS_LABEL[s]}
          </span>
        ))}
        <span>
          <i className="dc" /> Data center
        </span>
      </div>
      <p className="note">{DISCLAIMER} “Simple view” works without internet.</p>
    </section>
  );
}
