import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileText, Flame, LayoutGrid, MapPin, PieChart, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import type { Assumptions } from './engine/types';
import { runModel } from './engine/run';
import { DEFAULT_ASSUMPTIONS, DEMO_CUSTOMERS, DEMO_DATA_CENTER, SCENARIOS } from './data/demoCustomers';
import { Report, downloadCsv } from './components/Report';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { MatchesPage } from './pages/MatchesPage';
import { ComparePage } from './pages/ComparePage';
import { SharePage } from './pages/SharePage';
import { ReportPage } from './pages/ReportPage';

const PAGES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: '', label: 'Overview', icon: LayoutGrid },
  { id: 'setup', label: 'Set up', icon: SlidersHorizontal },
  { id: 'matches', label: 'Matches', icon: MapPin },
  { id: 'compare', label: 'Compare', icon: BarChart3 },
  { id: 'share', label: 'Share heat', icon: PieChart },
  { id: 'report', label: 'Report', icon: FileText },
];

/** Tiny hash router: #setup, #matches, … (no extra dependency, works from a static file). */
function useHashPage(): string {
  const read = () => {
    const h = window.location.hash.replace(/^#\/?/, '');
    return PAGES.find((p) => p.id === h)?.id ?? '';
  };
  const [page, setPage] = useState(read);
  useEffect(() => {
    const onHash = () => {
      setPage(read());
      document.querySelector('.canvas')?.scrollTo({ top: 0 });
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
  const [scenarioId, setScenarioId] = useState<string>('baseline');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Every input change recomputes the full pipeline: supply → candidates → ranking → portfolio.
  const { supply, ranked, portfolio } = useMemo(() => runModel(assumptions, DEMO_DATA_CENTER, DEMO_CUSTOMERS), [assumptions]);

  const selected = ranked.find((r) => r.customer.id === selectedId) ?? ranked[0];
  const allocation = portfolio.allocations.find((x) => x.customerId === selected.customer.id);

  const applyScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setAssumptions(s.assumptions);
    setScenarioId(id);
  };
  const editAssumptions = (a: Assumptions) => {
    setAssumptions(a);
    setScenarioId('custom');
  };
  const openMatch = (id: string) => {
    setSelectedId(id);
    window.location.hash = 'matches';
  };

  return (
    <>
      <div className="shell screen-only">
        <aside className="sidebar" aria-label="Main navigation">
          <a className="logo" href="#" title="Lenovo HeatMatch">
            <Flame size={22} strokeWidth={2.2} />
          </a>
          <nav className="side-nav">
            {PAGES.map((p) => {
              const Icon = p.icon;
              const active = page === p.id;
              return (
                <a key={p.id} href={`#${p.id}`} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                  <Icon size={20} strokeWidth={1.9} />
                  <span>{p.label}</span>
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="canvas">
          <header className="topbar">
            <div className="brandline">
              <strong>Lenovo HeatMatch</strong>
              <span className="chip-soft">Prototype · Illustrative</span>
            </div>
            <div className="topbar-actions">
              <label className="select-pill">
                <span className="sr-only">Scenario</span>
                <select value={scenarioId} onChange={(e) => applyScenario(e.target.value)} aria-label="Scenario">
                  {SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                  {scenarioId === 'custom' && <option value="custom">Custom settings</option>}
                </select>
              </label>
              <button className="pill dark" onClick={() => downloadCsv(ranked)}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          </header>

          <main className="content">
            {page === '' && <HomePage assumptions={assumptions} supply={supply} ranked={ranked} portfolio={portfolio} onOpen={openMatch} />}
            {page === 'setup' && (
              <SetupPage
                assumptions={assumptions}
                activeScenario={scenarioId}
                onScenario={applyScenario}
                onChange={editAssumptions}
                supply={supply}
                portfolio={portfolio}
              />
            )}
            {page === 'matches' && (
              <MatchesPage
                dc={DEMO_DATA_CENTER}
                ranked={ranked}
                selected={selected}
                allocation={allocation}
                assumptions={assumptions}
                supply={supply}
                portfolio={portfolio}
                onSelect={setSelectedId}
              />
            )}
            {page === 'compare' && <ComparePage ranked={ranked} selectedId={selected.customer.id} onOpen={openMatch} />}
            {page === 'share' && <SharePage portfolio={portfolio} ranked={ranked} />}
            {page === 'report' && <ReportPage assumptions={assumptions} supply={supply} ranked={ranked} portfolio={portfolio} selected={selected} />}
          </main>

          <footer className="footer">
            Illustrative screening estimate, not engineering, legal, or investment advice. Concept prototype; not an existing Lenovo product.
          </footer>
        </div>
      </div>
      <Report assumptions={assumptions} supply={supply} ranked={ranked} portfolio={portfolio} selected={selected} />
    </>
  );
}
