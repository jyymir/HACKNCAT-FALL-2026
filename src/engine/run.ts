import type { Assumptions, CandidateResult, Customer, DataCenter, Portfolio, SupplySummary } from './types';
import { computeSupply } from './thermal';
import { allocatePortfolio, annualPeriods, evaluateCandidates, type Periods } from './matching';
import { demandProfile, supplyProfile } from './seasonal';

export interface ModelOptions {
  /** true = monthly, weather-based demand (default); false = original annual-average model. */
  seasonal: boolean;
}

export const DEFAULT_OPTIONS: ModelOptions = { seasonal: true };

export interface ModelRun {
  supply: SupplySummary;
  ranked: CandidateResult[];
  portfolio: Portfolio;
  options: ModelOptions;
}

/** Full pipeline: supply → individual candidates → ranking → shared-supply portfolio. */
export function runModel(a: Assumptions, dc: DataCenter, customers: Customer[], options: ModelOptions = DEFAULT_OPTIONS): ModelRun {
  const supply = computeSupply(a);
  const periods: Periods = options.seasonal
    ? { supply: supplyProfile(supply.networkAvailableHeatMwh), demand: demandProfile }
    : annualPeriods(supply);
  const ranked = evaluateCandidates(a, dc, customers, supply, periods);
  return { supply, ranked, portfolio: allocatePortfolio(a, ranked, supply, periods), options };
}

/** Heat-pump electricity across the buildings that actually receive heat in the portfolio (MWh-e/yr). */
export function portfolioElectricityMwh(p: Portfolio): number {
  return p.allocations.reduce((s, x) => s + (x.economics?.heatPumpElectricityMwh ?? 0), 0);
}

/** Net avoided emissions across connected buildings (t CO₂e/yr, illustrative factors). */
export function portfolioEmissionsT(p: Portfolio): number {
  return p.allocations.reduce((s, x) => s + (x.economics?.netAvoidedEmissionsT ?? 0), 0);
}

/** Headline numbers used by the scenario comparison and the AI before/after preview. */
export function summarize(run: ModelRun) {
  const { supply, ranked, portfolio: p } = run;
  return {
    usableHeatMw: supply.recoverableHeatMw,
    heatUsedMwh: p.totalAllocatedMwh,
    heatUsedPct: supply.networkAvailableHeatMwh > 0 ? (p.totalAllocatedMwh / supply.networkAvailableHeatMwh) * 100 : 0,
    good: ranked.filter((r) => r.status === 'Promising').length,
    possible: ranked.filter((r) => r.status === 'Marginal').length,
    savings: p.totalNetAnnualSavings,
    capex: p.totalCapex,
    payback: p.portfolioPaybackYears,
    unmetMwh: p.totalUnmetDemandMwh,
    emissionsT: portfolioEmissionsT(p),
  };
}
export type RunSummary = ReturnType<typeof summarize>;
