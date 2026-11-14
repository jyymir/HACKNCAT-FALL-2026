import type { Assumptions, SupplySummary } from './types';

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Recoverable heat from the data center (simplified).
 * Assumes most IT electrical load ultimately becomes heat; only the captured
 * fraction is recovered, and recovery (heat-exchanger) efficiency is applied ONCE here.
 *
 *   recoverable_heat_mw = it_load_mw × capture_fraction × recovery_efficiency
 *   annual_mwh          = recoverable_heat_mw × operating_hours
 *   network_available   = annual_mwh × (1 − distribution_loss)
 */
export function computeSupply(a: Assumptions): SupplySummary {
  const recoverableHeatMw = a.itLoadMw * a.heatCaptureFraction * a.recoveryEfficiency;
  const annualRecoverableHeatMwh = recoverableHeatMw * a.operatingHours;
  const networkAvailableHeatMwh = annualRecoverableHeatMwh * (1 - a.distributionLossFraction);
  return { recoverableHeatMw, annualRecoverableHeatMwh, networkAvailableHeatMwh };
}

/** Heat-pump COP demo heuristic constants (NOT a certified equipment performance curve). */
export const COP_MAX = 5.0;
export const COP_MIN = 2.0;
export const COP_SLOPE_PER_C = 0.06;

export function temperatureLift(sourceTempC: number, requiredTempC: number): number {
  return Math.max(0, requiredTempC - sourceTempC);
}

/**
 * Demo heuristic: COP = clamp(5.0 − 0.06 × lift, 2.0, 5.0).
 * Real performance depends on source/sink temperatures, equipment and operating conditions.
 */
export function estimateCop(sourceTempC: number, requiredTempC: number): number {
  return clamp(COP_MAX - COP_SLOPE_PER_C * temperatureLift(sourceTempC, requiredTempC), COP_MIN, COP_MAX);
}

/** Great-circle (straight-line) distance in metres. This is NOT an engineered pipe route. */
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
