import { ArrowRight, Sparkles } from 'lucide-react';
import type { CandidateResult, Portfolio, SupplySummary } from '../engine/types';
import { MWH_PER_HOME, STATUS_CLASS, fmtMoney, fmtNum, fmtPayback } from '../format';
import { CategoryTile, StatusBadge } from '../components/ui';

export function HomePage({
  supply,
  ranked,
  portfolio,
  onOpen,
}: {
  supply: SupplySummary;
  ranked: CandidateResult[];
  portfolio: Portfolio;
  onOpen: (id: string) => void;
}) {
  const good = ranked.filter((r) => r.status === 'Promising').length;
  const usedPct = supply.networkAvailableHeatMwh > 0 ? (portfolio.totalAllocatedMwh / supply.networkAvailableHeatMwh) * 100 : 0;
  const top = ranked.slice(0, 3);

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-chips">
          <span className="glass-chip">{fmtNum(supply.recoverableHeatMw, 1)} MW usable heat</span>
          <span className="glass-chip">
            {good} of {ranked.length} good matches
          </span>
        </div>
        <h1>
          Turn data-center heat
          <br />
          <em>into local warmth.</em>
        </h1>
        <p>Find which nearby buildings could use waste heat from an AI data center, and whether it pays off.</p>
        <div className="hero-actions">
          <a className="pill light" href="#setup">
            Start setup <ArrowRight size={16} />
          </a>
          <a className="pill glass" href="#matches">
            See matches
          </a>
        </div>
      </section>

      <section className="kpis">
        <div className="card kpi">
          <span className="kpi-label">Usable heat</span>
          <strong className="kpi-num">
            {fmtNum(supply.recoverableHeatMw, 1)}
            <small> MW</small>
          </strong>
          <span className="kpi-sub">{fmtNum(supply.networkAvailableHeatMwh)} MWh a year after pipe losses</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Heat put to use</span>
          <strong className="kpi-num">
            {fmtNum(usedPct)}
            <small>%</small>
          </strong>
          <div className="meter">
            <span style={{ width: `${Math.min(100, usedPct)}%` }} />
          </div>
          <span className="kpi-sub">≈ {fmtNum(portfolio.totalAllocatedMwh / MWH_PER_HOME)} homes’ worth of heat*</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Yearly savings, all matches</span>
          <strong className="kpi-num">{fmtMoney(portfolio.totalNetAnnualSavings)}</strong>
          <span className="kpi-sub">Pays back in {fmtPayback(portfolio.portfolioPaybackYears).toLowerCase()}</span>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Top matches</h2>
          <a href="#compare" className="link">
            Compare all <ArrowRight size={14} />
          </a>
        </div>
        <div className="match-cards">
          {top.map((r) => (
            <button key={r.customer.id} className={`match-card ${STATUS_CLASS[r.status]}`} onClick={() => onOpen(r.customer.id)}>
              <div className="match-card-top">
                <CategoryTile category={r.customer.category} />
                <StatusBadge status={r.status} />
              </div>
              <strong className="match-name">{r.customer.name}</strong>
              <span className="match-num">{fmtMoney(r.individual.netAnnualSavings)}</span>
              <span className="match-sub">saved per year · pays back in {fmtPayback(r.individual.simplePaybackYears).toLowerCase()}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="split">
        <div className="card idea">
          <h2>Close by isn’t enough</h2>
          <p>A good match needs the right temperature, enough heat demand, a short pipe, and electricity that costs less than the heating it replaces.</p>
          <div className="factors">
            <span>🌡️ Temperature</span>
            <span>🔥 Demand</span>
            <span>📏 Distance</span>
            <span>⚡ Power cost</span>
          </div>
        </div>
        <div className="card promo">
          <Sparkles size={22} />
          <h2>
            Ask a <span className="outline-word">what-if</span>
          </h2>
          <p>“What if electricity got 50% more expensive?” Type it in plain English and watch every result update.</p>
          <a className="pill red" href="#setup">
            Try it
          </a>
        </div>
      </section>

      <p className="fineprint">
        * Rough illustration at ~{MWH_PER_HOME} MWh per home per year. All buildings are fictional demo data, not real customers.
      </p>
    </div>
  );
}
