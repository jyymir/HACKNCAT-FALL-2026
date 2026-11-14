import type { Assumptions, CandidateResult, Portfolio, SupplySummary } from '../engine/types';
import { COP_MAX, COP_MIN, COP_SLOPE_PER_C } from '../engine/thermal';
import { DISCLAIMER, fmtDistance, fmtMoney, fmtNum, fmtPayback } from '../format';

export const LIMITATIONS = [
  'Annual energy balance only — no hourly or seasonal matching of supply and demand.',
  'Distances are straight-line (Haversine) × a route multiplier, not engineered pipe routes.',
  `Heat-pump COP uses a demo heuristic: clamp(${COP_MAX} − ${COP_SLOPE_PER_C} × lift, ${COP_MIN}, ${COP_MAX}). Not a certified equipment curve.`,
  'Taxes, financing, discounting, grants, heat-sales contracts, backup systems, pumping energy and detailed equipment costs are not modeled.',
  'Emissions use illustrative, unsourced factors and an operational boundary (displaced heating vs. added heat-pump electricity) — not lifecycle.',
  'Customer names, locations and demands are fictional demo data, not real businesses or verified buildings.',
];

export function assumptionRows(a: Assumptions): [string, string][] {
  return [
    ['IT load', `${a.itLoadMw} MW`],
    ['Heat capture fraction', `${fmtNum(a.heatCaptureFraction * 100)}%`],
    ['Source heat temperature', `${a.sourceTempC} °C`],
    ['Operating hours', `${fmtNum(a.operatingHours)} h/yr`],
    ['Heat exchanger / recovery efficiency', `${fmtNum(a.recoveryEfficiency * 100)}% (applied once)`],
    ['Distribution loss', `${fmtNum(a.distributionLossFraction * 100)}%`],
    ['Electricity price', `$${a.electricityPricePerKwh.toFixed(3)}/kWh-e`],
    ['Displaced heating cost', `$${a.displacedHeatCostPerKwh.toFixed(3)}/kWh-th`],
    ['Pipeline cost', `$${fmtNum(a.pipelineCostPerM)}/route-m`],
    ['Route multiplier', `${a.routeMultiplier}×`],
    ['Fixed connection cost', `$${fmtNum(a.fixedConnectionCost)}`],
    ['Heat pump & substation cost', `$${fmtNum(a.heatPumpCostPerKw)}/kW-th (sized at ${fmtNum(a.equivalentFullLoadHours)} full-load h)`],
    ['Maintenance', `${fmtNum(a.maintenanceFractionOfCapex * 100, 1)}% of capex/yr`],
    ['Max heat-pump output temperature', `${a.maxDeliveryTempC} °C`],
    ['Status thresholds', `Promising ≤ ${a.promisingPaybackYears} yrs · Marginal ≤ ${a.marginalPaybackYears} yrs`],
    ['Emissions factors (illustrative)', `${a.displacedHeatEmissionsKgPerMwh} kg/MWh-th displaced · ${a.gridEmissionsKgPerMwh} kg/MWh-e grid`],
  ];
}

