/**
 * Shared types for the HeatMatch screening model.
 *
 * Unit conventions (used everywhere):
 *   - Power: MW (thermal = MWth, electrical = MWe)
 *   - Energy: MWh (thermal heat = MWh-th, electricity = MWh-e)
 *   - Prices: $/kWh as entered by the user, converted to $/MWh (× 1,000) inside the engine
 *   - Distance: metres
 *   - Temperature: °C
 *   - Money: US dollars (nominal, undiscounted)
 */

export type DataQuality = 'Illustrative estimate' | 'Illustrative demo location' | 'Modeled' | 'Sourced';

export type CustomerCategory =
  | 'Hospital'
  | 'Indoor pool'
  | 'Greenhouse'
  | 'Apartment complex'
  | 'Office building'
  | 'Hotel'
  | 'School'
  | 'Industrial process';

export interface Customer {
  id: string;
  name: string;
  category: CustomerCategory;
  lat: number;
  lon: number;
  /** Illustrative modeled annual heat demand (MWh-th/year). NOT a measured utility bill. */
  annualDemandMwh: number;
  /** Required supply/delivery temperature (°C). */
  requiredTempC: number;
  /** Short description of what the heat would be used for. */
  heatUse: string;
  dataQuality: DataQuality;
}

export interface DataCenter {
  name: string;
  lat: number;
  lon: number;
}

/** All user-editable assumptions. */
export interface Assumptions {
  // --- Data center ---
  itLoadMw: number;
  heatCaptureFraction: number; // 0–1
  sourceTempC: number;
  operatingHours: number; // h/year
  recoveryEfficiency: number; // 0–1, applied ONCE in recoverable heat
  distributionLossFraction: number; // 0–1, applied ONCE to heat sent through the network

  // --- Prices ---
  electricityPricePerKwh: number; // $/kWh-e
  displacedHeatCostPerKwh: number; // $/kWh-th

  // --- Connection & equipment ---
  pipelineCostPerM: number; // $ per route-metre
  routeMultiplier: number; // straight-line → estimated route length
  fixedConnectionCost: number; // $ per customer
  heatPumpCostPerKw: number; // $ per kW-th of heat-pump/substation capacity
  equivalentFullLoadHours: number; // h/year used to size capacity from annual energy
  maintenanceFractionOfCapex: number; // 0–1 per year

  // --- Heat-pump COP heuristic ---
  maxDeliveryTempC: number; // above this, the modeled heat pump cannot serve the load

  // --- Screening thresholds ---
  promisingPaybackYears: number;
  marginalPaybackYears: number;

  // --- Optional emissions (illustrative factors) ---
  displacedHeatEmissionsKgPerMwh: number; // kg CO2e per MWh-th of displaced heating
  gridEmissionsKgPerMwh: number; // kg CO2e per MWh-e of grid electricity
}

export type Status = 'Promising' | 'Marginal' | 'Not viable';

export interface SupplySummary {
  recoverableHeatMw: number;
  annualRecoverableHeatMwh: number;
  /** Heat left after network distribution losses — the shared pool every candidate draws on. */
  networkAvailableHeatMwh: number;
}

export interface Reason {
  tone: 'good' | 'bad' | 'neutral';
  text: string;
}

/** Economics for one candidate at a given amount of delivered heat. */
export interface CandidateEconomics {
  deliveredHeatMwh: number;
  cop: number;
  temperatureLiftC: number;
  heatPumpElectricityMwh: number;
  avoidedHeatingCost: number;
  heatPumpElectricityCost: number;
  maintenanceCost: number;
  annualOperatingCost: number;
  netAnnualSavings: number;
  pipelineCapex: number;
  equipmentCapex: number;
  connectionCapex: number; // total capex = pipeline + fixed + equipment
  /** null when net savings ≤ 0 (no positive payback). */
  simplePaybackYears: number | null;
  netAvoidedEmissionsT: number; // tonnes CO2e/year
}

export interface CandidateResult {
  customer: Customer;
  straightLineM: number;
  routeLengthM: number;
  /** Individual potential: heat available if this customer were the ONLY one connected. */
  heatAvailableToCustomerMwh: number;
  technicallyServable: boolean;
  /** Individual opportunity estimate (not simultaneously achievable with other candidates). */
  individual: CandidateEconomics;
  status: Status;
  reasons: Reason[];
  rank: number;
}

export interface Allocation {
  customerId: string;
  allocatedMwh: number;
  unmetDemandMwh: number;
  economics: CandidateEconomics | null;
}

export interface Portfolio {
  supplyMwh: number;
  allocations: Allocation[];
  totalAllocatedMwh: number;
  remainingUnusedMwh: number;
  totalUnmetDemandMwh: number; // unmet demand among candidates eligible for allocation
  totalNetAnnualSavings: number;
  totalCapex: number;
  portfolioPaybackYears: number | null;
}
