import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileText, Flame, Info, Layers, LayoutGrid, MapPin, PieChart, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import type { Assumptions } from './engine/types';
import { runModel, type ModelOptions } from './engine/run';
import { DEFAULT_ASSUMPTIONS, DEMO_CUSTOMERS, DEMO_DATA_CENTER, SCENARIOS } from './data/demoCustomers';
import { loadSaved, newId, persistSaved, type SavedScenario } from './data/savedScenarios';
import { Report, downloadCsv } from './components/Report';
import { HomePage } from './pages/HomePage';
import { SetupPage } from './pages/SetupPage';
import { MatchesPage } from './pages/MatchesPage';
import { ComparePage } from './pages/ComparePage';
import { SharePage } from './pages/SharePage';
import { ScenariosPage } from './pages/ScenariosPage';
import { ReportPage } from './pages/ReportPage';
import { AboutPage } from './pages/AboutPage';

const PAGES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: '', label: 'Overview', icon: LayoutGrid },
  { id: 'setup', label: 'Set up', icon: SlidersHorizontal },
  { id: 'matches', label: 'Matches', icon: MapPin },
  { id: 'compare', label: 'Compare', icon: BarChart3 },
  { id: 'share', label: 'Share heat', icon: PieChart },
  { id: 'scenarios', label: 'Scenarios', icon: Layers },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'about', label: 'About', icon: Info },
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
  const [options, setOptions] = useState<ModelOptions>({ seasonal: true });
  const [scenarioId, setScenarioId] = useState<string>('baseline');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedScenario[]>(loadSaved);

  useEffect(() => persistSaved(saved), [saved]);

  // Every input change recomputes the full pipeline: supply → candidates → ranking → portfolio.
  const run = useMemo(() => runModel(assumptions, DEMO_DATA_CENTER, DEMO_CUSTOMERS, options), [assumptions, options]);
  const { supply, ranked, portfolio } = run;

  const selected = ranked.find((r) => r.customer.id === selectedId) ?? ranked[0];
  const allocation = portfolio.allocations.find((x) => x.customerId === selected.customer.id);

  /** Built-in presets keep the current demand model; saved scenarios restore their own. */
  const applyScenario = (id: string) => {
    const preset = SCENARIOS.find((x) => x.id === id);
    const mine = saved.find((x) => x.id === id);
    if (preset) setAssumptions(preset.assumptions);
    else if (mine) {
      setAssumptions(mine.assumptions);
      setOptions({ seasonal: mine.seasonal });
    } else return;
    setScenarioId(id);
  };
  const editAssumptions = (a: Assumptions) => {
    setAssumptions(a);
    setScenarioId('custom');
  };
  const saveScenario = (name: string, a: Assumptions = assumptions, seasonal = options.seasonal, select = true) => {
    const s: SavedScenario = { id: newId(), name: name.trim() || `Scenario ${saved.length + 1}`, assumptions: a, seasonal, savedAt: new Date().toISOString() };
    setSaved((list) => [...list, s]);
    if (select) setScenarioId(s.id);
    return s;
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
                  <optgroup label="Presets">
                    {SCENARIOS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                  {saved.length > 0 && (
                    <optgroup label="Saved">
                      {saved.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {scenarioId === 'custom' && <option value="custom">Custom settings</option>}
                </select>
              </label>
              <button className="pill dark" onClick={() => downloadCsv(ranked)}>
                <Download size={15} /> Export CSV
              </button>
            </div>
          </header>

          <main className="content">
            {page === '' && <HomePage assumptions={assumptions} options={options} supply={supply} ranked={ranked} portfolio={portfolio} onOpen={openMatch} />}
            {page === 'setup' && (
              <SetupPage
                assumptions={assumptions}
                options={options}
                onOptions={(o) => {
                  setOptions(o);
                  setScenarioId((id) => (saved.some((s) => s.id === id) ? 'custom' : id));
                }}
                activeScenario={scenarioId}
                onScenario={applyScenario}
                onChange={editAssumptions}
                onSaveScenario={(name, a) => saveScenario(name, a, options.seasonal, false)}
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
                options={options}
                supply={supply}
                portfolio={portfolio}
                onSelect={setSelectedId}
              />
            )}
            {page === 'compare' && <ComparePage ranked={ranked} selectedId={selected.customer.id} onOpen={openMatch} />}
            {page === 'share' && <SharePage portfolio={portfolio} ranked={ranked} />}
            {page === 'scenarios' && (
              <ScenariosPage
                current={{ assumptions, options }}
                activeId={scenarioId}
                saved={saved}
                onSave={(name) => saveScenario(name)}
                onLoad={applyScenario}
                onDuplicate={(s) => saveScenario(`${s.name} (copy)`, s.assumptions, s.seasonal, false)}
                onRename={(id, name) => setSaved((list) => list.map((s) => (s.id === id ? { ...s, name } : s)))}
                onDelete={(id) => {
                  setSaved((list) => list.filter((s) => s.id !== id));
                  if (scenarioId === id) setScenarioId('custom');
                }}
              />
            )}
            {page === 'about' && <AboutPage run={run} assumptions={assumptions} />}
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