export function Report({
  assumptions: a,
  supply,
  ranked,
  portfolio,
  selected,
  preview = false,
}: {
  assumptions: Assumptions;
  supply: SupplySummary;
  ranked: CandidateResult[];
  portfolio: Portfolio;
  selected: CandidateResult;
  /** true = render on screen inside the Report page; false = hidden except when printing. */
  preview?: boolean;
}) {
  const e = selected.individual;
  return (
    <div className={`report ${preview ? 'preview' : 'print-only'}`}>
      <h1>Lenovo HeatMatch — Screening Report</h1>
      <p>
        <strong>Prototype · Illustrative scenario.</strong> This is an illustrative screening estimate, not engineering, legal, or investment advice.
        Generated {new Date().toLocaleString()}.
      </p>
      <p className="note">{DISCLAIMER}</p>

      <h2>1. Data-center input assumptions</h2>
      <table>
        <tbody>
          {assumptionRows(a).map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>2. Estimated available heat (modeled)</h2>
      <p>
        Recoverable heat {fmtNum(supply.recoverableHeatMw, 2)} MWth · {fmtNum(supply.annualRecoverableHeatMwh)} MWh-th/yr ·{' '}
        {fmtNum(supply.networkAvailableHeatMwh)} MWh-th/yr after network losses. Portfolio allocation uses {fmtNum(portfolio.totalAllocatedMwh)} MWh-th/yr,
        leaving {fmtNum(portfolio.remainingUnusedMwh)} unused and {fmtNum(portfolio.totalUnmetDemandMwh)} of eligible demand unmet. Portfolio net savings{' '}
        {fmtMoney(portfolio.totalNetAnnualSavings)}/yr on {fmtMoney(portfolio.totalCapex)} capex ({fmtPayback(portfolio.portfolioPaybackYears)}).
      </p>

      <h2>3. Candidate rankings (individual opportunity estimates)</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Candidate</th>
            <th>Distance</th>
            <th>Demand MWh-th</th>
            <th>Temp</th>
            <th>Delivered MWh-th</th>
            <th>Net $/yr</th>
            <th>Payback</th>
            <th>Status</th>
            <th>Data quality</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r) => (
            <tr key={r.customer.id}>
              <td>{r.rank}</td>
              <td>{r.customer.name}</td>
              <td>{fmtDistance(r.straightLineM)}</td>
              <td>{fmtNum(r.customer.annualDemandMwh)}</td>
              <td>{r.customer.requiredTempC} °C</td>
              <td>{fmtNum(r.individual.deliveredHeatMwh)}</td>
              <td>{fmtMoney(r.individual.netAnnualSavings)}</td>
              <td>{fmtPayback(r.individual.simplePaybackYears)}</td>
              <td>{r.status}</td>
              <td>{r.customer.dataQuality}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>4. Selected candidate: {selected.customer.name}</h2>
      <p>
        Status: <strong>{selected.status}</strong>
      </p>
      <ul>
        {selected.reasons.map((x, i) => (
          <li key={i}>{x.text}</li>
        ))}
      </ul>
      <table>
        <tbody>
          <tr><td>Route length (est.)</td><td>{fmtDistance(selected.routeLengthM)}</td></tr>
          <tr><td>Delivered heat</td><td>{fmtNum(e.deliveredHeatMwh)} MWh-th/yr</td></tr>
          <tr><td>Temperature lift · COP</td><td>{fmtNum(e.temperatureLiftC)} °C · {e.cop.toFixed(2)}</td></tr>
          <tr><td>Heat-pump electricity</td><td>{fmtNum(e.heatPumpElectricityMwh)} MWh-e/yr</td></tr>
          <tr><td>Avoided heating cost</td><td>{fmtMoney(e.avoidedHeatingCost)}/yr</td></tr>
          <tr><td>Operating cost (electricity + maintenance)</td><td>{fmtMoney(e.annualOperatingCost)}/yr</td></tr>
          <tr><td>Net annual savings</td><td>{fmtMoney(e.netAnnualSavings)}/yr</td></tr>
          <tr><td>Connection cost (pipe {fmtMoney(e.pipelineCapex)} + fixed + equipment {fmtMoney(e.equipmentCapex)})</td><td>{fmtMoney(e.connectionCapex)}</td></tr>
          <tr><td>Simple payback</td><td>{e.simplePaybackYears === null ? 'No positive payback under current assumptions' : fmtPayback(e.simplePaybackYears)}</td></tr>
        </tbody>
      </table>

      <h2>5. Limitations</h2>
      <ul>
        {LIMITATIONS.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p>Lenovo HeatMatch is a concept prototype. It is not an existing Lenovo product and does not imply Lenovo endorsement.</p>
    </div>
  );
}

export function downloadCsv(ranked: CandidateResult[]) {
  const header = [
    'rank', 'id', 'name', 'category', 'data_quality', 'straight_line_m', 'route_m', 'annual_demand_mwh_th', 'required_temp_c',
    'delivered_mwh_th', 'cop', 'hp_electricity_mwh_e', 'avoided_cost_usd', 'operating_cost_usd', 'net_annual_savings_usd',
    'connection_capex_usd', 'simple_payback_years', 'status',
  ];
  const rows = ranked.map((r) => {
    const e = r.individual;
    return [
      r.rank, r.customer.id, r.customer.name, r.customer.category, r.customer.dataQuality, Math.round(r.straightLineM), Math.round(r.routeLengthM),
      r.customer.annualDemandMwh, r.customer.requiredTempC, Math.round(e.deliveredHeatMwh), e.cop.toFixed(2), Math.round(e.heatPumpElectricityMwh),
      Math.round(e.avoidedHeatingCost), Math.round(e.annualOperatingCost), Math.round(e.netAnnualSavings), Math.round(e.connectionCapex),
      e.simplePaybackYears === null ? '' : e.simplePaybackYears.toFixed(1), r.status,
    ];
  });
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    '# Lenovo HeatMatch prototype - illustrative screening estimates only; not engineering, legal, or investment advice.',
    header.join(','),
    ...rows.map((r) => r.map(esc).join(',')),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'heatmatch-candidates.csv';
  link.click();
  URL.revokeObjectURL(url);
}
