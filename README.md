# Lenovo HeatMatch: waste-heat reuse planner for AI data centers (prototype)

> **Prototype · Illustrative scenario.** Customer locations, building demand and most engineering assumptions are illustrative demo data. They are not measured customer data or a site-specific feasibility study. Outputs are screening estimates, not engineering, legal or investment advice.
>
> HeatMatch is a concept designed to complement advanced data-center cooling such as warm-water liquid cooling. It is **not** an existing Lenovo product and does not imply Lenovo endorsement.

AI data centers turn almost all of their electricity into heat and usually throw it away. Nearby hospitals, pools, greenhouses and apartments pay to make heat. HeatMatch screens those neighbors in minutes and shows which could use the heat, which can't, and why. It accounts for temperature, demand, distance, seasons, cooling technology and cost.

- U.S. data centers used ~176 TWh in 2023 (~4.4% of U.S. electricity), projected at 325–580 TWh by 2028 ([DOE / LBNL](https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers)).
- Global data-center electricity was ~415 TWh in 2024, projected at ~945 TWh by 2030 ([IEA, Energy and AI](https://www.iea.org/reports/energy-and-ai/executive-summary)).

## Run it

Requires Node 18+ (tested on Node 22).

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 24 unit tests (Vitest)
npm run build    # type-check + production build
```

Optional AI assistant (Gemini):

```bash
cp .env.example .env.local     # git-ignored; put your key in GEMINI_API_KEY
npm run dev                    # restart after editing .env.local
```

Everything except map tiles and the optional AI works offline. The 3D map uses free OpenFreeMap vector tiles (no API key) and WebGL. If it can't load within 15 s, it switches to the **Offline view** automatically, and you can also pick that view yourself. Without a Gemini key the AI boxes say "AI assistant is off" and everything else works.

## Pages

| Page | What it does |
|---|---|
| **Overview** | Headline numbers, top matches, the "Why liquid cooling matters" comparison, and a one-line impact summary. |
| **Set up** | Cooling technology (air / rear-door / warm-water liquid), the demand model (month-by-month or yearly average), scenario presets, all settings with **?** explanations, a live heat-flow panel, and the AI what-if box with a before/after preview. |
| **Matches** | 3D map (tilt/rotate; real OpenStreetMap 3D buildings for context; each candidate is a column whose height = yearly heat demand, colored by verdict; red block = data center) with 2D and offline views, plus building list. The selected building gets a verdict, up to 3 reasons, key facts, heat use by month, and a folded money breakdown and technical details. Also "Ask about this building" (AI). |
| **Compare** | Ranked table and yearly-savings chart (individual estimates). |
| **Share heat** | One heat supply shared out best match first, with no double-counting. Includes a month-by-month chart showing winter shortfall and summer surplus. |
| **Scenarios** | Save, load, rename, duplicate and delete scenarios, and compare up to 3 with current settings side by side. |
| **Report** | Print / Save as PDF, CSV download, report preview, glossary, math and limitations, references. |
| **About** | The problem (sourced stats), who it's for, what's different, why Lenovo, live impact, and **what's built vs. modeled vs. conceptual**. |

## What is real, what is modeled, what is conceptual

| | |
|---|---|
| **Built and working** | Calculation engine (TypeScript, 24 tests); ranking with plain-language reasons; map with offline view; month-by-month supply/demand and shared-supply allocation; cooling comparison; scenario save/compare; Gemini what-ifs (with engine-computed before/after) and grounded Q&A; print report and CSV. |
| **Real data used** | 2024 daily temperatures for the Greensboro NC area ([Open-Meteo / ERA5](https://open-meteo.com/en/docs/historical-weather-api)), converted to monthly heating degree-days and baked into `src/data/climate.ts`. 45 °C warm-water inlet for liquid cooling ([Lenovo Press DS0187](https://lenovopress.lenovo.com/ds0187)). OpenStreetMap tiles. |
| **Modeled / illustrative** | All 8 buildings (names, locations, demand, temperatures); costs; prices; emissions factors; heat-pump efficiency heuristic; heat-capture shares; year-round demand shares per building type. |
| **Conceptual** | Real building discovery and utility data; engineered pipe routes and shared trunk networks; hourly matching and heat storage; live telemetry; full project finance. See `docs/ROADMAP_AND_SCALABILITY.txt`. |

## Model (src/engine)

| Step | Formula |
|---|---|
| Recoverable heat | `IT load × capture share × recovery efficiency` (efficiency applied once) |
| Usable after pipes | `× operating hours × (1 − distribution loss)` |
| Monthly split | Supply: steady, spread by days in the month. Demand: `annual × [base share × days/365 + (1 − base share) × HDD_month / HDD_year]` (heating degree-days, base 18 °C) |
| Delivered | Month by month: `min(demand, supply)`, or 0 if the required temperature is above the heat pump's limit |
| COP (demo heuristic) | `clamp(5.0 − 0.06 × max(0, T_required − T_source), 2.0, 5.0)` |
| Costs | Capex = `pipe route × $/m + fixed + heat-pump capacity × $/kW`. Opex = `heat-pump electricity + maintenance (% of capex)` |
| Net savings / payback | `avoided heating − opex`. Payback = `capex ÷ net` (only if net > 0) |
| Verdict | Not a fit: temperature too high, net ≤ 0, or payback > 20 yrs. Good match: payback ≤ 10 yrs. Possible: in between |
| Sharing heat | Greedy, month by month, in rank order. Heat is never allocated twice; any shortfall is backup heating |

**Baseline results (10 MW, monthly demand):** 6.3 MW usable heat, 25,905 MWh/yr actually used (57%), $1.48M/yr savings, $11.8M setup, 7.9-yr payback, ~2,920 t CO₂/yr avoided (illustrative). January is 2,243 MWh short; 79% of summer heat goes unused. 3 good matches (greenhouse, hospital, aquatic center), 2 possible (apartments, hotel), 3 not a fit (school: too little demand for the cost; laundry: needs 120 °C; office park: too far).

**Cooling comparison (baseline, monthly):** air cooling $1.13M/yr with 8,432 MWh of backup heating; warm-water liquid cooling $1.72M/yr with 1,382 MWh of backup.

## Gemini AI assistant

- **Ask a what-if** (Set up): Gemini turns plain language into setting changes and returns structured JSON. The app throws out unknown settings, keeps values within slider ranges, and shows the engine's before/after. Then you choose **Apply**, **Save as scenario** or **Discard**.
- **Ask about a building** (Matches): answers use only the app's own computed results, and every answer is labeled AI-generated.
- The key stays server-side in a Vite middleware (`server/geminiProxy.ts`), never in the browser. Default model `gemini-3.6-flash`, with one retry, then fallbacks to `gemini-3.8-flash`, `gemini-3.5-flash-lite` and `gemini-flash-latest` when it's busy or a model has been retired. Override with `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS`.
- AI needs `npm run dev` or `npm run preview`. A static build shows "AI assistant is off".

## Demo script (~3 min)

1. **Overview**: 6.3 MW usable heat, 3 good matches, and "Why liquid cooling matters": liquid vs. air means +53% savings and much less winter backup heating.
2. **Matches**: click **Regional Hospital** → good match and why. Then **Eastside Industrial Laundry**: close and large, but needs 120 °C → not a fit.
3. **Share heat**: the month-by-month chart shows January short by 2,243 MWh and 79% of summer heat unused. The model counts only heat that is delivered *and used*.
4. **Set up**: ask the AI "What if electricity got 50% more expensive?", show the before/after, then **Save as scenario**.
5. **Scenarios**: compare current settings vs. the saved what-if vs. **C · Limited supply**.
6. **About**: what's real, what's modeled, what's conceptual.

## Structure

```
src/
  engine/      types, thermal, economics, matching (period-based), seasonal, run (+ tests)
  data/        demoCustomers, fields, cooling, climate (baked weather), savedScenarios
  ai/          Gemini client, grounded context, what-if validator (+ tests)
  pages/       Home, Setup, Matches, Compare, Share, Scenarios, Report, About
  components/  CustomerMap, ResultsCharts, CoolingCompare, AiPanels, Report, ui
server/        geminiProxy.ts (Vite middleware; holds the API key)
docs/          ROADMAP_AND_SCALABILITY.txt, PITCH_DECK_GUIDE.txt
```
