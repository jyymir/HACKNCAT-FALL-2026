import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CandidateResult, DataCenter } from '../engine/types';
import { STATUS_COLOR, STATUS_LABEL, fmtDistance, fmtNum } from '../format';

interface Props {
  dc: DataCenter;
  ranked: CandidateResult[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Free OpenStreetMap vector tiles (no API key) with real building heights for 3D context. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const VIEW_3D = { pitch: 55, bearing: -25 };
const VIEW_2D = { pitch: 0, bearing: 0 };

/** Column height (m) encodes yearly heat demand, not real building height. */
const MIN_COLUMN_M = 40;
const MAX_COLUMN_M = 520;
const DC_HEIGHT_M = 110;

type Ring = [number, number][];

/** Small square footprint (lon/lat ring) centred on a point, `halfM` metres from centre to edge. */
function square(lat: number, lon: number, halfM: number): Ring {
  const dLat = halfM / 110_540;
  const dLon = halfM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat],
  ];
}

function buildGeoJSON(dc: DataCenter, ranked: CandidateResult[], selectedId: string) {
  const maxDemand = Math.max(...ranked.map((r) => r.customer.annualDemandMwh), 1);
  const columns = ranked.map((r) => {
    const sel = r.customer.id === selectedId;
    return {
      type: 'Feature' as const,
      properties: {
        id: r.customer.id,
        color: STATUS_COLOR[r.status],
        height: MIN_COLUMN_M + (r.customer.annualDemandMwh / maxDemand) * (MAX_COLUMN_M - MIN_COLUMN_M),
        selected: sel ? 1 : 0,
      },
      geometry: { type: 'Polygon' as const, coordinates: [square(r.customer.lat, r.customer.lon, sel ? 58 : 46)] },
    };
  });
  const labels = ranked.map((r) => ({
    type: 'Feature' as const,
    properties: { id: r.customer.id, label: `${r.customer.name}\n${STATUS_LABEL[r.status]}`, selected: r.customer.id === selectedId ? 1 : 0 },
    geometry: { type: 'Point' as const, coordinates: [r.customer.lon, r.customer.lat] },
  }));
  const pipes = ranked.map((r) => ({
    type: 'Feature' as const,
    properties: { id: r.customer.id, color: STATUS_COLOR[r.status], selected: r.customer.id === selectedId ? 1 : 0 },
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [dc.lon, dc.lat],
        [r.customer.lon, r.customer.lat],
      ],
    },
  }));
  const dcFeature = {
    type: 'Feature' as const,
    properties: { height: DC_HEIGHT_M },
    geometry: { type: 'Polygon' as const, coordinates: [square(dc.lat, dc.lon, 50)] },
  };
  return {
    columns: { type: 'FeatureCollection' as const, features: columns },
    labels: { type: 'FeatureCollection' as const, features: labels },
    pipes: { type: 'FeatureCollection' as const, features: pipes },
    dc: { type: 'FeatureCollection' as const, features: [dcFeature] },
  };
}

/**
 * Default camera. 3D: centred on the data center at zoom ≥ 14 so real OSM 3D buildings render
 * (far candidates come into view when selected). 2D: fit every candidate.
 */
function frameAll(map: MLMap, dc: DataCenter, ranked: CandidateResult[], is3d: boolean, duration: number) {
  if (is3d) {
    map.easeTo({ center: [dc.lon, dc.lat], zoom: 14.1, ...VIEW_3D, duration });
    return;
  }
  const lons = [dc.lon, ...ranked.map((r) => r.customer.lon)];
  const lats = [dc.lat, ...ranked.map((r) => r.customer.lat)];
  const cam = map.cameraForBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    { padding: 50 },
  );
  if (cam) map.easeTo({ ...cam, ...VIEW_2D, duration });
}

