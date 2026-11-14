import type { Assumptions } from '../engine/types';

/**
 * Cooling-technology presets. Each sets the two inputs cooling actually changes in this model:
 * how much IT heat is captured in water, and how warm that water is.
 *
 * Only the liquid-cooling water temperature is sourced (Lenovo Press DS0187: Neptune supports
 * "inlet temperature from dew point to up to 45°C"). Every capture share, and the air / rear-door
 * temperatures, are illustrative screening assumptions, labeled as such in the UI.
 */
export interface CoolingOption {
  id: string;
  label: string;
  short: string;
  heatCaptureFraction: number;
  sourceTempC: number;
  description: string;
  basis: string;
  source?: { label: string; url: string };
}

export const NEPTUNE_SOURCE = {
  label: 'Lenovo Press DS0187 — ThinkSystem N1380 Neptune datasheet',
  url: 'https://lenovopress.lenovo.com/ds0187',
};

export const COOLING_OPTIONS: CoolingOption[] = [
  {
    id: 'air',
    label: 'Air cooling',
    short: 'Air',
    heatCaptureFraction: 0.5,
    sourceTempC: 30,
    description: 'Fans push heat into room air. Only part of it can be recovered, and it comes out barely warm.',
    basis: 'Illustrative assumption',
  },
  {
    id: 'rear-door',
    label: 'Rear-door heat exchanger',
    short: 'Rear-door',
    heatCaptureFraction: 0.7,
    sourceTempC: 35,
    description: 'Water-cooled doors on each rack catch exhaust air. More heat captured, still lukewarm.',
    basis: 'Illustrative assumption',
  },
  {
    id: 'liquid',
    label: 'Warm-water liquid cooling',
    short: 'Warm-water liquid',
    heatCaptureFraction: 0.95,
    sourceTempC: 45,
    description: 'Water flows right over the chips. Most heat goes into warm water, ready to reuse.',
    basis: '45 °C from Lenovo’s published inlet maximum (outlet water is warmer, so this is conservative). 95% capture is an illustrative assumption.',
    source: NEPTUNE_SOURCE,
  },
];

/** Which cooling option the current settings match, if any. */
export function detectCooling(a: Assumptions): CoolingOption | undefined {
  return COOLING_OPTIONS.find(
    (c) => Math.abs(c.heatCaptureFraction - a.heatCaptureFraction) < 1e-6 && Math.abs(c.sourceTempC - a.sourceTempC) < 1e-6,
  );
}

export function withCooling(a: Assumptions, c: CoolingOption): Assumptions {
  return { ...a, heatCaptureFraction: c.heatCaptureFraction, sourceTempC: c.sourceTempC };
}
