import type { Assumptions, CandidateResult, Portfolio, SupplySummary } from '../engine/types';
import { STATUS_LABEL } from '../format';
import { detectCooling } from '../data/cooling';

const r0 = (n: number) => Math.round(n);
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compact, engine-computed facts sent to Gemini so its answer is grounded only in our outputs.
 * Gemini is told to use ONLY these numbers.
 */
export function buildMatchContext(
  selected: CandidateResult,
  ranked: CandidateResult[],
  a: Assumptions,
  supply: SupplySummary,
  portfolio: Portfolio,
) {
  const summarize = (r: CandidateResult) => ({
    rank: r.rank,
    name: r.customer.name,
    category: r.customer.category,
    verdict: `${STATUS_LABEL[r.status]} (${r.status})`,
    straightLineDistanceM: r0(r.straightLineM),
    annualHeatDemandMwh: r.customer.annualDemandMwh,
    requiredTempC: r.customer.requiredTempC,
    netAnnualSavingsUsd: r0(r.individual.netAnnualSavings),
    paybackYears: r.individual.simplePaybackYears === null ? 'none (loses money)' : r2(r.individual.simplePaybackYears),
  });
  const e = selected.individual;
  return {
    note: 'All buildings and values are fictional illustrative demo data. Figures are modeled estimates from a simplified screening model.',
    settings: {
      coolingTechnology: detectCooling(a)?.label ?? 'custom values',
      itLoadMw: a.itLoadMw,
      heatCapturePct: r0(a.heatCaptureFraction * 100),
      sourceWaterTempC: a.sourceTempC,
      electricityPricePerKwh: a.electricityPricePerKwh,
      buildingsCurrentHeatingCostPerKwh: a.displacedHeatCostPerKwh,
      pipeCostPerMeter: a.pipelineCostPerM,
      heatPumpMaxOutputTempC: a.maxDeliveryTempC,
      goodMatchIfPaybackWithinYears: a.promisingPaybackYears,
      possibleMatchIfPaybackWithinYears: a.marginalPaybackYears,
    },
    dataCenter: { usableHeatMw: r2(supply.recoverableHeatMw), usableHeatAfterPipeLossesMwhPerYear: r0(supply.networkAvailableHeatMwh) },
    selectedBuilding: {
      ...summarize(selected),
      heatUse: selected.customer.heatUse,
      canBeServed: selected.technicallyServable,
      estimatedPipeRouteM: r0(selected.routeLengthM),
      heatSuppliedMwhPerYear: r0(e.deliveredHeatMwh),
      temperatureBoostC: r0(e.temperatureLiftC),
      heatPumpCop: r2(e.cop),
      yearly: {
        heatingBillAvoidedUsd: r0(e.avoidedHeatingCost),
        heatPumpElectricityUsd: r0(e.heatPumpElectricityCost),
        upkeepUsd: r0(e.maintenanceCost),
        netSavingsUsd: r0(e.netAnnualSavings),
      },
      oneTimeSetupCostUsd: { total: r0(e.connectionCapex), pipe: r0(e.pipelineCapex), heatPumpEquipment: r0(e.equipmentCapex), fixed: a.fixedConnectionCost },
      modelReasons: selected.reasons.map((x) => x.text),
    },
    allBuildingsRanked: ranked.map(summarize),
    sharedHeat: {
      totalGivenMwh: r0(portfolio.totalAllocatedMwh),
      leftOverMwh: r0(portfolio.remainingUnusedMwh),
      unmetDemandMwh: r0(portfolio.totalUnmetDemandMwh),
    },
  };
}
