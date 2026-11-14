# Lenovo HeatMatch — Waste-heat reuse feasibility planner (prototype)

> **Prototype · Illustrative scenario.** Customer locations, building demand, and engineering assumptions in this prototype are illustrative demo data. They are not measured customer data or a site-specific feasibility study. Outputs are screening estimates, not engineering, legal, or investment advice.
>
> HeatMatch is a concept designed to complement advanced data-center cooling infrastructure (such as warm-water liquid cooling). It is **not** an existing Lenovo product and does not imply Lenovo endorsement.

## Run it

Requires Node 18+ (tested on Node 22).

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine unit tests (Vitest)
npm run build    # type-check + production build
```

Everything runs locally in the browser. There's no backend and no database. The only network dependency is OpenStreetMap map tiles. If the venue Wi-Fi fails, switch the map to **Simple view**.

## Optional: Gemini AI assistant

There are two AI features. Both are optional, and the app works fully without them.

- **Set up → "Ask a what-if in your own words"**: e.g. *"What if electricity got 50% more expensive?"*. Gemini returns structured JSON setting changes. The app throws out unknown settings, keeps values within the slider ranges, shows the proposed changes for you to review, and only applies them when you click **Apply**. **Undo** is available afterwards. The engine then recalculates everything.
- **Find matches → "Ask about [building]"**: suggested and free-form questions. Gemini receives only the engine's computed results for that building and the ranking, and it is told not to invent data or calculate new numbers. Answers are labeled "AI-generated".

**Setup**

```bash
cp .env.example .env.local     # .env.local is git-ignored
# put your key from https://aistudio.google.com/apikey into GEMINI_API_KEY
npm run dev                    # restart after editing .env.local
```

**How the key stays private:** `server/geminiProxy.ts` is a small middleware inside the Vite dev/preview server (not a separate backend). The browser only calls `/api/ai/*`, and the key is never bundled because it has no `VITE_` prefix. As a result, AI features need `npm run dev` or `npm run preview`. A purely static deployment just shows "AI assistant is turned off". The model defaults to `gemini-3.6-flash`, with `gemini-2.5-flash` as an automatic fallback if it is busy (retry once, then fall back). Override with `GEMINI_MODEL` and `GEMINI_FALLBACK_MODELS`. Answers are cached in memory, so repeating a demo question doesn't hit the network again.

## What it does: a guided, five-step site

The pages use hash routing (`#setup`, `#matches`, …) and share one live model, so changing a setting updates every page.

| Page | Purpose |
|---|---|
| **Home** | Plain-language explanation, a live snapshot (usable heat, ~homes' worth of heat used, good matches) and the "being nearby isn't enough" idea. |
| **1 · Set up** | What-if scenario cards (Baseline, A Favorable, B Unfavorable, C Limited supply). Settings are grouped with **?** explanations, and expert settings are collapsed. A live "heat flow" panel shows servers → captured → usable → reaches buildings. |
| **2 · Find matches** | Map (or offline "Simple view") plus a building list. The selected building gets a one-sentence verdict, plain-language reasons, key facts, a yearly money breakdown, and expandable technical details. |
| **3 · Compare** | Ranked table and a yearly-savings bar chart. Individual estimates are labeled "not all achievable at once". |
| **4 · Share heat** | Greedy shared-supply allocation: who gets heat, what's left over, unmet demand, and which buildings were skipped and why. |
| **5 · Report** | Print / Save as PDF, CSV download, an on-screen report preview, a glossary, how the math works, limitations and references. |

Verdicts use everyday labels (Good match / Possible match / Not a fit), with the screening status (Promising / Marginal / Not viable) shown alongside.

## Model (src/engine)

| Step | Formula |
|---|---|
| Recoverable heat | `IT load × capture fraction × recovery efficiency` (efficiency applied once) |
| Annual heat | `recoverable MW × operating hours` |
| Network-available | `annual heat × (1 − distribution loss)` |
| Delivered | `min(customer demand, network-available)`, or 0 if the required temperature is above the max heat-pump output |
| COP (demo heuristic) | `clamp(5.0 − 0.06 × max(0, T_required − T_source), 2.0, 5.0)` |
| HP electricity | `delivered ÷ COP` (MWh-e) |
| Capex | `straight-line m × route multiplier × $/m + fixed connection + (delivered×1000 ÷ full-load h) × $/kW-th` |
| Operating cost | `HP electricity × 1000 × $/kWh + maintenance (% of capex)` |
| Net savings | `delivered × 1000 × displaced $/kWh-th − operating cost` |
| Simple payback | `capex ÷ net savings`, shown only if net savings > 0 |
| Status | **Not viable**: can't reach the temperature, net ≤ 0, or payback > marginal threshold (20 yrs). **Promising**: payback ≤ 10 yrs. **Marginal**: anything in between |
| Emissions (illustrative) | `delivered × displaced factor − HP electricity × grid factor` |

Distances come from the seeded coordinates via the Haversine formula. The ranking table shows **individual opportunity estimates**, which can't all happen at once. The portfolio panel is the view that respects the shared supply.

### Default-scenario outcome (computed, not hardcoded)

| Candidate | Status | Driver |
|---|---|---|
| Northside Greenhouse | Promising | large low-temperature demand |
| Regional Hospital | Promising | close, high demand, 70 °C |
| Community Aquatic Center | Promising | very close, 40 °C |
| Maple Court Apartments | Marginal | ~12.5 yr payback |
| Grandview Hotel | Marginal | 85 °C means a large lift and low COP |
| Lincoln Middle School | Not viable | small demand vs. connection cost |
| Eastside Industrial Laundry | Not viable | needs 120 °C process heat, above the heat-pump limit |
| Riverside Office Park | Not viable | 2.6 km away with low demand, so savings are negative |

## Demo script (~3 min)

1. **Home**: read the big idea. Then go to **Set up** (Baseline) and point out the heat-flow panel: 10 MW in, 6.3 MW usable.
2. **Find matches**: click **Regional Hospital** (or the #1 greenhouse) and read the verdict and green reasons.
3. Click **Eastside Industrial Laundry**: it's close and large but needs 120 °C. Then **Riverside Office Park**: too far for too little demand.
4. Back on **Set up**, choose **B · Unfavorable** (pipe $3,000/m, power $0.16/kWh). No candidate stays Promising and the hotel and apartments become Not viable.
5. Choose **C · Limited supply** (4 MW) and open **Share heat**. The portfolio runs out of heat, unmet demand appears, and allocation never exceeds supply.
6. Close with the key point: the model counts only heat that is delivered *and used*.

## Not implemented (by design, for the one-day MVP)

These are left out: authentication, backend/database, live OSM/Overpass data, real pipe routing, hourly/seasonal matching, validated heat-pump curves, NPV/financing/taxes/grants, pumping energy, lifecycle emissions, and optimization beyond greedy allocation. See the roadmap in the brief.

## Structure

```
src/
  engine/      types.ts, thermal.ts, economics.ts, matching.ts, engine.test.ts
  data/        demoCustomers.ts   (illustrative customers, defaults, scenario presets)
  pages/       HomePage, SetupPage, MatchesPage, ComparePage, SharePage, ReportPage
  components/  CustomerMap, ResultsCharts, Report (print + CSV), ui (badges, ? tips, nav buttons)
  ai/          Gemini client, grounded context builder, what-if validator (+ tests)
  App.tsx      hash router, shared state, nav, status strip
server/        geminiProxy.ts (Vite middleware; holds the API key)
  styles/      app.css
```
