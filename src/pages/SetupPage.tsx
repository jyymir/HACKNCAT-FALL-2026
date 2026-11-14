import { useEffect, useState } from 'react';
import type { Assumptions, Portfolio, SupplySummary } from '../engine/types';
import { SCENARIOS } from '../data/demoCustomers';
import { GROUPS, type FieldDef } from '../data/fields';
import { MWH_PER_HOME, fmtNum } from '../format';
import { Info, NextStep, PageHeader } from '../components/ui';
import { WhatIfBox } from '../components/AiPanels';
import type { ModelOptions } from '../engine/run';
import { CLIMATE_SOURCE } from '../data/climate';
import { COOLING_OPTIONS, detectCooling, withCooling } from '../data/cooling';

function CoolingPicker({ a, onChange }: { a: Assumptions; onChange: (a: Assumptions) => void }) {
  const current = detectCooling(a)?.id;
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="card-title">How is the data center cooled?</div>
          <div className="card-sub">Sets how much heat is caught and how warm the water is.</div>
        </div>
        {!current && (
          <span className="fineprint inline">
            Now: {Math.round(a.heatCaptureFraction * 100)}% captured · {a.sourceTempC} °C (not one of these presets)
          </span>
        )}
      </div>
      <div className="cool-pick">
        {COOLING_OPTIONS.map((c) => (
          <button key={c.id} className={`cool-option ${current === c.id ? 'active' : ''}`} onClick={() => onChange(withCooling(a, c))}>
            <span className="cool-option-top">
              <strong>{c.label}</strong>
              {c.id === 'liquid' && <span className="chip-soft">Lenovo Neptune-style</span>}
            </span>
            <span className="cool-desc">{c.description}</span>
            <span className="cool-vals">
              {Math.round(c.heatCaptureFraction * 100)}% captured · {c.sourceTempC} °C water
            </span>
            <span className="cool-basis">{c.source ? 'Water temp from Lenovo datasheet · capture illustrative' : 'Illustrative values'}</span>
          </button>
        ))}
      </div>
    </section>
  );
}


const round = (v: number) => Math.round(v * 1e6) / 1e6;

function Field({ def, value, onChange }: { def: FieldDef; value: number; onChange: (v: number) => void }) {
  const scale = def.scale ?? 1;
  const shown = round(value * scale);
  const [text, setText] = useState(String(shown));
  useEffect(() => setText(String(shown)), [shown]);

  const valid = (t: string) => t.trim() !== '' && Number.isFinite(Number(t)) && Number(t) >= def.min && Number(t) <= def.max;
  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(n)) return setText(String(shown));
    const clamped = Math.min(def.max, Math.max(def.min, n));
    onChange(round(clamped / scale));
    setText(String(clamped));
  };

  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={`f-${def.key}`}>
          {def.label} <Info>{def.help}</Info>
        </label>
        <div className={`num ${valid(text) ? '' : 'invalid'}`}>
          <input
            id={`f-${def.key}`}
            type="number"
            inputMode="decimal"
            min={def.min}
            max={def.max}
            step={def.step}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (valid(e.target.value)) onChange(round(Number(e.target.value) / scale));
            }}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
          />
          <span className="unit">{def.unit}</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={def.label}
        min={def.min}
        max={def.max}
        step={def.step}
        value={Math.min(def.max, Math.max(def.min, shown))}
        onChange={(e) => onChange(round(Number(e.target.value) / scale))}
      />
      {!valid(text) && (
        <div className="field-error">
          Enter {def.min}–{def.max}
        </div>
      )}
    </div>
  );
}

