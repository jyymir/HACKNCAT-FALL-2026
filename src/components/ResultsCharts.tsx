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
    <section className="panel">
      <div className="panel-title">Yearly savings by building</div>
      <div className="panel-sub">Bars to the right save money. Bars to the left lose money. Modeled $ per year.</div>
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

const PALETTE = ['#0f766e', '#14b8a6', '#5eead4', '#2563eb', '#60a5fa', '#7c3aed', '#a78bfa', '#94a3b8'];

/** Greedy shared-supply allocation: the view that can all happen at once. */
export function PortfolioPanel({ portfolio: p, ranked }: { portfolio: Portfolio; ranked: CandidateResult[] }) {
  const byId = new Map(ranked.map((r) => [r.customer.id, r]));
  const allocated = p.allocations.filter((x) => x.allocatedMwh > 0);
  const total = p.supplyMwh || 1;
  const usedPct = (p.totalAllocatedMwh / total) * 100;

  return (
    <section className="panel">
      <div className="panel-title">Where the heat goes</div>
      <div className="panel-sub">One bar represents all the usable heat in a year. Colored parts go to buildings. The striped part goes unused.</div>

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
      <div className="stack-caption">
        <span>{fmtNum(usedPct)}% used</span>
        <span>{fmtNum(100 - usedPct)}% unused</span>
      </div>

      <div className="mini-cards">
        <div>
          <span>Usable heat per year</span>
          <strong>{fmtNum(p.supplyMwh)} MWh</strong>
        </div>
        <div>
          <span>Given to buildings</span>
          <strong>{fmtNum(p.totalAllocatedMwh)} MWh</strong>
          <em>~{fmtNum(p.totalAllocatedMwh / MWH_PER_HOME)} homes’ worth</em>
        </div>
        <div>
          <span>Left over</span>
          <strong>{fmtNum(p.remainingUnusedMwh)} MWh</strong>
        </div>
        <div>
          <span>Buildings still wanting heat</span>
          <strong className={p.totalUnmetDemandMwh > 0 ? 'warn' : ''}>{fmtNum(p.totalUnmetDemandMwh)} MWh short</strong>
        </div>
        <div>
          <span>Total savings per year</span>
          <strong>{fmtMoney(p.totalNetAnnualSavings)}</strong>
        </div>
        <div>
          <span>Total setup cost · pays back in</span>
          <strong>
            {fmtMoney(p.totalCapex)} · {fmtPayback(p.portfolioPaybackYears)}
          </strong>
        </div>
      </div>

      <table className="alloc-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Building</th>
            <th className="r">Heat given</th>
            <th className="r">Still needs</th>
          </tr>
        </thead>
        <tbody>
          {p.allocations
            .filter((x) => byId.get(x.customerId)?.status !== 'Not viable')
            .map((x, i) => {
              const idx = allocated.findIndex((y) => y.customerId === x.customerId);
              return (
                <tr key={x.customerId}>
                  <td>
                    <i className="swatch" style={{ background: idx >= 0 ? PALETTE[idx % PALETTE.length] : 'var(--line)' }} /> {i + 1}
                  </td>
                  <td>{byId.get(x.customerId)?.customer.name}</td>
                  <td className="r">{x.allocatedMwh > 0 ? `${fmtNum(x.allocatedMwh)} MWh` : 'None left'}</td>
                  <td className={`r ${x.unmetDemandMwh > 0 ? 'warn' : ''}`}>{x.unmetDemandMwh > 0 ? `${fmtNum(x.unmetDemandMwh)} MWh` : 'Fully covered'}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </section>
  );
}
