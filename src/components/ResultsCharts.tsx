import type { CandidateResult, Portfolio } from '../engine/types';
import { MWH_PER_HOME, STATUS_COLOR, fmtMoney, fmtNum, fmtPayback } from '../format';

/** Diverging horizontal bar chart of individual net annual savings. */
export function SavingsChart({ ranked, selectedId, onSelect }: { ranked: CandidateResult[]; selectedId: string; onSelect: (id: string) => void }) {
  const vals = ranked.map((r) => r.individual.netAnnualSavings);
  const maxPos = Math.max(0, ...vals);
  const maxNeg = Math.max(0, ...vals.map((v) => -v));
  const span = maxPos + maxNeg || 1;
  const zeroPct = (maxNeg / span) * 100;

  return (
    <section className="card">
      <div className="card-head">
        <div className="card-title">Yearly savings</div>
        <span className="fineprint inline">Right = saves money · Left = loses money</span>
      </div>
      <div className="bars">
        {ranked.map((r) => {
          const v = r.individual.netAnnualSavings;
          const w = (Math.abs(v) / span) * 100;
          return (
            <button key={r.customer.id} className={`bar-row ${r.customer.id === selectedId ? 'selected' : ''}`} onClick={() => onSelect(r.customer.id)}>
              <span className="bar-label">{r.customer.name}</span>
              <span className="bar-track">
                <span className="bar-zero" style={{ left: `${zeroPct}%` }} />
                <span className="bar" style={{ background: STATUS_COLOR[r.status], width: `${w}%`, left: v >= 0 ? `${zeroPct}%` : `${zeroPct - w}%` }} />
              </span>
              <span className={`bar-value ${v < 0 ? 'neg' : ''}`}>{fmtMoney(v)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Lenovo-inspired allocation palette: red, black, greys. */
const PALETTE = ['#E2231A', '#1a1a1a', '#f08a84', '#6b6b6b', '#a8160f', '#b5b5b5', '#3a3a3a', '#d9d9d9'];

/** Greedy shared-supply allocation: the view that can all happen at once. */
export function PortfolioPanel({ portfolio: p, ranked }: { portfolio: Portfolio; ranked: CandidateResult[] }) {
  const byId = new Map(ranked.map((r) => [r.customer.id, r]));
  const allocated = p.allocations.filter((x) => x.allocatedMwh > 0);
  const total = p.supplyMwh || 1;
  const usedPct = (p.totalAllocatedMwh / total) * 100;
  const eligible = p.allocations.filter((x) => byId.get(x.customerId)?.status !== 'Not viable');

  return (
    <>
      <section className="card">
        <div className="share-top">
          <div>
            <span className="kpi-label">Heat put to use</span>
            <strong className="kpi-num">
              {fmtNum(usedPct)}
              <small>%</small>
            </strong>
            <span className="kpi-sub">
              {fmtNum(p.totalAllocatedMwh)} of {fmtNum(p.supplyMwh)} MWh a year · ≈ {fmtNum(p.totalAllocatedMwh / MWH_PER_HOME)} homes’ worth
            </span>
          </div>
          <div className="share-money">
            <div>
              <span>Savings / yr</span>
              <strong>{fmtMoney(p.totalNetAnnualSavings)}</strong>
            </div>
            <div>
              <span>Setup cost</span>
              <strong>{fmtMoney(p.totalCapex)}</strong>
            </div>
            <div>
              <span>Payback</span>
              <strong>{fmtPayback(p.portfolioPaybackYears)}</strong>
            </div>
          </div>
        </div>

        <div className="stack" aria-label="Share of usable heat given to each building">
          {allocated.map((x, i) => (
            <span
              key={x.customerId}
              style={{ width: `${(x.allocatedMwh / total) * 100}%`, background: PALETTE[i % PALETTE.length] }}
              title={`${byId.get(x.customerId)?.customer.name}: ${fmtNum(x.allocatedMwh)} MWh`}
            />
          ))}
          <span className="unused" style={{ width: `${(p.remainingUnusedMwh / total) * 100}%` }} title="Unused heat" />
        </div>
        <div className="stack-legend">
          {allocated.map((x, i) => (
            <span key={x.customerId}>
              <i style={{ background: PALETTE[i % PALETTE.length] }} />
              {byId.get(x.customerId)?.customer.name}
            </span>
          ))}
          <span>
            <i className="unused-swatch" />
            Unused
          </span>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Who gets heat</div>
        <table className="alloc-table">
          <thead>
            <tr>
              <th>Building</th>
              <th className="r">Gets</th>
              <th className="r">Backup heating</th>
            </tr>
          </thead>
          <tbody>
            {eligible.map((x) => {
              const idx = allocated.findIndex((y) => y.customerId === x.customerId);
              return (
                <tr key={x.customerId}>
                  <td>
                    <i className="swatch" style={{ background: idx >= 0 ? PALETTE[idx % PALETTE.length] : 'var(--line)' }} />
                    {byId.get(x.customerId)?.customer.name}
                  </td>
                  <td className="r">{x.allocatedMwh > 0 ? `${fmtNum(x.allocatedMwh)} MWh` : 'None left'}</td>
                  <td className={`r ${x.unmetDemandMwh > 0 ? 'warn' : 'muted'}`}>{x.unmetDemandMwh > 0 ? `${fmtNum(x.unmetDemandMwh)} MWh` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

/**
 * Month-by-month balance: delivered heat + backup heating needed (stacked = eligible demand),
 * against the data center's monthly supply (dashed tick). Only shown in monthly mode.
 */
export function MonthlyChart({ portfolio: p }: { portfolio: Portfolio }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const max = Math.max(...p.periods.map((x) => Math.max(x.supplyMwh, x.demandMwh)), 1);
  const worst = p.periods.reduce((w, x, i) => (x.unmetMwh > p.periods[w].unmetMwh ? i : w), 0);
  const summer = [5, 6, 7]; // Jun–Aug
  const sumSupply = summer.reduce((s, i) => s + p.periods[i].supplyMwh, 0);
  const sumUnused = summer.reduce((s, i) => s + p.periods[i].unusedMwh, 0);
  const summerUnusedPct = sumSupply > 0 ? (sumUnused / sumSupply) * 100 : 0;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Month by month</div>
          <div className="card-sub">Steady data-center heat vs. weather-driven building demand.</div>
        </div>
        <div className="month-facts">
          {p.periods[worst].unmetMwh > 0 && (
            <span className="status-pill warn">
              {months[worst]}: {fmtNum(p.periods[worst].unmetMwh)} MWh short
            </span>
          )}
          <span className="status-pill neutral">Summer: {fmtNum(summerUnusedPct)}% of heat unused</span>
        </div>
      </div>

      <div className="month-chart" role="img" aria-label="Monthly heat supply, delivered heat and backup heating needed">
        {p.periods.map((x, i) => (
          <div key={i} className="mc-col" title={`${months[i]}: supply ${fmtNum(x.supplyMwh)} · demand ${fmtNum(x.demandMwh)} · delivered ${fmtNum(x.deliveredMwh)} · backup ${fmtNum(x.unmetMwh)} MWh`}>
            <div className="mc-plot">
              <span className="mc-supply" style={{ bottom: `${(x.supplyMwh / max) * 100}%` }} />
              <div className="mc-stack" style={{ height: `${(x.demandMwh / max) * 100}%` }}>
                <span className="mc-unmet" style={{ flexGrow: x.unmetMwh }} />
                <span className="mc-delivered" style={{ flexGrow: x.deliveredMwh }} />
              </div>
            </div>
            <span className="mc-label">{months[i]}</span>
          </div>
        ))}
      </div>
      <div className="stack-legend">
        <span>
          <i style={{ background: 'var(--red)' }} />
          Heat delivered
        </span>
        <span>
          <i className="unmet-swatch" />
          Backup heating needed
        </span>
        <span>
          <i className="supply-swatch" />
          Heat available from data center
        </span>
      </div>
    </section>
  );
}
