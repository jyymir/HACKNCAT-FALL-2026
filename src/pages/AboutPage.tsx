import type { Assumptions } from '../engine/types';
import { summarize, type ModelRun } from '../engine/run';
import { NEPTUNE_SOURCE } from '../data/cooling';
import { CLIMATE_SOURCE } from '../data/climate';
import { MWH_PER_HOME, fmtMoney, fmtNum } from '../format';
import { PageHeader } from '../components/ui';

const SOURCES = {
  lbnl: {
    label: 'U.S. DOE / Lawrence Berkeley National Laboratory, 2024 Report on U.S. Data Center Energy Use',
    url: 'https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers',
  },
  iea: { label: 'International Energy Agency, Energy and AI (2025), executive summary', url: 'https://www.iea.org/reports/energy-and-ai/executive-summary' },
};

const STATUS_ROWS: { title: string; tone: 'built' | 'real' | 'modeled' | 'concept'; items: string[] }[] = [
  {
    title: 'Built and working',
    tone: 'built',
    items: [
      'Calculation engine for heat supply, heat-pump power, costs, payback and CO₂ (TypeScript, 24 automated tests)',
      'Ranking of 8 buildings with plain-language reasons and transparent pass/fail rules',
      '3D/2D interactive map (MapLibre + OpenStreetMap 3D buildings; column height = heat demand), plus an offline view',
      'Month-by-month supply vs. demand, and sharing one heat supply without double-counting',
      'Cooling-technology comparison (air, rear-door, warm-water liquid)',
      'Save, load and compare scenarios side by side',
      'Gemini AI assistant: what-ifs in plain language with a before/after preview, and Q&A limited to the app’s own numbers (needs an API key)',
      'Printable report and CSV export',
    ],
  },
  {
    title: 'Real data used',
    tone: 'real',
    items: [
      '2024 daily temperatures for the Greensboro, NC area (Open-Meteo / ERA5), turned into monthly heating degree-days',
      '45 °C warm-water inlet for liquid cooling (Lenovo Press DS0187, ThinkSystem N1380 Neptune)',
      'OpenStreetMap base map',
    ],
  },
  {
    title: 'Modeled / illustrative',
    tone: 'modeled',
    items: [
      'All 8 buildings: names, locations, heat demand and temperatures are fictional demo data',
      'Pipe, equipment and maintenance costs; energy prices; emissions factors',
      'Heat-pump efficiency curve (simple heuristic), heat-capture shares, year-round demand shares',
    ],
  },
  {
    title: 'Conceptual (not built yet)',
    tone: 'concept',
    items: [
      'Finding real buildings automatically and using real utility bills',
      'Engineered pipe routes, shared trunk networks, hydraulics',
      'Hourly matching, heat storage, live data-center telemetry',
      'Full project finance (NPV, incentives, heat-sale contracts)',
    ],
  },
];

