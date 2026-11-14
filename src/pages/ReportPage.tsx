import type { Assumptions, CandidateResult, Portfolio, SupplySummary } from '../engine/types';
import { LIMITATIONS, Report, downloadCsv } from '../components/Report';
import { Download, Printer } from 'lucide-react';
import { NextStep, PageHeader } from '../components/ui';

const GLOSSARY: [string, string][] = [
  ['MW (megawatt)', 'A rate of power, i.e. how much energy is used or produced at any moment.'],
  ['MWh (megawatt-hour)', 'An amount of energy: 1 MW running for 1 hour. We use it for heat per year.'],
  ['Heat pump', 'A machine that uses electricity to make warm water hotter, like a fridge in reverse.'],
  ['COP (efficiency)', 'Units of heat a heat pump makes per unit of electricity. A COP of 4 means 4 units of heat for 1 of electricity.'],
  ['Temperature lift', 'How much hotter the water must be made, from the data center’s temperature up to what the building needs.'],
  ['Setup cost (capex)', 'One-time cost to lay the pipe and install equipment.'],
  ['Payback', 'How many years of savings it takes to earn back the setup cost.'],
  ['Distribution loss', 'Heat that leaks away while traveling through pipes.'],
];

const REFERENCES = [
  { label: 'Lenovo Press DS0187: ThinkSystem N1380 Neptune datasheet', url: 'https://lenovopress.lenovo.com/ds0187', why: 'Source of the 45 °C warm-water inlet figure used for liquid cooling' },
  { label: 'U.S. EIA: Commercial Buildings Energy Consumption Survey (CBECS)', url: 'https://www.eia.gov/consumption/commercial/', why: 'Could inform future building demand estimates' },
  { label: 'U.S. EPA: eGRID', url: 'https://www.epa.gov/egrid', why: 'Future grid-emissions factors' },
  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', why: 'Future building/location discovery' },
  { label: 'LBNL Center of Expertise for Data Center Energy (DOE-supported)', url: 'https://datacenters.lbl.gov/', why: 'Data-center energy and heat-recovery resources' },
];

export function ReportPage(props: {
  assumptions: Assumptions;
  supply: SupplySummary;
  ranked: CandidateResult[];
  portfolio: Portfolio;
  selected: CandidateResult;
}) {
  return (
    <div className="page">
      <PageHeader title="Report" sub="Save or share the current results." />

      <div className="split">
        <div className="card promo">
          <Printer size={22} />
          <h2>Print or save as PDF</h2>
          <p>Settings, rankings, the selected building ({props.selected.customer.name}) and limitations, on a clean page.</p>
          <button className="pill red" onClick={() => window.print()}>
            Print report
          </button>
        </div>
        <div className="card action-card">
          <Download size={22} />
          <h2>Download spreadsheet</h2>
          <p>Every building’s results as a CSV file for Excel or Google Sheets.</p>
          <button className="pill dark" onClick={() => downloadCsv(props.ranked)}>
            Download CSV
          </button>
        </div>
      </div>

      <details className="card fold-card">
        <summary className="card-title">Preview report</summary>
        <Report {...props} preview />
      </details>

      <details className="card fold-card">
        <summary className="card-title">Glossary</summary>
        <dl className="glossary">
          {GLOSSARY.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </details>

      <details className="card fold-card">
        <summary className="card-title">How the math works &amp; limitations</summary>
        <ol className="plain-list">
          <li>Usable heat = server power × share captured × heat-exchanger efficiency × hours, minus pipe losses.</li>
          <li>Each building gets no more heat than it uses or than is available.</li>
          <li>Heat-pump electricity = heat supplied ÷ COP. COP drops as the temperature boost grows.</li>
          <li>Savings = heating bill avoided − electricity − upkeep. Payback = setup cost ÷ yearly savings.</li>
          <li>Verdicts follow simple visible rules (payback targets in Set up), not an AI score.</li>
        </ol>
        <ul className="plain-list muted">
          {LIMITATIONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>

      <details className="card fold-card">
        <summary className="card-title">References</summary>
        <ul className="plain-list">
          {REFERENCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.label}
              </a>{' '}
              <span className="muted">({r.why})</span>
            </li>
          ))}
        </ul>
        <p className="fineprint">Only the Lenovo datasheet is used, for the 45 °C liquid-cooling water temperature. The others were not used to create the demo data.</p>
      </details>

      <NextStep label="Back to overview" href="#" back={{ label: 'Share heat', href: '#share' }} />
    </div>
  );
}
