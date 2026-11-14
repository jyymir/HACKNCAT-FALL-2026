import type { Allocation, Assumptions, CandidateResult, DataCenter, Portfolio, SupplySummary } from '../engine/types';
import { CustomerMap } from '../components/CustomerMap';
import { AskBox } from '../components/AiPanels';
import { buildMatchContext } from '../ai/context';
import type { ModelOptions } from '../engine/run';
import { MONTHS } from '../data/climate';

/** 12 tiny bars: the building's monthly heat use, with the part this supply could cover filled in. */
function MonthlyMini({ r }: { r: CandidateResult }) {
  const max = Math.max(...r.demandByPeriod, 1);
  return (
    <div className="mini-months" aria-label="Heat use by month">
      {r.demandByPeriod.map((d, i) => (
        <div key={i} className="mm-col" title={`${MONTHS[i]}: needs ${fmtNum(d)} MWh, covered ${fmtNum(r.deliveredByPeriod[i])} MWh`}>
          <div className="mm-bar" style={{ height: `${(d / max) * 100}%` }}>
            <span style={{ height: `${d > 0 ? (r.deliveredByPeriod[i] / d) * 100 : 0}%` }} />
          </div>
          <span className="mm-label">{MONTHS[i][0]}</span>
        </div>
      ))}
    </div>
  );
}
import { CategoryTile, Info, NextStep, PageHeader, StatusBadge } from '../components/ui';
import { STATUS_CLASS, fmtDistance, fmtMoney, fmtNum, fmtPayback } from '../format';

/** One short, plain sentence summarizing the verdict. */
function headline(r: CandidateResult): string {
  const e = r.individual;
  if (!r.technicallyServable) return 'Needs hotter heat than this system can make.';
  if (e.simplePaybackYears === null) return `Would lose about ${fmtMoney(-e.netAnnualSavings)} a year.`;
  const pb = e.simplePaybackYears.toFixed(1);
  if (r.status === 'Promising') return `Pays back its ${fmtMoney(e.connectionCapex)} setup cost in about ${pb} years.`;
  if (r.status === 'Marginal') return `Works, but the ${fmtMoney(e.connectionCapex)} setup cost takes ~${pb} years to recover.`;
  return `Saves too little to justify a ${fmtMoney(e.connectionCapex)} setup cost (~${pb} years).`;
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="kv">
    <span>{k}</span>
    <strong>{v}</strong>
  </div>
);

