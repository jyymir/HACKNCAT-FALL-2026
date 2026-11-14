import type { Assumptions, CandidateResult, Customer, DataCenter, Portfolio, SupplySummary } from './types';
import { computeSupply } from './thermal';
import { allocatePortfolio, evaluateCandidates } from './matching';

export interface ModelRun {
  supply: SupplySummary;
  ranked: CandidateResult[];
  portfolio: Portfolio;
}

/** Full pipeline: supply → individual candidates → ranking → shared-supply portfolio. */
export function runModel(a: Assumptions, dc: DataCenter, customers: Customer[]): ModelRun {
  const supply = computeSupply(a);
  const ranked = evaluateCandidates(a, dc, customers, supply);
  return { supply, ranked, portfolio: allocatePortfolio(a, ranked, supply) };
}

/** Heat-pump electricity across the buildings that actually receive heat in the portfolio (MWh-e/yr). */
export function portfolioElectricityMwh(p: Portfolio): number {
  return p.allocations.reduce((s, x) => s + (x.economics?.heatPumpElectricityMwh ?? 0), 0);
}
