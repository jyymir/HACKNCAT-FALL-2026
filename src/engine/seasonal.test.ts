import { describe, expect, it } from 'vitest';
import { demandProfile, supplyProfile, sum } from './seasonal';
import { runModel, summarize } from './run';
import { DEFAULT_ASSUMPTIONS as A, DEMO_CUSTOMERS, DEMO_DATA_CENTER, SCENARIOS } from '../data/demoCustomers';

describe('seasonal demand model', () => {
  it('monthly profiles keep annual totals unchanged', () => {
    for (const c of DEMO_CUSTOMERS) expect(sum(demandProfile(c))).toBeCloseTo(c.annualDemandMwh, 6);
    expect(sum(supplyProfile(45_360))).toBeCloseTo(45_360, 6);
  });

  it('heating-driven buildings peak in winter; process heat stays nearly flat', () => {
    const school = demandProfile(DEMO_CUSTOMERS.find((c) => c.category === 'School')!);
    expect(school[0]).toBeGreaterThan(school[6] * 5); // Jan ≫ Jul
    const laundry = demandProfile(DEMO_CUSTOMERS.find((c) => c.category === 'Industrial process')!);
    expect(laundry[0] / laundry[6]).toBeLessThan(2);
  });

  it('never allocates more than the monthly supply, in any scenario', () => {
    for (const s of SCENARIOS) {
      const { portfolio: p } = runModel(s.assumptions, DEMO_DATA_CENTER, DEMO_CUSTOMERS, { seasonal: true });
      expect(p.periods).toHaveLength(12);
      for (const m of p.periods) {
        expect(m.deliveredMwh).toBeLessThanOrEqual(m.supplyMwh + 1e-6);
        expect(m.deliveredMwh + m.unusedMwh).toBeCloseTo(m.supplyMwh, 6);
      }
      expect(p.totalAllocatedMwh).toBeCloseTo(sum(p.periods.map((m) => m.deliveredMwh)), 6);
    }
  });

  it('baseline: winter needs backup heating while summer heat goes unused', () => {
    const { portfolio: p } = runModel(A, DEMO_DATA_CENTER, DEMO_CUSTOMERS, { seasonal: true });
    expect(p.periods[0].unmetMwh).toBeGreaterThan(0); // January short
    expect(p.periods[6].unusedMwh).toBeGreaterThan(p.periods[6].supplyMwh * 0.5); // July mostly unused
  });

  it('monthly mode uses no more heat than the annual-average mode', () => {
    const annual = summarize(runModel(A, DEMO_DATA_CENTER, DEMO_CUSTOMERS, { seasonal: false }));
    const monthly = summarize(runModel(A, DEMO_DATA_CENTER, DEMO_CUSTOMERS, { seasonal: true }));
    expect(monthly.heatUsedMwh).toBeLessThanOrEqual(annual.heatUsedMwh + 1e-6);
  });

  it('a more expensive what-if shows lower savings in the before/after summary', () => {
    const before = summarize(runModel(A, DEMO_DATA_CENTER, DEMO_CUSTOMERS));
    const after = summarize(runModel({ ...A, electricityPricePerKwh: 0.15 }, DEMO_DATA_CENTER, DEMO_CUSTOMERS));
    expect(after.savings).toBeLessThan(before.savings);
  });
});
