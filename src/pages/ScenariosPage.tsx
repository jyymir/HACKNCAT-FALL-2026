import { useMemo, useState, type FormEvent } from 'react';
import { Copy, Pencil, Trash2, Upload } from 'lucide-react';
import type { Assumptions } from '../engine/types';
import { runModel, summarize, type ModelOptions, type RunSummary } from '../engine/run';
import { DEMO_CUSTOMERS, DEMO_DATA_CENTER, SCENARIOS } from '../data/demoCustomers';
import { detectCooling } from '../data/cooling';
import type { SavedScenario } from '../data/savedScenarios';
import { fmtMoney, fmtNum, fmtPayback } from '../format';
import { PageHeader } from '../components/ui';

interface Column {
  key: string;
  name: string;
  assumptions: Assumptions;
  seasonal: boolean;
}

type Better = 'high' | 'low' | null;
const METRICS: { label: string; get: (s: RunSummary) => number | null; fmt: (v: number | null) => string; better: Better }[] = [
  { label: 'Usable heat', get: (s) => s.usableHeatMw, fmt: (v) => `${fmtNum(v ?? 0, 1)} MW`, better: 'high' },
  { label: 'Heat actually used', get: (s) => s.heatUsedMwh, fmt: (v) => `${fmtNum(v ?? 0)} MWh`, better: 'high' },
  { label: 'Good / possible matches', get: (s) => s.good * 100 + s.possible, fmt: (v) => `${Math.floor((v ?? 0) / 100)} / ${(v ?? 0) % 100}`, better: 'high' },
  { label: 'Savings per year', get: (s) => s.savings, fmt: (v) => fmtMoney(v ?? 0), better: 'high' },
  { label: 'Setup cost', get: (s) => s.capex, fmt: (v) => fmtMoney(v ?? 0), better: null },
  { label: 'Payback', get: (s) => s.payback, fmt: (v) => fmtPayback(v), better: 'low' },
  { label: 'Backup heating needed', get: (s) => s.unmetMwh, fmt: (v) => `${fmtNum(v ?? 0)} MWh`, better: null }, // not ranked: fewer eligible buildings also lowers it
  { label: 'CO₂ avoided (illustrative)', get: (s) => s.emissionsT, fmt: (v) => `${fmtNum(v ?? 0)} t/yr`, better: 'high' },
];

const settingsLine = (a: Assumptions, seasonal: boolean) =>
  [
    detectCooling(a)?.short ?? `${Math.round(a.heatCaptureFraction * 100)}% · ${a.sourceTempC} °C`,
    `${fmtNum(a.itLoadMw, 1)} MW`,
    `$${a.electricityPricePerKwh.toFixed(2)}/kWh`,
    `$${fmtNum(a.pipelineCostPerM)}/m pipe`,
    seasonal ? 'monthly demand' : 'annual demand',
  ].join(' · ');

