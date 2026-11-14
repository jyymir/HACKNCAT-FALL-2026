import { describe, expect, it } from 'vitest';
import { computeSupply, estimateCop, haversineM } from './thermal';
import { computeEconomics } from './economics';
import { allocatePortfolio, evaluateCandidates } from './matching';
import { COOLING_OPTIONS, detectCooling, withCooling } from '../data/cooling';
import { DEFAULT_ASSUMPTIONS as A, DEMO_CUSTOMERS, DEMO_DATA_CENTER, SCENARIOS } from '../data/demoCustomers';

const run = (a = A) => {
  const supply = computeSupply(a);
  const ranked = evaluateCandidates(a, DEMO_DATA_CENTER, DEMO_CUSTOMERS, supply);
  return { supply, ranked, portfolio: allocatePortfolio(a, ranked, supply) };
};

describe('thermal', () => {
  it('matches the brief example: 10 MW × 0.7 × 0.9 = 6.3 MW, 50,400 MWh', () => {
    const s = computeSupply(A);
    expect(s.recoverableHeatMw).toBeCloseTo(6.3);
    expect(s.annualRecoverableHeatMwh).toBeCloseTo(50_400);
    expect(s.networkAvailableHeatMwh).toBeCloseTo(45_360);
  });

  it('bounds COP between 2 and 5', () => {
    expect(estimateCop(45, 40)).toBe(5);
    expect(estimateCop(45, 70)).toBeCloseTo(3.5);
    expect(estimateCop(20, 150)).toBe(2);
  });

  it('haversine is roughly right (1° latitude ≈ 111 km)', () => {
    expect(haversineM(0, 0, 1, 0)).toBeGreaterThan(110_000);
    expect(haversineM(0, 0, 1, 0)).toBeLessThan(112_000);
  });
});

describe('economics', () => {
  it('uses $/kWh × 1000 and divides delivered heat by COP', () => {
    const e = computeEconomics(A, 1000, 70, 0);
    expect(e.heatPumpElectricityMwh).toBeCloseTo(1000 / 3.5);
    expect(e.avoidedHeatingCost).toBeCloseTo(90_000);
    expect(e.heatPumpElectricityCost).toBeCloseTo((1000 / 3.5) * 100);
  });

  it('returns null payback when savings are not positive', () => {
    const e = computeEconomics({ ...A, electricityPricePerKwh: 1 }, 1000, 90, 5000);
    expect(e.netAnnualSavings).toBeLessThan(0);
    expect(e.simplePaybackYears).toBeNull();
  });

  it('handles zero delivered heat without NaN', () => {
    const e = computeEconomics(A, 0, 70, 100);
    expect(Number.isFinite(e.netAnnualSavings)).toBe(true);
    expect(e.simplePaybackYears).toBeNull();
  });
});

describe('matching', () => {
  it('default scenario has at least one Promising and one Not viable', () => {
    const { ranked } = run();
    expect(ranked.some((r) => r.status === 'Promising')).toBe(true);
    expect(ranked.some((r) => r.status === 'Not viable')).toBe(true);
    expect(ranked[0].rank).toBe(1);
  });

  it('every candidate has 2–4 reasons', () => {
    for (const r of run().ranked) {
      expect(r.reasons.length).toBeGreaterThanOrEqual(2);
      expect(r.reasons.length).toBeLessThanOrEqual(4);
    }
  });

  it('portfolio never allocates more than supply, in every scenario', () => {
    for (const s of SCENARIOS) {
      const { portfolio } = run(s.assumptions);
      expect(portfolio.totalAllocatedMwh).toBeLessThanOrEqual(portfolio.supplyMwh + 1e-6);
      expect(portfolio.totalAllocatedMwh + portfolio.remainingUnusedMwh).toBeCloseTo(portfolio.supplyMwh);
    }
  });

  it('limited-supply scenario leaves unmet demand', () => {
    const { portfolio } = run(SCENARIOS.find((s) => s.id === 'limited')!.assumptions);
    expect(portfolio.totalUnmetDemandMwh).toBeGreaterThan(0);
    expect(portfolio.remainingUnusedMwh).toBeCloseTo(0);
  });

  it('unfavorable scenario makes things worse than baseline', () => {
    const base = run().ranked.filter((r) => r.status === 'Promising').length;
    const bad = run(SCENARIOS.find((s) => s.id === 'unfavorable')!.assumptions).ranked.filter((r) => r.status === 'Promising').length;
    expect(bad).toBeLessThan(base);
  });
});

describe('cooling options', () => {
  it('liquid cooling yields more usable heat and less heat-pump electricity per MWh than air', () => {
    const air = computeSupply(withCooling(A, COOLING_OPTIONS[0]));
    const liquid = computeSupply(withCooling(A, COOLING_OPTIONS[2]));
    expect(liquid.recoverableHeatMw).toBeGreaterThan(air.recoverableHeatMw);
    const hpAir = computeEconomics(withCooling(A, COOLING_OPTIONS[0]), 1000, 70, 0).heatPumpElectricityMwh;
    const hpLiquid = computeEconomics(withCooling(A, COOLING_OPTIONS[2]), 1000, 70, 0).heatPumpElectricityMwh;
    expect(hpLiquid).toBeLessThan(hpAir);
  });

  it('detects the active cooling option and returns undefined for custom values', () => {
    expect(detectCooling(withCooling(A, COOLING_OPTIONS[1]))?.id).toBe('rear-door');
    expect(detectCooling({ ...A, heatCaptureFraction: 0.83 })).toBeUndefined();
  });
});
