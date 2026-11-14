import type { Allocation, Assumptions, CandidateResult, DataCenter, Portfolio, SupplySummary } from '../engine/types';
import { AskBox } from '../components/AiPanels';
import { buildMatchContext } from '../ai/context';
import { CustomerMap } from '../components/CustomerMap';
import { Info, NextStep, PageIntro, StatusBadge } from '../components/ui';
import { STATUS_BLURB, STATUS_CLASS, fmtDistance, fmtMoney, fmtNum, fmtPayback } from '../format';

function headline(r: CandidateResult): string {
  const e = r.individual;
  const n = r.customer.name;
  if (!r.technicallyServable) return `${n} isn’t a fit: it needs hotter heat than this system can make.`;
  if (e.simplePaybackYears === null) return `${n} isn’t a fit: it would lose about ${fmtMoney(-e.netAnnualSavings)} a year.`;
  const pb = e.simplePaybackYears.toFixed(0);
  if (r.status === 'Promising')
    return `${n} looks like a good match. It could save about ${fmtMoney(e.netAnnualSavings)} a year and pay back its ${fmtMoney(e.connectionCapex)} setup cost in about ${pb} years.`;
  if (r.status === 'Marginal')
    return `${n} could work, but slowly. It saves about ${fmtMoney(e.netAnnualSavings)} a year, so the ${fmtMoney(e.connectionCapex)} setup cost takes about ${pb} years to recover.`;
  return `${n} isn’t a fit: it saves only ${fmtMoney(e.netAnnualSavings)} a year against a ${fmtMoney(e.connectionCapex)} setup cost (~${pb} years to pay back).`;
}

function MoneyFlow({ r }: { r: CandidateResult }) {
  const e = r.individual;
  const items = [
    { label: 'Heating bill avoided', value: e.avoidedHeatingCost, sign: '+' },
    { label: 'Electricity for the heat pump', value: -e.heatPumpElectricityCost, sign: '−' },
    { label: 'Yearly upkeep', value: -e.maintenanceCost, sign: '−' },
  ];
  return (
    <div className="money">
      <div className="kv-title">Money each year (modeled)</div>
      {items.map((x) => (
        <div key={x.label} className="money-row">
          <span>
            <b className={x.value >= 0 ? 'plus' : 'minus'}>{x.sign}</b> {x.label}
          </span>
          <span>{fmtMoney(Math.abs(x.value))}</span>
        </div>
      ))}
      <div className={`money-row total ${e.netAnnualSavings < 0 ? 'neg' : ''}`}>
        <span>= Net savings per year</span>
        <span>{fmtMoney(e.netAnnualSavings)}</span>
      </div>
      <div className="money-row">
        <span>One-time setup cost (pipe + equipment)</span>
        <span>{fmtMoney(e.connectionCapex)}</span>
      </div>
      <div className="money-row">
        <span>Time to pay for itself</span>
        <strong>{fmtPayback(e.simplePaybackYears)}</strong>
      </div>
    </div>
  );
}

