import type { CandidateResult, Portfolio, SupplySummary } from '../engine/types';
import { DISCLAIMER, MWH_PER_HOME, fmtNum } from '../format';

export function HomePage({ supply, ranked, portfolio }: { supply: SupplySummary; ranked: CandidateResult[]; portfolio: Portfolio }) {
  const good = ranked.filter((r) => r.status === 'Promising');
  const homes = portfolio.totalAllocatedMwh / MWH_PER_HOME;

  return (
    <div className="page home">
      <section className="hero">
        <div className="eyebrow">Prototype · Illustrative scenario</div>
        <h2>Turn data-center heat into warmth for the neighbors.</h2>
        <p className="lead">
          Computers in an AI data center get hot, and that heat usually goes to waste. Hospitals, pools, greenhouses, and apartment buildings nearby pay to heat
          water and rooms. <strong>HeatMatch</strong> checks which of those neighbors could actually use the data center’s heat, and whether it’s worth the cost.
        </p>
        <div className="hero-actions">
          <a className="btn primary lg" href="#setup">
            Start: describe the data center →
          </a>
          <a className="btn lg" href="#matches">
            Jump to the matches
          </a>
        </div>
      </section>

      <section className="snapshot" aria-label="Current scenario at a glance">
        <div className="snap">
          <span className="snap-num">{fmtNum(supply.recoverableHeatMw, 1)} MW</span>
          <span className="snap-label">of usable heat right now</span>
        </div>
        <div className="snap">
          <span className="snap-num">~{fmtNum(homes)}</span>
          <span className="snap-label">
            homes’ worth of heat a year actually put to use<sup>*</sup>
          </span>
        </div>
        <div className="snap">
          <span className="snap-num">
            {good.length} of {ranked.length}
          </span>
          <span className="snap-label">nearby buildings are a good match</span>
        </div>
      </section>
      <p className="note center">
        * Rough illustrative comparison assuming ~{MWH_PER_HOME} MWh of heat per home per year. Based on the current settings and fictional demo buildings.
      </p>

      <section className="how">
        <h3>How it works</h3>
        <ol className="steps">
          <li>
            <a href="#setup">
              <span className="step-n">1</span>
              <strong>Describe the data center</strong>
              <span>How big it is, how warm its cooling water gets, and what energy costs.</span>
            </a>
          </li>
          <li>
            <a href="#matches">
              <span className="step-n">2</span>
              <strong>See which neighbors fit</strong>
              <span>A map of nearby buildings, each with a plain verdict and the reasons behind it.</span>
            </a>
          </li>
          <li>
            <a href="#compare">
              <span className="step-n">3</span>
              <strong>Compare them side by side</strong>
              <span>Who saves the most money, and who pays back fastest.</span>
            </a>
          </li>
          <li>
            <a href="#share">
              <span className="step-n">4</span>
              <strong>Share out the heat</strong>
              <span>There’s only so much heat. See who gets it, and what’s left over.</span>
            </a>
          </li>
          <li>
            <a href="#report">
              <span className="step-n">5</span>
              <strong>Get a report</strong>
              <span>Print, save as PDF, or download a spreadsheet.</span>
            </a>
          </li>
        </ol>
      </section>

      <section className="big-idea">
        <h3>The big idea</h3>
        <p>
          <strong>Being nearby isn’t enough.</strong> A building is only a good match if it needs heat at a temperature the data center can reach, uses enough of
          it, and is close enough that the pipe doesn’t cost a fortune. It also matters whether the electricity for boosting the heat costs less than the heating
          bill it replaces.
        </p>
        <div className="factors">
          <span>🌡️ Temperature</span>
          <span>🔥 How much heat they use</span>
          <span>📏 Distance</span>
          <span>⚡ Electricity cost</span>
          <span>🏗️ Setup cost</span>
        </div>
      </section>

      <p className="note center">{DISCLAIMER} HeatMatch is a concept prototype, not an existing Lenovo product.</p>
    </div>
  );
}
