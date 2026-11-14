import type { Assumptions } from '../engine/types';

/** Single source of truth for every editable setting: labels, units, ranges, help text. */
export interface FieldDef {
  key: keyof Assumptions;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Displayed value = stored value × scale (fractions shown as %). */
  scale?: number;
  help: string;
}

export const GROUPS: { title: string; blurb: string; fields: FieldDef[]; expert?: boolean }[] = [
  {
    title: 'The data center',
    blurb: 'How much heat it makes and how much can be caught.',
    fields: [
      { key: 'itLoadMw', label: 'Computer power (IT load)', unit: 'MW', min: 0.5, max: 100, step: 0.5, help: 'How much electricity the servers use. Nearly all of it ends up as heat. 10 MW is about the power used by several thousand homes at once.' },
      { key: 'heatCaptureFraction', label: 'Share of heat captured', unit: '%', min: 0, max: 100, step: 1, scale: 100, help: 'How much of that heat the cooling system can collect in water. Liquid-cooled servers capture more than air-cooled ones.' },
      { key: 'sourceTempC', label: 'Temperature of the warm water', unit: '°C', min: 20, max: 70, step: 1, help: 'How warm the water coming out of the cooling system is. Warmer water is more useful, since less boosting is needed.' },
      { key: 'operatingHours', label: 'Hours running per year', unit: 'h/yr', min: 0, max: 8760, step: 100, help: 'A full year is 8,760 hours. Data centers run almost all the time.' },
    ],
  },
  {
    title: 'Energy prices',
    blurb: 'What electricity costs, and what buildings pay for heat today.',
    fields: [
      { key: 'electricityPricePerKwh', label: 'Electricity price', unit: '$/kWh', min: 0.02, max: 0.4, step: 0.01, help: 'Paid to run the heat pump that boosts the warm water to the temperature each building needs.' },
      { key: 'displacedHeatCostPerKwh', label: 'Buildings’ current heating cost', unit: '$/kWh', min: 0.02, max: 0.3, step: 0.01, help: 'What a building pays now (e.g. for a gas boiler) for each unit of heat. Every unit of data-center heat it uses saves this much.' },
    ],
  },
  {
    title: 'Building the connection',
    blurb: 'The one-time cost to lay pipe and install equipment.',
    fields: [
      { key: 'pipelineCostPerM', label: 'Pipe cost per meter', unit: '$/m', min: 200, max: 6000, step: 100, help: 'Cost to dig and lay insulated pipe. Placeholder value; real costs depend on the street, soil and permits.' },
      { key: 'fixedConnectionCost', label: 'Fixed cost per building', unit: '$', min: 0, max: 1_000_000, step: 10_000, help: 'A flat cost for every building connected (valves, metering, design work).' },
      { key: 'heatPumpCostPerKw', label: 'Heat pump equipment cost', unit: '$/kW', min: 0, max: 2000, step: 50, help: 'Cost of the heat pump and heat-exchange station, per kW of heating capacity the building needs.' },
    ],
  },
  {
    title: 'Fine-tuning (for experts)',
    blurb: 'Engineering and screening assumptions. The defaults are fine for most uses.',
    expert: true,
    fields: [
      { key: 'recoveryEfficiency', label: 'Heat exchanger efficiency', unit: '%', min: 50, max: 100, step: 1, scale: 100, help: 'Heat kept when passing heat from the data-center loop to the pipe network. Applied once.' },
      { key: 'distributionLossFraction', label: 'Heat lost in pipes', unit: '%', min: 0, max: 40, step: 1, scale: 100, help: 'Share of heat lost on the way through the network.' },
      { key: 'routeMultiplier', label: 'Pipe route vs. straight line', unit: '×', min: 1, max: 2.5, step: 0.05, help: 'Pipes follow streets, not straight lines. 1.3 means the pipe is 30% longer than the straight-line distance.' },
      { key: 'equivalentFullLoadHours', label: 'Full-load hours (sizing)', unit: 'h/yr', min: 1000, max: 8760, step: 100, help: 'Used to size each building’s heat pump from its yearly heat use.' },
      { key: 'maintenanceFractionOfCapex', label: 'Yearly upkeep', unit: '% of setup', min: 0, max: 10, step: 0.5, scale: 100, help: 'Maintenance each year, as a share of the setup cost.' },
      { key: 'maxDeliveryTempC', label: 'Hottest the heat pump can make', unit: '°C', min: 50, max: 130, step: 1, help: 'Buildings needing hotter heat than this (e.g. steam) can’t be served.' },
      { key: 'promisingPaybackYears', label: '“Good match” if pays back within', unit: 'years', min: 1, max: 30, step: 1, help: 'Payback target for a good match.' },
      { key: 'marginalPaybackYears', label: '“Possible match” if pays back within', unit: 'years', min: 2, max: 50, step: 1, help: 'Anything slower than this is “Not a fit”.' },
      { key: 'displacedHeatEmissionsKgPerMwh', label: 'Emissions of current heating', unit: 'kg CO₂/MWh', min: 0, max: 500, step: 10, help: 'Illustrative factor for the heating that gets replaced.' },
      { key: 'gridEmissionsKgPerMwh', label: 'Emissions of grid electricity', unit: 'kg CO₂/MWh', min: 0, max: 1000, step: 10, help: 'Illustrative factor for the electricity the heat pump uses.' },
    ],
  },
];


export const ALL_FIELDS: FieldDef[] = GROUPS.flatMap((g) => g.fields);
export const FIELD_BY_KEY = new Map(ALL_FIELDS.map((f) => [f.key, f]));