export function AboutPage({ run, assumptions }: { run: ModelRun; assumptions: Assumptions }) {
  const s = summarize(run);
  const perMw = assumptions.itLoadMw > 0 ? 1 / assumptions.itLoadMw : 0;

  return (
    <div className="page">
      <PageHeader title="About this prototype" sub="The problem, who it’s for, and exactly what is real, modeled, or still conceptual." />

      <section className="card about-problem">
        <div className="card-title">The problem</div>
        <div className="fact-row">
          <div className="fact">
            <strong>176 TWh</strong>
            <span>
              U.S. data-center electricity use in 2023, about 4.4% of the nation’s total. Projected to reach 325–580 TWh by 2028.{' '}
              <a href={SOURCES.lbnl.url} target="_blank" rel="noreferrer">
                DOE/LBNL
              </a>
            </span>
          </div>
          <div className="fact">
            <strong>415 → ~945 TWh</strong>
            <span>
              Global data-center electricity, 2024 to 2030 (projected).{' '}
              <a href={SOURCES.iea.url} target="_blank" rel="noreferrer">
                IEA
              </a>
            </span>
          </div>
          <div className="fact">
            <strong>≈ all of it → heat</strong>
            <span>Nearly every watt a server uses becomes heat, which is usually thrown away through cooling towers and chillers.</span>
          </div>
        </div>
        <p className="about-lead">
          Meanwhile hospitals, pools, greenhouses and apartments nearby pay to make heat. But <strong>being close isn’t enough</strong>. Temperature, how much
          heat a building uses, distance, seasons and electricity cost decide whether reuse actually pays off. Today that question usually takes a one-off
          engineering study, so many opportunities are never checked.
        </p>
      </section>

      <div className="split">
        <section className="card">
          <div className="card-title">Who it’s for</div>
          <ul className="plain-list">
            <li>
              <strong>Data-center planners and sustainability leads</strong> who need a fast, defensible first answer before paying for engineering.
            </li>
            <li>
              <strong>Nearby building owners</strong> (hospitals, pools, greenhouses, housing) facing heating bills and emissions targets.
            </li>
            <li>
              <strong>Cities and utilities</strong> weighing AI growth against grid load and community benefit.
            </li>
          </ul>
        </section>
        <section className="card">
          <div className="card-title">What’s different</div>
          <ul className="plain-list">
            <li>Screens many buildings in minutes instead of one site per study.</li>
            <li>Shows why a building fails, not just a score.</li>
            <li>Accounts for seasons: steady supply against winter-peaking demand.</li>
            <li>Includes cooling technology, the factor that decides how much heat is usable.</li>
            <li>AI explains and runs what-ifs but never invents numbers; the engine calculates.</li>
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="card-title">Why Lenovo</div>
        <p className="about-lead">
          Heat reuse depends on capturing heat in <em>warm water</em>. Lenovo’s Neptune warm-water liquid cooling supports inlet water up to 45 °C and is designed
          so the heat can be reused in building heating (
          <a href={NEPTUNE_SOURCE.url} target="_blank" rel="noreferrer">
            Lenovo Press DS0187
          </a>
          ). In this model, liquid cooling cuts backup heating and raises savings compared with air cooling (see Overview). Combined with Lenovo’s data-center
          infrastructure and services reach, a screening tool like this could help customers plan heat reuse from day one. This is a strategic-fit concept, not a
          Lenovo product or endorsement.
        </p>
      </section>

      <section className="card">
        <div className="card-title">Impact in the current scenario</div>
        <div className="card-sub">Recalculated live from your settings. Illustrative demo data.</div>
        <div className="impact-row">
          <div>
            <strong>{fmtNum(s.heatUsedMwh)} MWh</strong>
            <span>heat reused per year (≈ {fmtNum(s.heatUsedMwh / MWH_PER_HOME)} homes)</span>
          </div>
          <div>
            <strong>{fmtNum(s.emissionsT)} t</strong>
            <span>CO₂ avoided per year (illustrative factors)</span>
          </div>
          <div>
            <strong>{fmtMoney(s.savings)}</strong>
            <span>net savings per year</span>
          </div>
          <div>
            <strong>{fmtNum(s.heatUsedMwh * perMw)} MWh</strong>
            <span>reused per MW of IT load</span>
          </div>
        </div>
        <p className="fineprint">
          Scaling is roughly linear only when enough nearby demand exists. Real sites vary widely, so every site needs its own screening. That’s the point of the
          tool.
        </p>
      </section>

      <section className="card">
        <div className="card-title">What we built vs. what’s conceptual</div>
        <div className="status-grid">
          {STATUS_ROWS.map((g) => (
            <div key={g.title} className={`status-box ${g.tone}`}>
              <strong>{g.title}</strong>
              <ul>
                {g.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="fineprint">
          Sources: <a href={SOURCES.lbnl.url}>{SOURCES.lbnl.label}</a> · <a href={SOURCES.iea.url}>{SOURCES.iea.label}</a> ·{' '}
          <a href={NEPTUNE_SOURCE.url}>{NEPTUNE_SOURCE.label}</a> · <a href={CLIMATE_SOURCE.url}>{CLIMATE_SOURCE.label}</a>.
        </p>
      </section>
    </div>
  );
}