function HeatFlow({ a, supply, portfolio }: { a: Assumptions; supply: SupplySummary; portfolio: Portfolio }) {
  const captured = a.itLoadMw * a.heatCaptureFraction;
  const reaches = supply.recoverableHeatMw * (1 - a.distributionLossFraction);
  const max = a.itLoadMw || 1;
  const steps = [
    { label: 'Servers use', mw: a.itLoadMw },
    { label: 'Heat captured', mw: captured },
    { label: 'Usable heat', mw: supply.recoverableHeatMw },
    { label: 'Reaches buildings', mw: reaches },
  ];
  return (
    <div className="card">
      <div className="card-title">Heat flow</div>
      <div className="flow">
        {steps.map((s, i) => (
          <div key={s.label} className="flow-step">
            <div className="flow-top">
              <span>{s.label}</span>
              <strong>{fmtNum(s.mw, i === 0 ? 1 : 2)} MW</strong>
            </div>
            <div className={`flow-bar ${i >= 2 ? 'cool' : ''}`}>
              <span style={{ width: `${(s.mw / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flow-total">
        <div>
          <span>Usable per year</span>
          <strong>{fmtNum(supply.networkAvailableHeatMwh)} MWh</strong>
        </div>
        <div>
          <span>Actually used</span>
          <strong>{fmtNum(portfolio.totalAllocatedMwh)} MWh</strong>
        </div>
        <div>
          <span>About the same as</span>
          <strong>~{fmtNum(supply.networkAvailableHeatMwh / MWH_PER_HOME)} homes*</strong>
        </div>
      </div>
      <p className="fineprint">* Rough illustration (~{MWH_PER_HOME} MWh/home/yr). Only heat a building actually uses counts toward savings.</p>
    </div>
  );
}

function DemandModelCard({ options, onOptions }: { options: ModelOptions; onOptions: (o: ModelOptions) => void }) {
  return (
    <section className="card demand-card">
      <div>
        <div className="card-title">
          When do buildings need heat?{' '}
          <Info>
            Monthly mode spreads each building’s yearly heat use by local weather (heating degree-days) plus a year-round share for hot water or process heat.
            The data center makes the same heat every month, so winter can run short while summer has heat to spare. Weather: {CLIMATE_SOURCE.basis}.
          </Info>
        </div>
        <div className="card-sub">{options.seasonal ? 'More heat needed in winter, less in summer.' : 'Simplified: demand spread evenly over the year.'}</div>
      </div>
      <div className="seg-pills" role="group" aria-label="Demand model">
        <button className={options.seasonal ? 'active' : ''} onClick={() => onOptions({ seasonal: true })}>
          Month by month (weather)
        </button>
        <button className={!options.seasonal ? 'active' : ''} onClick={() => onOptions({ seasonal: false })}>
          Yearly average
        </button>
      </div>
    </section>
  );
}

export function SetupPage({
  assumptions,
  options,
  onOptions,
  onSaveScenario,
  onChange,
  onScenario,
  activeScenario,
  supply,
  portfolio,
}: {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  onScenario: (id: string) => void;
  activeScenario: string;
  options: ModelOptions;
  onOptions: (o: ModelOptions) => void;
  onSaveScenario: (name: string, a: Assumptions) => void;
  supply: SupplySummary;
  portfolio: Portfolio;
}) {
  const main = GROUPS.filter((g) => !g.expert);
  const expert = GROUPS.filter((g) => g.expert);
  const field = (f: FieldDef) => <Field key={f.key} def={f} value={assumptions[f.key]} onChange={(v) => onChange({ ...assumptions, [f.key]: v })} />;

  return (
    <div className="page">
      <PageHeader title="Set up" sub="Describe the data center. Every page updates as you go." />

      <div className="seg-pills" role="group" aria-label="Scenarios">
        {SCENARIOS.map((s) => (
          <button key={s.id} className={activeScenario === s.id ? 'active' : ''} title={s.description} onClick={() => onScenario(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <CoolingPicker a={assumptions} onChange={onChange} />
      <DemandModelCard options={options} onOptions={onOptions} />

      <div className="setup-grid">
        <div className="card">
          {main.map((g) => (
            <section key={g.title} className="field-group">
              <div className="card-title">{g.title}</div>
              <div className="field-grid">{g.fields.map(field)}</div>
            </section>
          ))}
          {expert.map((g) => (
            <details key={g.title} className="field-group expert">
              <summary className="card-title">{g.title}</summary>
              <div className="field-grid">{g.fields.map(field)}</div>
            </details>
          ))}
        </div>

        <div className="side-stack">
          <HeatFlow a={assumptions} supply={supply} portfolio={portfolio} />
          <WhatIfBox assumptions={assumptions} options={options} onApply={onChange} onSaveScenario={onSaveScenario} />
        </div>
      </div>

      <NextStep label="See matches" href="#matches" back={{ label: 'Overview', href: '#' }} />
    </div>
  );
}