function Detail({ r, allocation, a }: { r: CandidateResult; allocation?: Allocation; a: Assumptions }) {
  const e = r.individual;
  return (
    <section className={`panel detail tone-${STATUS_CLASS[r.status]}`} aria-live="polite">
      <div className="detail-head">
        <div>
          <div className="panel-sub">
            {r.customer.category} · {fmtDistance(r.straightLineM)} away · <em>{r.customer.dataQuality}</em>
          </div>
          <h3>{r.customer.name}</h3>
          <div className="panel-sub">Uses heat for: {r.customer.heatUse.toLowerCase()}</div>
        </div>
        <StatusBadge status={r.status} technical />
      </div>

      <p className="headline">{headline(r)}</p>

      <div className="kv-title">Why</div>
      <ul className="reasons">
        {r.reasons.map((x, i) => (
          <li key={i} className={x.tone}>
            {x.text}
          </li>
        ))}
      </ul>

      <div className="facts">
        <div>
          <span>Heat it uses</span>
          <strong>{fmtNum(r.customer.annualDemandMwh)} MWh/yr</strong>
        </div>
        <div>
          <span>Water temperature it needs</span>
          <strong>{r.customer.requiredTempC} °C</strong>
        </div>
        <div>
          <span>Heat we could supply</span>
          <strong>{r.technicallyServable ? `${fmtNum(e.deliveredHeatMwh)} MWh/yr` : 'None'}</strong>
        </div>
        <div>
          <span>
            Heat-pump efficiency <Info>Units of heat produced per unit of electricity (COP). Higher is better. The bigger the temperature boost, the lower it gets. This is a simplified estimate.</Info>
          </span>
          <strong>{r.technicallyServable ? `${e.cop.toFixed(1)}×` : 'n/a'}</strong>
        </div>
      </div>

      <MoneyFlow r={r} />

      <details className="tech">
        <summary>Show technical details</summary>
        <div className="kv-grid">
          <div>
            <Row k="Straight-line distance" v={fmtDistance(r.straightLineM)} />
            <Row k={`Estimated pipe route (× ${a.routeMultiplier})`} v={fmtDistance(r.routeLengthM)} />
            <Row k="Heat available to this building (after losses)" v={`${fmtNum(r.heatAvailableToCustomerMwh)} MWh-th`} />
            <Row k="Temperature lift" v={`${fmtNum(e.temperatureLiftC)} °C`} />
            <Row k="COP (demo heuristic)" v={e.cop.toFixed(2)} />
            <Row k="Heat-pump electricity" v={`${fmtNum(e.heatPumpElectricityMwh)} MWh-e`} />
          </div>
          <div>
            <Row k="Pipeline capex" v={fmtMoney(e.pipelineCapex)} />
            <Row k="Fixed connection" v={fmtMoney(a.fixedConnectionCost)} />
            <Row k="Heat-pump equipment" v={fmtMoney(e.equipmentCapex)} />
            <Row k="Annual operating cost" v={fmtMoney(e.annualOperatingCost)} />
            <Row k="Net avoided emissions (illustrative)" v={`${fmtNum(e.netAvoidedEmissionsT)} t CO₂e/yr`} />
            <Row k="Shared-supply allocation" v={allocation && allocation.allocatedMwh > 0 ? `${fmtNum(allocation.allocatedMwh)} MWh-th` : 'Not allocated'} />
          </div>
        </div>
      </details>
      <p className="note">Modeled estimate with illustrative data. A real project needs site-specific engineering checks.</p>
    </section>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="kv">
    <span className="k">{k}</span>
    <span className="v">{v}</span>
  </div>
);

export function MatchesPage({
  dc,
  ranked,
  selected,
  allocation,
  assumptions,
  supply,
  portfolio,
  onSelect,
}: {
  dc: DataCenter;
  supply: SupplySummary;
  portfolio: Portfolio;
  ranked: CandidateResult[];
  selected: CandidateResult;
  allocation?: Allocation;
  assumptions: Assumptions;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="page">
      <PageIntro step="Step 2 of 5" title="Which neighbors could use the heat?">
        Each dot is a nearby building (fictional demo examples). Click one, on the map or in the list, to see the verdict and the reasons in plain language.
      </PageIntro>

      <div className="matches-grid">
        <div className="matches-left">
          <CustomerMap dc={dc} ranked={ranked} selectedId={selected.customer.id} onSelect={onSelect} />
          <div className="cand-cards" role="list">
            {ranked.map((r) => (
              <button
                key={r.customer.id}
                role="listitem"
                className={`cand-card ${r.customer.id === selected.customer.id ? 'selected' : ''} ${STATUS_CLASS[r.status]}`}
                onClick={() => onSelect(r.customer.id)}
              >
                <span className="cand-rank">#{r.rank}</span>
                <span className="cand-main">
                  <strong>{r.customer.name}</strong>
                  <span>
                    {r.customer.category} · {fmtDistance(r.straightLineM)}
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </div>
          <div className="legend-box">
            {(['Promising', 'Marginal', 'Not viable'] as const).map((s) => (
              <div key={s}>
                <StatusBadge status={s} technical /> <span>{STATUS_BLURB[s]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="matches-right">
          <Detail r={selected} allocation={allocation} a={assumptions} />
          <AskBox
            key={selected.customer.id}
            selected={selected}
            ranked={ranked}
            buildContext={() => buildMatchContext(selected, ranked, assumptions, supply, portfolio)}
          />
        </div>
      </div>

      <NextStep label="Compare them side by side" href="#compare" back={{ label: 'Data center settings', href: '#setup' }} />
    </div>
  );
}