function Detail({ r, allocation, a }: { r: CandidateResult; allocation?: Allocation; a: Assumptions }) {
  const e = r.individual;
  return (
    <section className="card detail" aria-live="polite">
      <div className={`detail-hero ${STATUS_CLASS[r.status]}`}>
        <div className="detail-id">
          <CategoryTile category={r.customer.category} size="lg" />
          <div>
            <h2>{r.customer.name}</h2>
            <span>
              {r.customer.category} · {fmtDistance(r.straightLineM)} away
            </span>
          </div>
        </div>
        <StatusBadge status={r.status} technical />
        <div className="detail-num">
          <strong className={e.netAnnualSavings < 0 ? 'neg' : ''}>{fmtMoney(e.netAnnualSavings)}</strong>
          <span>net savings / year</span>
        </div>
        <p className="detail-headline">{headline(r)}</p>
      </div>

      <ul className="reasons">
        {/* The headline already states the payback, so skip the duplicate payback reason. */}
        {(e.simplePaybackYears !== null ? r.reasons.slice(1) : r.reasons).slice(0, 3).map((x, i) => (
          <li key={i} className={x.tone}>
            {x.text}
          </li>
        ))}
      </ul>

      <div className="stat-tiles">
        <div>
          <span>Heat it uses</span>
          <strong>{fmtNum(r.customer.annualDemandMwh)} MWh/yr</strong>
        </div>
        <div>
          <span>Needs water at</span>
          <strong>{r.customer.requiredTempC} °C</strong>
        </div>
        <div>
          <span>
            Heat-pump efficiency <Info>Units of heat made per unit of electricity (COP). Higher is better. It drops as the needed temperature rises. Simplified estimate.</Info>
          </span>
          <strong>{r.technicallyServable ? `${e.cop.toFixed(1)}×` : 'n/a'}</strong>
        </div>
      </div>

      {r.demandByPeriod.length === 12 && (
        <div className="fold-static">
          <div className="kv-title-row">
            <span>Heat use by month</span>
            <span className="fineprint inline">Winter peak, summer dip (weather-based)</span>
          </div>
          <MonthlyMini r={r} />
        </div>
      )}

      <details className="fold">
        <summary>Money breakdown</summary>
        <Row k="+ Heating bill avoided" v={fmtMoney(e.avoidedHeatingCost)} />
        <Row k="− Heat-pump electricity" v={fmtMoney(e.heatPumpElectricityCost)} />
        <Row k="− Yearly upkeep" v={fmtMoney(e.maintenanceCost)} />
        <Row k="= Net per year" v={fmtMoney(e.netAnnualSavings)} />
        <Row k="One-time setup cost" v={fmtMoney(e.connectionCapex)} />
        <Row k="Pays back in" v={fmtPayback(e.simplePaybackYears)} />
      </details>

      <details className="fold">
        <summary>Technical details</summary>
        <Row k={`Pipe route (straight line × ${a.routeMultiplier})`} v={fmtDistance(r.routeLengthM)} />
        <Row k="Heat supplied" v={r.technicallyServable ? `${fmtNum(e.deliveredHeatMwh)} MWh-th/yr` : 'None'} />
        <Row k="Temperature lift · COP" v={`${fmtNum(e.temperatureLiftC)} °C · ${e.cop.toFixed(2)}`} />
        <Row k="Heat-pump electricity" v={`${fmtNum(e.heatPumpElectricityMwh)} MWh-e/yr`} />
        <Row k="Capex: pipe · equipment · fixed" v={`${fmtMoney(e.pipelineCapex)} · ${fmtMoney(e.equipmentCapex)} · ${fmtMoney(a.fixedConnectionCost)}`} />
        <Row k="Net avoided emissions (illustrative)" v={`${fmtNum(e.netAvoidedEmissionsT)} t CO₂e/yr`} />
        <Row k="Shared-heat allocation" v={allocation && allocation.allocatedMwh > 0 ? `${fmtNum(allocation.allocatedMwh)} MWh-th` : 'Not allocated'} />
      </details>

      <p className="fineprint">Illustrative estimate. A real project needs site-specific engineering checks.</p>
    </section>
  );
}

export function MatchesPage({
  dc,
  ranked,
  selected,
  allocation,
  assumptions,
  options,
  supply,
  portfolio,
  onSelect,
}: {
  options: ModelOptions;
  dc: DataCenter;
  ranked: CandidateResult[];
  selected: CandidateResult;
  allocation?: Allocation;
  assumptions: Assumptions;
  supply: SupplySummary;
  portfolio: Portfolio;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="page">
      <PageHeader title="Matches" sub="Pick a building to see if it’s a fit, and why." />

      <div className="matches-grid">
        <div className="col">
          <CustomerMap dc={dc} ranked={ranked} selectedId={selected.customer.id} onSelect={onSelect} />
          <div className="card list-card">
            {ranked.map((r) => (
              <button
                key={r.customer.id}
                className={`list-row ${r.customer.id === selected.customer.id ? 'selected' : ''}`}
                onClick={() => onSelect(r.customer.id)}
              >
                <CategoryTile category={r.customer.category} />
                <span className="list-main">
                  <strong>{r.customer.name}</strong>
                  <span>
                    {r.customer.category} · {fmtDistance(r.straightLineM)}
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </div>
        </div>
        <div className="col">
          <Detail r={selected} allocation={allocation} a={assumptions} />
          <AskBox
            key={selected.customer.id}
            selected={selected}
            ranked={ranked}
            buildContext={() => buildMatchContext(selected, ranked, assumptions, supply, portfolio, options)}
          />
        </div>
      </div>

      <NextStep label="Compare all" href="#compare" back={{ label: 'Set up', href: '#setup' }} />
    </div>
  );
}
