import { useMemo } from 'react';
import type { Assumptions } from '../engine/types';
import { portfolioElectricityMwh, runModel } from '../engine/run';
import { COOLING_OPTIONS, NEPTUNE_SOURCE, detectCooling, withCooling } from '../data/cooling';
import { DEMO_CUSTOMERS, DEMO_DATA_CENTER } from '../data/demoCustomers';
import { fmtMoney, fmtNum } from '../format';

/**
 * "Why Lenovo" card: the same data center and neighbors under three cooling technologies,
 * recalculated live from the current settings (only capture share and water temperature change).
 */
export function CoolingCompare({ assumptions }: { assumptions: Assumptions }) {
  const rows = useMemo(
    () =>
      COOLING_OPTIONS.map((c) => {
        const run = runModel(withCooling(assumptions, c), DEMO_DATA_CENTER, DEMO_CUSTOMERS);
        return {
          c,
          mw: run.supply.recoverableHeatMw,
          good: run.ranked.filter((r) => r.status === 'Promising').length,
          possible: run.ranked.filter((r) => r.status === 'Marginal').length,
          usedMwh: run.portfolio.totalAllocatedMwh,
          unmetMwh: run.portfolio.totalUnmetDemandMwh,
          savings: run.portfolio.totalNetAnnualSavings,
          // kWh of heat-pump electricity per MWh of heat actually used: fair across options that serve different amounts.
          kwhPerMwh: run.portfolio.totalAllocatedMwh > 0 ? (portfolioElectricityMwh(run.portfolio) * 1000) / run.portfolio.totalAllocatedMwh : 0,
        };
      }),
    [assumptions],
  );
  const maxMw = Math.max(...rows.map((r) => r.mw), 1);
  const current = detectCooling(assumptions)?.id;
  const air = rows[0];
  const liquid = rows[rows.length - 1];
  const heatGain = air.mw > 0 ? Math.round((liquid.mw / air.mw - 1) * 100) : 0;

  return (
    <section className="card cooling-card">
      <div className="card-head">
        <div>
          <div className="card-title">Why liquid cooling matters</div>
          <div className="card-sub">Same data center, same neighbors. Only the cooling changes.</div>
        </div>
        <span className="chip-soft">Lenovo Neptune-style cooling: +{heatGain}% usable heat vs. air</span>
      </div>

      <div className="cool-cols">
        {rows.map((r) => (
          <div key={r.c.id} className={`cool-col ${r.c.id === 'liquid' ? 'featured' : ''}`}>
            <div className="cool-head">
              <strong>{r.c.label}</strong>
              {r.c.id === current && <span className="you-tag">Your settings</span>}
            </div>
            <div className="cool-big">
              {fmtNum(r.mw, 1)}
              <small> MW usable heat</small>
            </div>
            <div className="cool-bar">
              <span style={{ width: `${(r.mw / maxMw) * 100}%` }} />
            </div>
            <dl className="cool-stats">
              <div>
                <dt>Good / possible matches</dt>
                <dd>
                  {r.good} / {r.possible}
                </dd>
              </div>
              <div>
                <dt>Savings per year</dt>
                <dd>{fmtMoney(r.savings)}</dd>
              </div>
              <div>
                <dt>Demand left unmet</dt>
                <dd className={r.unmetMwh > 0 ? 'warn' : ''}>{r.unmetMwh > 0 ? `${fmtNum(r.unmetMwh)} MWh` : 'None'}</dd>
              </div>
              <div>
                <dt>Electricity per MWh of heat</dt>
                <dd>{fmtNum(r.kwhPerMwh)} kWh</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <p className="fineprint">
        Warmer water means less boosting, so less electricity per unit of heat. More captured heat means more buildings can be served when supply is tight (try scenario C).
        Liquid-cooling water temperature: 45 °C, Lenovo’s published inlet maximum (
        <a href={NEPTUNE_SOURCE.url} target="_blank" rel="noreferrer">
          DS0187
        </a>
        ). All other cooling values are illustrative. Shown as strategic fit, not a Lenovo endorsement.
      </p>
    </section>
  );
}
