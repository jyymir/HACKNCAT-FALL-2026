import type { Assumptions, CandidateEconomics } from './types';
import { estimateCop, temperatureLift } from './thermal';

const KWH_PER_MWH = 1000;

/**
 * Annual economics for delivering `deliveredHeatMwh` to one customer.
 * Only heat actually delivered AND consumed earns avoided-cost value.
 *
 *   heat_pump_electricity_mwh = delivered / COP
 *   avoided_heating_cost      = delivered × 1000 × displaced_cost_per_kwh
 *   electricity_cost          = hp_electricity × 1000 × electricity_price_per_kwh
 *   capex = route_m × pipe_cost_per_m + fixed_connection + hp_capacity_kw × hp_cost_per_kw
 *   maintenance               = capex × maintenance_fraction
 *   net_annual_savings        = avoided − (electricity + maintenance)
 *   simple_payback            = capex / net_annual_savings   (only if net > 0)
 */
export function computeEconomics(
  a: Assumptions,
  deliveredHeatMwh: number,
  requiredTempC: number,
  routeLengthM: number,
): CandidateEconomics {
  const cop = estimateCop(a.sourceTempC, requiredTempC);
  const lift = temperatureLift(a.sourceTempC, requiredTempC);
  const heatPumpElectricityMwh = deliveredHeatMwh / cop;

  const avoidedHeatingCost = deliveredHeatMwh * KWH_PER_MWH * a.displacedHeatCostPerKwh;
  const heatPumpElectricityCost = heatPumpElectricityMwh * KWH_PER_MWH * a.electricityPricePerKwh;

  // Capacity sized from annual energy via equivalent full-load hours (illustrative).
  const capacityKw = a.equivalentFullLoadHours > 0 ? (deliveredHeatMwh * KWH_PER_MWH) / a.equivalentFullLoadHours : 0;
  const equipmentCapex = deliveredHeatMwh > 0 ? capacityKw * a.heatPumpCostPerKw : 0;
  const pipelineCapex = routeLengthM * a.pipelineCostPerM;
  const connectionCapex = pipelineCapex + a.fixedConnectionCost + equipmentCapex;

  const maintenanceCost = connectionCapex * a.maintenanceFractionOfCapex;
  const annualOperatingCost = heatPumpElectricityCost + maintenanceCost;
  const netAnnualSavings = avoidedHeatingCost - annualOperatingCost;
  const simplePaybackYears = netAnnualSavings > 0 ? connectionCapex / netAnnualSavings : null;

  const netAvoidedEmissionsT =
    (deliveredHeatMwh * a.displacedHeatEmissionsKgPerMwh - heatPumpElectricityMwh * a.gridEmissionsKgPerMwh) / 1000;

  return {
    deliveredHeatMwh,
    cop,
    temperatureLiftC: lift,
    heatPumpElectricityMwh,
    avoidedHeatingCost,
    heatPumpElectricityCost,
    maintenanceCost,
    annualOperatingCost,
    netAnnualSavings,
    pipelineCapex,
    equipmentCapex,
    connectionCapex,
    simplePaybackYears,
    netAvoidedEmissionsT,
  };
}