/** If the selected building is off-screen (or under the controls), glide so it and the data center are both visible. */
function revealSelected(map: MLMap, dc: DataCenter, sel: CandidateResult | undefined) {
  if (!sel) return;
  const { width, height } = map.getCanvas().getBoundingClientRect();
  const p = map.project([sel.customer.lon, sel.customer.lat]);
  const inView = p.x > 40 && p.x < width - 60 && p.y > 70 && p.y < height - 40;
  if (inView) return;
  map.easeTo({ center: [(dc.lon + sel.customer.lon) / 2, (dc.lat + sel.customer.lat) / 2], duration: 900 });
}

/** WebGL map (MapLibre) with real OSM 3D buildings and our candidates as demand columns. */
function MapLibreView({ dc, ranked, selectedId, onSelect, is3d, onFail }: Props & { is3d: boolean; onFail: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const loaded = useRef(false);
  const latest = useRef({ dc, ranked, selectedId, onSelect });
  latest.current = { dc, ranked, selectedId, onSelect };
  const latestMode = useRef(is3d);
  latestMode.current = is3d;

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    let map: MLMap;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: STYLE_URL,
        center: [dc.lon, dc.lat],
        zoom: 13.6,
        ...(is3d ? VIEW_3D : VIEW_2D),
        maxPitch: 70,
        attributionControl: { compact: true },
        cooperativeGestures: false,
      });
    } catch {
      onFail(); // e.g. WebGL not available
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.scrollZoom.disable(); // page scroll stays page scroll; use +/- or pinch

    // If the style/tiles can't load (offline), fall back to the offline view.
    const timeout = window.setTimeout(() => {
      if (!loaded.current) onFail();
    }, 15_000);

    // Expose map state on the element (handy for debugging/automated checks): style → loaded → idle.
    const setState = (st: string) => container.current?.setAttribute('data-map-state', st);
    setState('loading');
    map.on('idle', () => setState(`idle:${map.getLayer('hm-columns') ? 'columns' : 'no-columns'}:${map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' }).length}-buildings`));

    map.on('load', () => {
      setState('loaded');
      loaded.current = true;
      window.clearTimeout(timeout);
      const { dc, ranked, selectedId } = latest.current;
      const data = buildGeoJSON(dc, ranked, selectedId);
      frameAll(map, dc, ranked, latestMode.current, 0);
      revealSelected(map, dc, ranked.find((r) => r.customer.id === selectedId));

      // Real buildings as quiet grey context.
      if (map.getLayer('building-3d')) {
        map.setPaintProperty('building-3d', 'fill-extrusion-color', '#d9d9dc');
        map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.55);
      }

      map.addSource('hm-pipes', { type: 'geojson', data: data.pipes });
      map.addSource('hm-columns', { type: 'geojson', data: data.columns });
      map.addSource('hm-dc', { type: 'geojson', data: data.dc });
      map.addSource('hm-labels', { type: 'geojson', data: data.labels });

      map.addLayer({
        id: 'hm-pipes',
        type: 'line',
        source: 'hm-pipes',
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'selected'], 1], 5, 2.5],
          'line-opacity': ['case', ['==', ['get', 'selected'], 1], 0.95, 0.6],
          'line-dasharray': [1.5, 1.5],
        },
      });
      map.addLayer({
        id: 'hm-dc',
        type: 'fill-extrusion',
        source: 'hm-dc',
        paint: { 'fill-extrusion-color': '#e2231a', 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-opacity': 0.95 },
      });
      map.addLayer({
        id: 'hm-columns',
        type: 'fill-extrusion',
        source: 'hm-columns',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.92,
        },
      });
      map.addLayer({
        id: 'hm-labels',
        type: 'symbol',
        source: 'hm-labels',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['case', ['==', ['get', 'selected'], 1], 13, 11],
          'text-offset': [0, -1.6],
          'text-anchor': 'bottom',
          'text-allow-overlap': false,
          'symbol-sort-key': ['case', ['==', ['get', 'selected'], 1], 0, 1],
        },
        paint: { 'text-color': '#111111', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
      });

      const pick = (e: maplibregl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === 'string') latest.current.onSelect(id);
      };
      for (const layer of ['hm-columns', 'hm-labels']) {
        map.on('click', layer, pick);
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }
    });

    return () => {
      window.clearTimeout(timeout);
      loaded.current = false;
      mapRef.current = null;
      map.remove();
    };
    // Map is created once; later prop changes are pushed in by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new results / selection into the map without recreating it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    const data = buildGeoJSON(dc, ranked, selectedId);
    (map.getSource('hm-columns') as GeoJSONSource | undefined)?.setData(data.columns);
    (map.getSource('hm-labels') as GeoJSONSource | undefined)?.setData(data.labels);
    (map.getSource('hm-pipes') as GeoJSONSource | undefined)?.setData(data.pipes);
  }, [dc, ranked, selectedId]);

  // Bring a newly selected building into view.
  useEffect(() => {
    const map = mapRef.current;
    if (map && loaded.current) revealSelected(map, dc, ranked.find((r) => r.customer.id === selectedId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Animate between 2D and 3D camera.
  useEffect(() => {
    const map = mapRef.current;
    if (map && loaded.current) frameAll(map, latest.current.dc, latest.current.ranked, is3d, 900);
  }, [is3d]);

  const sel = ranked.find((r) => r.customer.id === selectedId);
  return (
    <div className="map gl-map-wrap">
      <div ref={container} className="gl-map" role="region" aria-label="3D map of the data center and nearby buildings" />
      {sel && (
        <div className="map-chip">
          <strong>{sel.customer.name}</strong> · {fmtNum(sel.customer.annualDemandMwh)} MWh/yr · {fmtDistance(sel.straightLineM)}
        </div>
      )}
    </div>
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
      <rect x={half - 9} y={half - 9} width={18} height={18} rx={3} fill="var(--red)" />
      <text x={half} y={half + 24} textAnchor="middle" className="pt-label strong">
        Data center
      </text>
      {ranked.map((r) => {
        const [x, y] = project(r.customer.lat, r.customer.lon);
        const sel = r.customer.id === selectedId;
        return (
          <g key={r.customer.id} className="pt" onClick={() => onSelect(r.customer.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(r.customer.id)}>
            <circle cx={x} cy={y} r={sel ? 10 : 7} fill={STATUS_COLOR[r.status]} stroke={sel ? 'var(--ink)' : '#fff'} strokeWidth={sel ? 3 : 2} />
            <text x={x} y={y - 13} textAnchor="middle" className={`pt-label ${sel ? 'strong' : ''}`}>
              {r.customer.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type Mode = '3d' | '2d' | 'offline';

export function CustomerMap(props: Props) {
  const [mode, setMode] = useState<Mode>('3d');
  const [failed, setFailed] = useState(false);
  const live = mode !== 'offline' && !failed;

  return (
    <section className="card map-card">
      <div className="card-head">
        <div className="card-title">Nearby buildings</div>
        <div className="seg-pills small" role="group" aria-label="Map style">
          {(['3d', '2d', 'offline'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)} disabled={m !== 'offline' && failed}>
              {m === '3d' ? '3D' : m === '2d' ? '2D' : 'Offline view'}
            </button>
          ))}
        </div>
      </div>

      {live ? <MapLibreView {...props} is3d={mode === '3d'} onFail={() => setFailed(true)} /> : <SchematicView {...props} />}
      {failed && <p className="map-note">The live map couldn’t load (no internet or no WebGL), so the offline view is shown.</p>}

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
      <p className="fineprint">
        {live
          ? 'Fictional demo buildings. Column height = yearly heat demand (not building height). Grey 3D buildings are real OpenStreetMap context. Dashed lines are straight-line distance, not pipe routes. Drag to pan; right-drag or Ctrl-drag to tilt and rotate.'
          : 'Fictional demo locations. Dashed lines are straight-line distance, not pipe routes.'}
      </p>
    </section>
  );
}