export function ScenariosPage({
  current,
  activeId,
  saved,
  onSave,
  onLoad,
  onDuplicate,
  onRename,
  onDelete,
}: {
  current: { assumptions: Assumptions; options: ModelOptions };
  activeId: string;
  saved: SavedScenario[];
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDuplicate: (s: SavedScenario) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>(() => saved.slice(-2).map((s) => s.id).concat(saved.length ? [] : ['unfavorable']));
  const [editing, setEditing] = useState<string | null>(null);

  const all: Column[] = [
    ...SCENARIOS.map((s) => ({ key: s.id, name: s.label, assumptions: s.assumptions, seasonal: current.options.seasonal })),
    ...saved.map((s) => ({ key: s.id, name: s.name, assumptions: s.assumptions, seasonal: s.seasonal })),
  ];
  const columns: Column[] = [
    { key: 'current', name: 'Current settings', assumptions: current.assumptions, seasonal: current.options.seasonal },
    ...picked.map((k) => all.find((c) => c.key === k)).filter((c): c is Column => Boolean(c)),
  ];

  const summaries = useMemo(
    () => columns.map((c) => summarize(runModel(c.assumptions, DEMO_DATA_CENTER, DEMO_CUSTOMERS, { seasonal: c.seasonal }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(columns.map((c) => [c.assumptions, c.seasonal]))],
  );

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= 3 ? [...p.slice(1), key] : [...p, key]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(name);
    setName('');
  };

  /** Index of the best column for a metric (only when values actually differ). */
  const bestIndex = (m: (typeof METRICS)[number]) => {
    if (!m.better) return -1;
    const vals = summaries.map((s) => m.get(s));
    const valid = vals.map((v, i) => [v, i] as const).filter(([v]) => v !== null) as [number, number][];
    if (valid.length < 2 || valid.every(([v]) => v === valid[0][0])) return -1;
    return valid.reduce((best, cur) => ((m.better === 'high' ? cur[0] > best[0] : cur[0] < best[0]) ? cur : best))[1];
  };

  return (
    <div className="page">
      <PageHeader title="Scenarios" sub="Save what-ifs and compare them side by side." />

      <section className="card">
        <div className="card-title">Save the current settings</div>
        <div className="card-sub">{settingsLine(current.assumptions, current.options.seasonal)}</div>
        <form className="ai-form" onSubmit={submit}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name it, e.g. “Liquid cooling, pricey power”" maxLength={60} aria-label="Scenario name" />
          <button className="pill dark">Save scenario</button>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Side by side</div>
            <div className="card-sub">Pick up to 3 to compare with your current settings. Best value in each row is marked.</div>
          </div>
        </div>
        <div className="ai-examples">
          {all.map((c) => (
            <button key={c.key} className={`chip ${picked.includes(c.key) ? 'chip-on' : ''}`} onClick={() => toggle(c.key)}>
              {picked.includes(c.key) ? '✓ ' : '+ '}
              {c.name}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="scen-table">
            <thead>
              <tr>
                <th />
                {columns.map((c) => (
                  <th key={c.key}>
                    <strong>{c.name}</strong>
                    <span>{settingsLine(c.assumptions, c.seasonal)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const best = bestIndex(m);
                return (
                  <tr key={m.label}>
                    <td className="scen-label">{m.label}</td>
                    {summaries.map((s, i) => (
                      <td key={columns[i].key} className={i === best ? 'best' : ''}>
                        {m.fmt(m.get(s))}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="fineprint">Presets use your current demand model (monthly or annual). Saved scenarios keep the one they were saved with.</p>
      </section>

      <section className="card">
        <div className="card-title">Your saved scenarios</div>
        {saved.length === 0 ? (
          <p className="card-sub">None yet. Save one above, or save an AI what-if from Set up without applying it.</p>
        ) : (
          <div className="saved-list">
            {saved.map((s) => (
              <div key={s.id} className={`saved-row ${activeId === s.id ? 'active' : ''}`}>
                <div className="saved-main">
                  {editing === s.id ? (
                    <input
                      className="rename"
                      defaultValue={s.name}
                      autoFocus
                      maxLength={60}
                      aria-label="Rename scenario"
                      onBlur={(e) => {
                        if (e.target.value.trim()) onRename(s.id, e.target.value.trim());
                        setEditing(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                  ) : (
                    <strong>
                      {s.name}
                      {activeId === s.id && <span className="you-tag">In use</span>}
                    </strong>
                  )}
                  <span>{settingsLine(s.assumptions, s.seasonal)}</span>
                </div>
                <div className="saved-actions">
                  <button className="icon-btn" title="Load these settings" onClick={() => onLoad(s.id)}>
                    <Upload size={16} /> Load
                  </button>
                  <button className="icon-btn" title="Rename" onClick={() => setEditing(s.id)}>
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn" title="Duplicate" onClick={() => onDuplicate(s)}>
                    <Copy size={16} />
                  </button>
                  <button className="icon-btn danger" title="Delete" onClick={() => onDelete(s.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="fineprint">Saved in this browser only.</p>
      </section>
    </div>
  );
}
