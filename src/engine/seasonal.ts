import type { Customer, CustomerCategory } from './types';
import { DAYS_IN_MONTH, HDD_C_MONTHLY } from '../data/climate';

/**
 * Seasonal (monthly) demand model: a transparent heating-degree-day split, not machine learning.
 *
 *   demand_m = annual × [ base_share × days_m / days_year  +  (1 − base_share) × HDD_m / Σ HDD ]
 *
 * base_share is the year-round, weather-independent part of a building's heat use (hot water,
 * pool water, process heat). The rest scales with how cold each month is. Annual totals are
 * unchanged; only their timing changes.
 */

/** ILLUSTRATIVE assumptions: share of annual heat use that does not depend on outdoor temperature. */
export const BASE_LOAD_SHARE: Record<CustomerCategory, number> = {
  Hospital: 0.45, // hot water, sterilization, humidification run all year
  'Indoor pool': 0.6, // pool water heating is year-round
  Greenhouse: 0.15, // mostly space heating
  'Apartment complex': 0.25, // domestic hot water
  'Office building': 0.1, // almost all space heating
  Hotel: 0.4, // hot water and laundry
  School: 0.1, // almost all space heating
  'Industrial process': 0.9, // process heat barely depends on weather
};

const DAYS_YEAR = DAYS_IN_MONTH.reduce((s, d) => s + d, 0);
const HDD_YEAR = HDD_C_MONTHLY.reduce((s, h) => s + h, 0);

/** Monthly heat demand (MWh-th) for one building. Sums exactly to its annual demand. */
export function demandProfile(c: Customer): number[] {
  const base = BASE_LOAD_SHARE[c.category];
  return DAYS_IN_MONTH.map((days, m) => c.annualDemandMwh * (base * (days / DAYS_YEAR) + (1 - base) * (HDD_C_MONTHLY[m] / HDD_YEAR)));
}

/** Data-center heat is assumed steady, so annual supply is spread by days in the month. */
export function supplyProfile(annualMwh: number): number[] {
  return DAYS_IN_MONTH.map((days) => annualMwh * (days / DAYS_YEAR));
}

export const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
