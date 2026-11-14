import type { Status } from './engine/types';

export const fmtNum = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtMoney = (n: number) => {
  const sign = n < 0 ? '−' : '';
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000) return `${sign}$${Math.round(v / 1000)}k`;
  return `${sign}$${fmtNum(v)}`;
};

export const fmtDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

export const fmtPayback = (y: number | null) => (y === null ? 'Never (loses money)' : `${y.toFixed(1)} years`);

export const STATUS_CLASS: Record<Status, string> = {
  Promising: 'promising',
  Marginal: 'marginal',
  'Not viable': 'notviable',
};

/** Everyday wording shown first; the technical screening status is kept alongside it. */
export const STATUS_LABEL: Record<Status, string> = {
  Promising: 'Good match',
  Marginal: 'Possible match',
  'Not viable': 'Not a fit',
};

export const STATUS_BLURB: Record<Status, string> = {
  Promising: 'Pays for itself within the target time.',
  Marginal: 'Could work, but takes a long time to pay for itself.',
  'Not viable': 'Doesn’t work under the current settings.',
};

/** Must match the --promising / --marginal / --notviable tokens in app.css (Leaflet needs literal colors). */
export const STATUS_COLOR: Record<Status, string> = {
  Promising: '#1f8a5b',
  Marginal: '#c27c0e',
  'Not viable': '#c2410c',
};

/**
 * Rough, illustrative comparison only: assumes ~12 MWh of heat per typical home per year
 * (space heating + hot water). Used to make MWh relatable, not as a sourced statistic.
 */
export const MWH_PER_HOME = 12;

export const DISCLAIMER =
  'Customer locations, building demand, and engineering assumptions in this prototype are illustrative demo data. They are not measured customer data or a site-specific feasibility study.';
