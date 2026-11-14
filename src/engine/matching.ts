import type {
  Allocation,
  Assumptions,
  CandidateResult,
  Customer,
  DataCenter,
  Portfolio,
  Reason,
  Status,
  SupplySummary,
} from './types';
import { computeEconomics } from './economics';
import { haversineM } from './thermal';

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
const fmtMoney = (n: number) => `$${fmtInt(n)}`;

/**
 * Transparent rules-based screening (a screening aid, not a scientific score):
 *  - Not viable: required temperature above the modeled heat-pump limit, net savings ≤ 0,
 *                or payback beyond the marginal threshold (connection cost disproportionate).
 *  - Promising:  positive savings and payback ≤ promising threshold.
 *  - Marginal:   everything else (technically possible, but long payback).
 */
export function classify(
  a: Assumptions,
  servable: boolean,
  netAnnualSavings: number,
  paybackYears: number | null,
): Status {
  if (!servable || netAnnualSavings <= 0 || paybackYears === null) return 'Not viable';
  if (paybackYears <= a.promisingPaybackYears) return 'Promising';
  if (paybackYears <= a.marginalPaybackYears) return 'Marginal';
  return 'Not viable';
}

const fmtLen = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 10) * 10} m`);

/** Plain-language reasons (2–4), most important first. */
function buildReasons(a: Assumptions, r: Omit<CandidateResult, 'reasons' | 'rank'>, supply: SupplySummary): Reason[] {
  const { customer: c, individual: e } = r;
  const primary: Reason[] = [];
  const secondary: Reason[] = [];

  // 1. Can it be served, and does the money work?
  if (!r.technicallyServable) {
    primary.push({
      tone: 'bad',
      text: `It needs ${c.requiredTempC} °C heat. The modeled heat pump tops out at ${a.maxDeliveryTempC} °C, so it can’t supply this building.`,
    });
  } else if (e.netAnnualSavings <= 0) {
    if (e.heatPumpElectricityCost >= e.avoidedHeatingCost) {
      primary.push({ tone: 'bad', text: 'Running the heat pump would cost more in electricity than the building saves on heating.' });
    } else {
      primary.push({
        tone: 'bad',
        text: `Yearly running costs (${fmtMoney(e.annualOperatingCost)}) are higher than the heating bill it replaces (${fmtMoney(e.avoidedHeatingCost)}).`,
      });
    }
  } else if (e.simplePaybackYears !== null) {
    const pb = e.simplePaybackYears.toFixed(1);
    if (e.simplePaybackYears <= a.promisingPaybackYears) {
      primary.push({ tone: 'good', text: `Pays back its setup cost in about ${pb} years — within the ${a.promisingPaybackYears}-year target.` });
    } else {
      primary.push({ tone: 'bad', text: `The setup cost takes about ${pb} years to pay back — longer than the ${a.promisingPaybackYears}-year target.` });
    }
  }

  // 2. Distance / pipe cost
  const pipeShare = e.connectionCapex > 0 ? e.pipelineCapex / e.connectionCapex : 0;
  if (r.routeLengthM <= 1000) {
    secondary.push({ tone: 'good', text: `It’s close by (about ${fmtLen(r.routeLengthM)} of pipe), so connecting is relatively cheap.` });
  } else if (r.routeLengthM >= 2000 || pipeShare > 0.6) {
    secondary.push({
      tone: 'bad',
      text: `It’s far away (about ${fmtLen(r.routeLengthM)} of pipe) — the pipe alone is ${Math.round(pipeShare * 100)}% of the setup cost.`,
    });
  }

  // 3. Temperature
  if (r.technicallyServable) {
    if (e.temperatureLiftC === 0) {
      secondary.push({ tone: 'good', text: `It only needs ${c.requiredTempC} °C water, which the data center already provides — very little boosting needed.` });
    } else if (e.temperatureLiftC >= 30) {
      secondary.push({ tone: 'bad', text: `It needs much hotter water (${c.requiredTempC} °C), so the heat pump works harder and uses more electricity.` });
    } else {
      secondary.push({ tone: 'neutral', text: `The water must be boosted about ${e.temperatureLiftC.toFixed(0)} °C hotter — a moderate job for the heat pump.` });
    }
  }

  // 4. How much heat it uses
  if (c.annualDemandMwh > supply.networkAvailableHeatMwh) {
    secondary.push({
      tone: 'neutral',
      text: `It wants more heat than is available — only ${Math.round((supply.networkAvailableHeatMwh / c.annualDemandMwh) * 100)}% of its need can be covered.`,
    });
  } else if (c.annualDemandMwh >= 5000) {
    secondary.push({ tone: 'good', text: `It uses a lot of heat (${fmtInt(c.annualDemandMwh)} MWh a year), enough to make the investment worthwhile.` });
  } else if (c.annualDemandMwh < 0.05 * supply.networkAvailableHeatMwh) {
    secondary.push({
      tone: 'bad',
      text: `It uses little heat (${fmtInt(c.annualDemandMwh)} MWh a year), so fixed setup costs weigh heavily against the savings.`,
    });
  } else {
    secondary.push({ tone: 'neutral', text: 'Its heat needs are moderate and well within what’s available.' });
  }

  return [...primary, ...secondary].slice(0, 4);
}

const STATUS_ORDER: Record<Status, number> = { Promising: 0, Marginal: 1, 'Not viable': 2 };

/** Evaluate every candidate individually against the same supply, then rank. */
export function evaluateCandidates(
  a: Assumptions,
  dc: DataCenter,
  customers: Customer[],
  supply: SupplySummary,
): CandidateResult[] {
  const results = customers.map((customer) => {
    const straightLineM = haversineM(dc.lat, dc.lon, customer.lat, customer.lon);
    const routeLengthM = straightLineM * a.routeMultiplier;
    const technicallyServable = customer.requiredTempC <= a.maxDeliveryTempC;
    const heatAvailableToCustomerMwh = supply.networkAvailableHeatMwh;
    // Demand cap: deliver no more than the customer uses and no more than is available.
    const delivered = technicallyServable ? Math.min(customer.annualDemandMwh, heatAvailableToCustomerMwh) : 0;
    const individual = computeEconomics(a, delivered, customer.requiredTempC, routeLengthM);
    const status = classify(a, technicallyServable, individual.netAnnualSavings, individual.simplePaybackYears);
    const base = { customer, straightLineM, routeLengthM, heatAvailableToCustomerMwh, technicallyServable, individual, status };
    return { ...base, reasons: buildReasons(a, base, supply), rank: 0 };
  });

  results.sort((x, y) => {
    const s = STATUS_ORDER[x.status] - STATUS_ORDER[y.status];
    if (s !== 0) return s;
    const px = x.individual.simplePaybackYears ?? Infinity;
    const py = y.individual.simplePaybackYears ?? Infinity;
    if (px !== py) return px - py;
    return y.individual.netAnnualSavings - x.individual.netAnnualSavings;
  });
  results.forEach((r, i) => (r.rank = i + 1));
  return results;
}

/**
 * Deterministic greedy shared-supply allocation (not an optimizer).
 * Walk candidates in rank order (skipping "Not viable"), allocate
 * min(demand, remaining supply), and never allocate the same heat twice.
 * A partial allocation that would no longer produce positive savings is skipped.
 */
export function allocatePortfolio(a: Assumptions, ranked: CandidateResult[], supply: SupplySummary): Portfolio {
  let remaining = supply.networkAvailableHeatMwh;
  const allocations: Allocation[] = [];
  let totalUnmet = 0;

  for (const r of ranked) {
    if (r.status === 'Not viable') {
      allocations.push({ customerId: r.customer.id, allocatedMwh: 0, unmetDemandMwh: 0, economics: null });
      continue;
    }
    let amount = Math.min(r.customer.annualDemandMwh, remaining);
    let economics = amount > 0 ? computeEconomics(a, amount, r.customer.requiredTempC, r.routeLengthM) : null;
    if (economics && economics.netAnnualSavings <= 0) {
      amount = 0;
      economics = null;
    }
    remaining -= amount;
    const unmet = r.customer.annualDemandMwh - amount;
    totalUnmet += unmet;
    allocations.push({ customerId: r.customer.id, allocatedMwh: amount, unmetDemandMwh: unmet, economics });
  }

  const connected = allocations.filter((x) => x.economics);
  const totalAllocatedMwh = connected.reduce((s, x) => s + x.allocatedMwh, 0);
  const totalNetAnnualSavings = connected.reduce((s, x) => s + (x.economics?.netAnnualSavings ?? 0), 0);
  const totalCapex = connected.reduce((s, x) => s + (x.economics?.connectionCapex ?? 0), 0);

  return {
    supplyMwh: supply.networkAvailableHeatMwh,
    allocations,
    totalAllocatedMwh,
    remainingUnusedMwh: Math.max(0, remaining),
    totalUnmetDemandMwh: totalUnmet,
    totalNetAnnualSavings,
    totalCapex,
    portfolioPaybackYears: totalNetAnnualSavings > 0 ? totalCapex / totalNetAnnualSavings : null,
  };
}
