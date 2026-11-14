import { useEffect, useMemo, useState } from 'react';
import type { Assumptions } from './engine/types';
import { computeSupply } from './engine/thermal';
import { allocatePortfolio, evaluateCandidates } from './engine/matching';
import { DEFAULT_ASSUMPTIONS, DEMO_CUSTOMERS, DEMO_DATA_CENTER, SCENARIOS } from './data/demoCustomers';
import { Report } from './components/Report';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { MatchesPage } from './pages/MatchesPage';
import { ComparePage } from './pages/ComparePage';
import { SharePage } from './pages/SharePage';
import { ReportPage } from './pages/ReportPage';
import { fmtNum } from './format';

const PAGES = [
  { id: '', label: 'Home', step: '' },
  { id: 'setup', label: 'Set up', step: '1' },
  { id: 'matches', label: 'Find matches', step: '2' },
  { id: 'compare', label: 'Compare', step: '3' },
  { id: 'share', label: 'Share heat', step: '4' },
  { id: 'report', label: 'Report', step: '5' },
] as const;
type PageId = (typeof PAGES)[number]['id'];

/** Tiny hash router: #setup, #matches, … (no extra dependency, works from a static file). */
function useHashPage(): PageId {
  const read = () => {
    const h = window.location.hash.replace(/^#\/?/, '');
    return (PAGES.find((p) => p.id === h)?.id ?? '') as PageId;
  };
  const [page, setPage] = useState<PageId>(read);
  useEffect(() => {
    const onHash = () => {
      setPage(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return page;
}

export default function App() {
  const page = useHashPage();
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [scenarioId, setScenarioId] = useState<string | null>('baseline');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Every input change recomputes the full pipeline: supply → candidates → ranking → portfolio.
  const { supply, ranked, portfolio } = useMemo(() => {
    const supply = computeSupply(assumptions);
    const ranked = evaluateCandidates(assumptions, DEMO_DATA_CENTER, DEMO_CUSTOMERS, supply);
    return { supply, ranked, portfolio: allocatePortfolio(assumptions, ranked, supply) };
  }, [assumptions]);

  const selected = ranked.find((r) => r.customer.id === selectedId) ?? ranked[0];
  const allocation = portfolio.allocations.find((x) => x.customerId === selected.customer.id);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const good = ranked.filter((r) => r.status === 'Promising').length;

  const applyScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setAssumptions(s.assumptions);
    setScenarioId(id);
  };

  return (
    <>
      <div className="app screen-only">
        <header className="topbar">
          <a className="brand" href="#">
            <span className="logo-dot" aria-hidden />
            <span>
              <strong>Lenovo HeatMatch</strong>
              <small>Waste-heat reuse feasibility planner</small>
            </span>
          </a>
          <span className="tag">Prototype · Illustrative scenario</span>
        </header>

        <nav className="nav" aria-label="Pages">
          {PAGES.map((p) => (
            <a key={p.id} href={`#${p.id}`} className={page === p.id ? 'active' : ''} aria-current={page === p.id ? 'page' : undefined}>
              {p.step && <span className="nav-step">{p.step}</span>}
              {p.label}
            </a>
          ))}
        </nav>

        {page !== '' && (
          <div className="status-strip" aria-live="polite">
            <span>
              <b>Scenario:</b> {scenario ? scenario.label : 'Custom settings'}
            </span>
            <span>
              <b>{fmtNum(assumptions.itLoadMw, 1)} MW</b> data center → <b>{fmtNum(supply.recoverableHeatMw, 1)} MW</b> usable heat
            </span>
            <span>
              <b>{good}</b> good match{good === 1 ? '' : 'es'} of {ranked.length}
            </span>
            {page !== 'setup' && (
              <a href="#setup" className="strip-link">
                Change settings
              </a>
            )}
          </div>
        )}

        <main className="content">
          {page === '' && <HomePage supply={supply} ranked={ranked} portfolio={portfolio} />}
          {page === 'setup' && (
            <SetupPage
              assumptions={assumptions}
              activeScenario={scenarioId}
              onScenario={applyScenario}
              onChange={(a) => {
                setAssumptions(a);
                setScenarioId(null);
              }}
              supply={supply}
              portfolio={portfolio}
            />
          )}
          {page === 'matches' && (
            <MatchesPage dc={DEMO_DATA_CENTER} ranked={ranked} selected={selected} allocation={allocation} assumptions={assumptions} supply={supply} portfolio={portfolio} onSelect={setSelectedId} />
          )}
          {page === 'compare' && <ComparePage ranked={ranked} selectedId={selected.customer.id} onSelect={setSelectedId} />}
          {page === 'share' && <SharePage portfolio={portfolio} ranked={ranked} />}
          {page === 'report' && <ReportPage assumptions={assumptions} supply={supply} ranked={ranked} portfolio={portfolio} selected={selected} />}
        </main>

        <footer className="footer">
          Illustrative screening estimate, not engineering, legal, or investment advice. Only heat a building actually uses is counted, not all the heat the data
          center produces. HeatMatch is a concept prototype designed to complement advanced data-center cooling. It is not an existing Lenovo product.
        </footer>
      </div>
      <Report assumptions={assumptions} supply={supply} ranked={ranked} portfolio={portfolio} selected={selected} />
    </>
  );
}
