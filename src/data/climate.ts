/**
 * Monthly heating degree-days (HDD) for the demo location, baked in so the demo never depends
 * on a live weather API.
 *
 * Source: Open-Meteo Historical Weather API (ERA5 reanalysis), daily mean 2 m temperature for
 * 2024-01-01..2024-12-31 at 36.04 N, -79.84 E (Greensboro, NC area; the demo data center location).
 * HDD = Σ max(0, 18 °C − daily mean temperature), summed per month. Computed once on 2026-11-14.
 *
 * One historical year, not a long-term climate normal. Good enough to show the seasonal shape.
 */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2024 (leap year)

export const HDD_C_MONTHLY = [411, 312, 209, 80, 6, 0, 0, 0, 0, 92, 190, 383];

export const CLIMATE_SOURCE = {
  label: 'Open-Meteo Historical Weather API (ERA5), Greensboro NC area, 2024 daily mean temperature',
  url: 'https://open-meteo.com/en/docs/historical-weather-api',
  basis: 'Heating degree-days, base 18 °C, computed from one historical year (2024)',
};
