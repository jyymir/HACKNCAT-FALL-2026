import type { CandidateResult, Portfolio } from '../engine/types';
import { PortfolioPanel } from '../components/ResultsCharts';
import { NextStep, PageIntro } from '../components/ui';
import { fmtNum } from '../format';

export function SharePage({ portfolio, ranked }: { portfolio: Portfolio; ranked: CandidateResult[] }) {
  const excluded = ranked.filter((r) => r.status === 'Not viable');
  const short = portfolio.totalUnmetDemandMwh > 0;

  return (
    <div className="page">
      <PageIntro step="Step 4 of 5" title="Share out the heat">
        The data center only makes so much heat, so the same heat can’t go to two buildings. HeatMatch hands it out in rank order. The best match gets what it
        needs first, then the next, until the heat runs out. Buildings that are “not a fit” are skipped.
      </PageIntro>

      <div className={`callout ${short ? 'warn' : 'ok'}`}>
        {short ? (
          <>
            <strong>Not enough heat for everyone.</strong> Matched buildings want {fmtNum(portfolio.totalUnmetDemandMwh)} MWh more per year than is available. Try
            a bigger data center or better heat capture on the Set-up page.
          </>
        ) : (
          <>
            <strong>Every matched building gets all the heat it needs</strong>, with {fmtNum(portfolio.remainingUnusedMwh)} MWh per year left over. That leftover
            heat would still go to waste unless more customers are found.
          </>
        )}
      </div>

      <PortfolioPanel portfolio={portfolio} ranked={ranked} />

      {excluded.length > 0 && (
        <section className="panel">
          <div className="panel-title">Skipped (not a fit)</div>
          <div className="panel-sub">These get no heat because connecting them wouldn’t pay off under the current settings.</div>
          <ul className="plain-list">
            {excluded.map((r) => (
              <li key={r.customer.id}>
                <strong>{r.customer.name}</strong>: {r.reasons[0]?.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <NextStep label="Get the report" href="#report" back={{ label: 'Compare', href: '#compare' }} />
    </div>
  );
}
