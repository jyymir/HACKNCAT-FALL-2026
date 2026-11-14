import type { CandidateResult } from '../engine/types';
import { SavingsChart } from '../components/ResultsCharts';
import { CategoryTile, Info, NextStep, PageHeader, StatusBadge } from '../components/ui';
import { fmtDistance, fmtMoney, fmtNum } from '../format';

export function ComparePage({ ranked, selectedId, onOpen }: { ranked: CandidateResult[]; selectedId: string; onOpen: (id: string) => void }) {
  return (
    <div className="page">
      <PageHeader
        title="Compare"
        sub={
          <>
            Best to worst. Click a row for details.{' '}
            <Info>Each row imagines that building is the only one connected, so rows can’t simply be added up. “Share heat” shows them together.</Info>
          </>
        }
      />

      <section className="card">
        <div className="table-wrap">
          <table className="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Building</th>
                <th className="r">Distance</th>
                <th className="r">Uses / supplied</th>
                <th className="r">Temp</th>
                <th className="r">Saves / yr</th>
                <th className="r">Payback</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr
                  key={r.customer.id}
                  className={r.customer.id === selectedId ? 'selected' : ''}
                  onClick={() => onOpen(r.customer.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onOpen(r.customer.id)}
                >
                  <td className="rank">{r.rank}</td>
                  <td>
                    <div className="bld">
                      <CategoryTile category={r.customer.category} />
                      <div>
                        <strong>{r.customer.name}</strong>
                        <span>{r.customer.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="r">{fmtDistance(r.straightLineM)}</td>
                  <td className="r">
                    {fmtNum(r.customer.annualDemandMwh)}
                    <span className="sub"> / {fmtNum(r.individual.deliveredHeatMwh)} MWh</span>
                  </td>
                  <td className="r">{r.customer.requiredTempC} °C</td>
                  <td className={`r strong ${r.individual.netAnnualSavings < 0 ? 'neg' : 'pos'}`}>{fmtMoney(r.individual.netAnnualSavings)}</td>
                  <td className="r">{r.individual.simplePaybackYears === null ? 'Never' : `${r.individual.simplePaybackYears.toFixed(1)} yrs`}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SavingsChart ranked={ranked} selectedId={selectedId} onSelect={onOpen} />

      <NextStep label="Share heat" href="#share" back={{ label: 'Matches', href: '#matches' }} />
    </div>
  );
}
