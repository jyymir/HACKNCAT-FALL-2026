import { useEffect, useState } from 'react';
import type { Assumptions, Portfolio, SupplySummary } from '../engine/types';
import { SCENARIOS } from '../data/demoCustomers';
import { GROUPS, type FieldDef } from '../data/fields';
import { MWH_PER_HOME, fmtNum } from '../format';
import { Info, NextStep, PageIntro } from '../components/ui';
import { WhatIfBox } from '../components/AiPanels';

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
        <label htmlFor={`f-${def.key}`}>{def.label}</label>
        <Info>{def.help}</Info>
      </div>
      <div className="field-row">
        <input
          type="range"
          aria-label={def.label}
          min={def.min}
          max={def.max}
          step={def.step}
          value={Math.min(def.max, Math.max(def.min, shown))}
          onChange={(e) => onChange(round(Number(e.target.value) / scale))}
        />
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
      {!valid(text) && (
        <div className="field-error">
          Please enter a number from {def.min} to {def.max}.
        </div>
      )}
    </div>
  );
}

function HeatFlow({ a, supply, portfolio }: { a: Assumptions; supply: SupplySummary; portfolio: Portfolio }) {
  const captured = a.itLoadMw * a.heatCaptureFraction;
  const deliveredMw = supply.recoverableHeatMw * (1 - a.distributionLossFraction);
  const steps = [
    { label: 'Servers use', value: `${fmtNum(a.itLoadMw, 1)} MW`, sub: 'electricity → heat' },
    { label: 'Heat captured', value: `${fmtNum(captured, 1)} MW`, sub: `${fmtNum(a.heatCaptureFraction * 100)}% caught in water` },
    { label: 'After heat exchanger', value: `${fmtNum(supply.recoverableHeatMw, 2)} MW`, sub: 'usable heat' },
    { label: 'Reaches buildings', value: `${fmtNum(deliveredMw, 2)} MW`, sub: `after ${fmtNum(a.distributionLossFraction * 100)}% pipe losses` },
  ];
  const max = a.itLoadMw || 1;
  return (
    <aside className="panel flow-panel">
      <div className="panel-title">What this data center produces</div>
      <div className="panel-sub">Updates instantly as you change the settings.</div>
      <div className="flow">
        {steps.map((s, i) => {
          const mw = [a.itLoadMw, captured, supply.recoverableHeatMw, deliveredMw][i];
          return (
            <div key={s.label} className="flow-step">
              <div className="flow-top">
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
              <div className="flow-bar">
                <span style={{ width: `${(mw / max) * 100}%` }} />
              </div>
              <div className="flow-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>
      <div className="flow-total">
        <div>
          <span>Usable heat per year</span>
          <strong>{fmtNum(supply.networkAvailableHeatMwh)} MWh</strong>
        </div>
        <div>
          <span>Actually used by matched buildings</span>
          <strong>{fmtNum(portfolio.totalAllocatedMwh)} MWh</strong>
        </div>
        <div>
          <span>Roughly enough heat for</span>
          <strong>~{fmtNum(supply.networkAvailableHeatMwh / MWH_PER_HOME)} homes</strong>
        </div>
      </div>
      <p className="note">
        Simplified model. Not all of this heat can be sold. Only heat a building actually uses counts toward savings. The homes figure is a rough illustration
        (~{MWH_PER_HOME} MWh/home/yr).
      </p>
    </aside>
  );
}

export function SetupPage({
  assumptions,
  onChange,
  onScenario,
  activeScenario,
  supply,
  portfolio,
}: {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  onScenario: (id: string) => void;
  activeScenario: string | null;
  supply: SupplySummary;
  portfolio: Portfolio;
}) {
  return (
    <div className="page">
      <PageIntro step="Step 1 of 5" title="Describe the data center">
        Pick a ready-made scenario or adjust the numbers yourself. Hover the <span className="info inline">?</span> icons for plain explanations. Every other page
        updates automatically.
      </PageIntro>

      <section className="panel">
        <div className="panel-title">Try a what-if scenario</div>
        <div className="scenario-cards">
          {SCENARIOS.map((s) => (
            <button key={s.id} className={`scenario ${activeScenario === s.id ? 'active' : ''}`} onClick={() => onScenario(s.id)}>
              <strong>{s.label}</strong>
              <span>{s.description}</span>
            </button>
          ))}
        </div>
        {activeScenario === null && <p className="note">You’re using custom settings. Pick a scenario above to reset.</p>}
      </section>

      <WhatIfBox assumptions={assumptions} onApply={onChange} />

      <div className="setup-grid">
        <div className="setup-fields">
          {GROUPS.map((g) => {
            const body = (
              <div className="field-grid">
                {g.fields.map((f) => (
                  <Field key={f.key} def={f} value={assumptions[f.key]} onChange={(v) => onChange({ ...assumptions, [f.key]: v })} />
                ))}
              </div>
            );
            return g.expert ? (
              <details key={g.title} className="panel">
                <summary>
                  <span className="panel-title">{g.title}</span>
                  <span className="panel-sub"> {g.blurb}</span>
                </summary>
                {body}
              </details>
            ) : (
              <section key={g.title} className="panel">
                <div className="panel-title">{g.title}</div>
                <div className="panel-sub">{g.blurb}</div>
                {body}
              </section>
            );
          })}
          <p className="note">Default values are for demonstration only, not universal engineering values.</p>
        </div>
        <HeatFlow a={assumptions} supply={supply} portfolio={portfolio} />
      </div>

      <NextStep label="See which neighbors fit" href="#matches" back={{ label: 'Home', href: '#' }} />
    </div>
  );
}
