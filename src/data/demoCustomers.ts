import type { Assumptions, Customer, DataCenter } from '../engine/types';

/**
 * ILLUSTRATIVE DEMO DATA.
 * Customer locations, building demand, and engineering assumptions are fictional.
 * They are not measured customer data, verified buildings, or a site-specific feasibility study.
 * Coordinates were placed at chosen distances/bearings from the demo data center; distances
 * shown in the app are computed from these coordinates with the Haversine formula.
 */

export const DEMO_DATA_CENTER: DataCenter = {
  name: 'Demo AI Data Center (illustrative)',
  lat: 36.04,
  lon: -79.84,
};

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'c-hospital',
    name: 'Regional Hospital',
    category: 'Hospital',
    lat: 36.04589,
    lon: -79.8349,
    annualDemandMwh: 9000,
    requiredTempC: 70,
    heatUse: 'Space heating and domestic hot water, year-round',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-aquatic',
    name: 'Community Aquatic Center',
    category: 'Indoor pool',
    lat: 36.03656,
    lon: -79.83643,
    annualDemandMwh: 3200,
    requiredTempC: 40,
    heatUse: 'Pool water and hall heating',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-greenhouse',
    name: 'Northside Greenhouse',
    category: 'Greenhouse',
    lat: 36.03569,
    lon: -79.85463,
    annualDemandMwh: 14000,
    requiredTempC: 35,
    heatUse: 'Low-temperature growing-space heating',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-apartments',
    name: 'Maple Court Apartments',
    category: 'Apartment complex',
    lat: 36.04545,
    lon: -79.84389,
    annualDemandMwh: 3000,
    requiredTempC: 65,
    heatUse: 'Space heating and hot water for ~250 units',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-hotel',
    name: 'Grandview Hotel',
    category: 'Hotel',
    lat: 36.03646,
    lon: -79.84077,
    annualDemandMwh: 2000,
    requiredTempC: 85,
    heatUse: 'Hot water and legacy high-temperature radiators',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-school',
    name: 'Lincoln Middle School',
    category: 'School',
    lat: 36.03723,
    lon: -79.83059,
    annualDemandMwh: 1500,
    requiredTempC: 80,
    heatUse: 'Seasonal space heating (term-time only)',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-office',
    name: 'Riverside Office Park',
    category: 'Office building',
    lat: 36.04406,
    lon: -79.81152,
    annualDemandMwh: 1200,
    requiredTempC: 60,
    heatUse: 'Office space heating',
    dataQuality: 'Illustrative estimate',
  },
  {
    id: 'c-laundry',
    name: 'Eastside Industrial Laundry',
    category: 'Industrial process',
    lat: 36.04185,
    lon: -79.84627,
    annualDemandMwh: 4000,
    requiredTempC: 120,
    heatUse: 'Process steam for washing and drying',
    dataQuality: 'Illustrative estimate',
  },
];

/** Default assumptions — for demonstration only, not universal engineering values. */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  itLoadMw: 10,
  heatCaptureFraction: 0.7,
  sourceTempC: 45,
  operatingHours: 8000,
  recoveryEfficiency: 0.9,
  distributionLossFraction: 0.1,
  electricityPricePerKwh: 0.1,
  displacedHeatCostPerKwh: 0.09,
  pipelineCostPerM: 1500,
  routeMultiplier: 1.3,
  fixedConnectionCost: 100_000,
  heatPumpCostPerKw: 600,
  equivalentFullLoadHours: 4000,
  maintenanceFractionOfCapex: 0.02,
  maxDeliveryTempC: 90,
  promisingPaybackYears: 10,
  marginalPaybackYears: 20,
  displacedHeatEmissionsKgPerMwh: 200,
  gridEmissionsKgPerMwh: 370,
};

export interface Scenario {
  id: string;
  label: string;
  description: string;
  assumptions: Assumptions;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    description: 'Default illustrative assumptions.',
    assumptions: DEFAULT_ASSUMPTIONS,
  },
  {
    id: 'favorable',
    label: 'A · Favorable',
    description: 'Warmer source water, better capture, cheaper pipe and power.',
    assumptions: { ...DEFAULT_ASSUMPTIONS, sourceTempC: 55, heatCaptureFraction: 0.8, pipelineCostPerM: 1200, electricityPricePerKwh: 0.08 },
  },
  {
    id: 'unfavorable',
    label: 'B · Unfavorable',
    description: 'Pipeline cost doubled and electricity price raised.',
    assumptions: { ...DEFAULT_ASSUMPTIONS, pipelineCostPerM: 3000, electricityPricePerKwh: 0.16 },
  },
  {
    id: 'limited',
    label: 'C · Limited supply',
    description: 'Smaller IT load — not enough heat for every viable customer.',
    assumptions: { ...DEFAULT_ASSUMPTIONS, itLoadMw: 4 },
  },
];
