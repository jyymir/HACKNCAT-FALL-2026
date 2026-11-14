import type { CandidateResult } from '../engine/types';
import { SavingsChart } from '../components/ResultsCharts';
import { NextStep, PageIntro, StatusBadge } from '../components/ui';
import { fmtDistance, fmtMoney, fmtNum } from '../format';

export function ComparePage({ ranked, selectedId, onSelect }: { ranked: CandidateResult[]; selectedId: string; onSelect: (id: string) => void }) {
  const open = (id: string) => {
    onSelect(id);
    window.location.hash = 'matches';
  };
  return (
    <div className="page">
      <PageIntro step="Step 3 of 5" title="Compare the buildings side by side">
        Ranked from best to worst: good matches first, then fastest payback. Each row imagines that building is the <strong>only</strong> one connected, so the
        rows can’t all be added together. Step 4 shows what happens when they share the heat. Click a row to see its full explanation.
      </PageIntro>

      <section className="panel">
        <div className="table-wrap">
          <table className="rank-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Building</th>
                <th className="r">Distance</th>
                <th className="r">Heat it uses</th>
                <th className="r">Temp needed</th>
                <th className="r">Heat we supply</th>
                <th className="r">Saves per year</th>
                <th className="r">Pays back in</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr
                  key={r.customer.id}
                  className={r.customer.id === selectedId ? 'selected' : ''}
                  onClick={() => open(r.customer.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && open(r.customer.id)}
                >
                  <td>{r.rank}</td>
                  <td>
                    <div className="cand-name">{r.customer.name}</div>
                    <div className="cand-cat">{r.customer.category}</div>
                  </td>
                  <td className="r">{fmtDistance(r.straightLineM)}</td>
                  <td className="r">{fmtNum(r.customer.annualDemandMwh)} MWh</td>
                  <td className="r">{r.customer.requiredTempC} °C</td>
                  <td className="r">{fmtNum(r.individual.deliveredHeatMwh)} MWh</td>
                  <td className={`r ${r.individual.netAnnualSavings < 0 ? 'neg' : ''}`}>{fmtMoney(r.individual.netAnnualSavings)}</td>
                  <td className="r">{r.individual.simplePaybackYears === null ? 'Never' : `${r.individual.simplePaybackYears.toFixed(1)} yrs`}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Heat amounts are per year (MWh). All building data is illustrative, not measured consumption.</p>
      </section>

      <SavingsChart ranked={ranked} selectedId={selectedId} onSelect={open} />

      <NextStep label="Share out the heat" href="#share" back={{ label: 'Matches', href: '#matches' }} />
    </div>
  );
}
