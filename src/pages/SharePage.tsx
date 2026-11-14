import type { CandidateResult, Portfolio } from '../engine/types';
import { MonthlyChart, PortfolioPanel } from '../components/ResultsCharts';
import { Info, NextStep, PageHeader } from '../components/ui';
import { fmtNum } from '../format';

export function SharePage({ portfolio, ranked }: { portfolio: Portfolio; ranked: CandidateResult[] }) {
  const excluded = ranked.filter((r) => r.status === 'Not viable');
  const short = portfolio.totalUnmetDemandMwh > 0;

  return (
    <div className="page">
      <PageHeader
        title="Share heat"
        sub={
          <>
            One supply, handed out best match first.{' '}
            <Info>The same heat can’t go to two buildings. Matches get what they need in rank order until the heat runs out. “Not a fit” buildings are skipped.</Info>
          </>
        }
      >
        <span className={`status-pill ${short ? 'warn' : 'ok'}`}>
          {short ? `${fmtNum(portfolio.totalUnmetDemandMwh)} MWh needs backup heating` : `${fmtNum(portfolio.remainingUnusedMwh)} MWh spare`}
        </span>
      </PageHeader>

      <PortfolioPanel portfolio={portfolio} ranked={ranked} />

      {portfolio.periods.length === 12 && <MonthlyChart portfolio={portfolio} />}

      {excluded.length > 0 && (
        <details className="card fold-card">
          <summary className="card-title">Skipped buildings ({excluded.length})</summary>
          <ul className="plain-list">
            {excluded.map((r) => (
              <li key={r.customer.id}>
                <strong>{r.customer.name}</strong>: {r.reasons[0]?.text}
              </li>
            ))}
          </ul>
        </details>
      )}

      <NextStep label="Get report" href="#report" back={{ label: 'Compare', href: '#compare' }} />
    </div>
  );
}
