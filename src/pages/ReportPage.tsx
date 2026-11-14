import type { Assumptions, CandidateResult, Portfolio, SupplySummary } from '../engine/types';
import { LIMITATIONS, Report, downloadCsv } from '../components/Report';
import { NextStep, PageIntro } from '../components/ui';

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
  { label: 'Lenovo Neptune liquid cooling (public materials)', url: 'https://www.lenovo.com/us/en/servers-storage/neptune/', why: 'Warm-water liquid-cooling context' },
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
      <PageIntro step="Step 5 of 5" title="Get a report">
        Save or share the results. The report covers your current settings and the building selected on the Matches page ({props.selected.customer.name}).
      </PageIntro>

      <section className="panel actions-panel">
        <button className="btn primary lg" onClick={() => window.print()}>
          🖨️ Print or save as PDF
        </button>
        <button className="btn lg" onClick={() => downloadCsv(props.ranked)}>
          ⬇️ Download spreadsheet (CSV)
        </button>
        <span className="note">In the print window, choose “Save as PDF” to get a file.</span>
      </section>

      <details className="panel">
        <summary className="panel-title">Preview the report</summary>
        <Report {...props} preview />
      </details>

      <div className="two-col">
        <section className="panel">
          <div className="panel-title">Words used in this tool</div>
          <dl className="glossary">
            {GLOSSARY.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel">
          <div className="panel-title">How the math works</div>
          <ol className="plain-list">
            <li>Usable heat = server power × share captured × heat-exchanger efficiency × hours per year, minus pipe losses.</li>
            <li>Each building gets no more heat than it uses, and no more than is available.</li>
            <li>Heat-pump electricity = heat supplied ÷ efficiency (COP). The bigger the temperature boost, the lower the COP.</li>
            <li>Savings = heating bill avoided − electricity − upkeep. Payback = setup cost ÷ yearly savings.</li>
            <li>The verdict follows simple, visible rules (payback targets on the Set-up page). It is a screening aid, not an AI score.</li>
          </ol>
          <div className="panel-title spaced">What this tool doesn’t do</div>
          <ul className="plain-list">
            {LIMITATIONS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title">Public references for context</div>
        <ul className="plain-list">
          {REFERENCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.label}
              </a>{' '}
              ({r.why})
            </li>
          ))}
        </ul>
        <p className="note">
          These sources were <strong>not</strong> used to create the demo data. They are possible sources of verified data in the future.
        </p>
      </section>

      <NextStep label="Back to start" href="#" back={{ label: 'Share heat', href: '#share' }} />
    </div>
  );
}
