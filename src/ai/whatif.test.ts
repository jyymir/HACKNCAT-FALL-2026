import { describe, expect, it } from 'vitest';
import { validateChanges, describeFields } from './whatif';
import { DEFAULT_ASSUMPTIONS as A } from '../data/demoCustomers';

describe('AI what-if validation', () => {
  it('applies known keys and reports display-unit changes', () => {
    const { next, applied } = validateChanges([{ key: 'electricityPricePerKwh', value: 0.15 }], A);
    expect(next.electricityPricePerKwh).toBeCloseTo(0.15);
    expect(applied[0]).toMatchObject({ from: 0.1, to: 0.15, clamped: false });
  });

  it('handles fraction fields shown as %', () => {
    const { next, applied } = validateChanges([{ key: 'heatCaptureFraction', value: 0.8 }], A);
    expect(next.heatCaptureFraction).toBeCloseTo(0.8);
    expect(applied[0]).toMatchObject({ from: 70, to: 80 });
  });

  it('clamps out-of-range values to slider limits', () => {
    const { next, applied } = validateChanges([{ key: 'itLoadMw', value: 5000 }], A);
    expect(next.itLoadMw).toBe(100);
    expect(applied[0].clamped).toBe(true);
  });

  it('rejects unknown keys, non-numbers and garbage input without touching assumptions', () => {
    const r = validateChanges([{ key: 'hackTheMatrix', value: 1 }, { key: 'itLoadMw', value: 'lots' }, null], A);
    expect(r.next).toEqual(A);
    expect(r.applied).toHaveLength(0);
    expect(r.rejected.length).toBe(3);
    expect(validateChanges('not an array', A).applied).toHaveLength(0);
  });

  it('describes fields in stored units', () => {
    const f = describeFields(A).find((x) => x.key === 'heatCaptureFraction')!;
    expect(f.max).toBe(1);
    expect(f.current).toBe(0.7);
  });
});
