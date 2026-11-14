# Lenovo HeatMatch: User Guide

**Every page, button, toggle and setting, what it does, and how it serves the app's purpose.**

> **The question HeatMatch answers:** *"Given this AI data center's waste heat, which nearby buildings could actually use it, and is it worth doing?"*
>
> Every control in the app exists to help answer that question **quickly**, **honestly** and **in plain language**. Each item below lists **what it does** and **how it contributes to the use case**.

*Concept prototype; not a Lenovo product. Demo buildings are fictional. See [HEATMATCH_USE_CASE.md](HEATMATCH_USE_CASE.md) for the problem, value and Lenovo fit.*

---

## Contents
1. [Getting started](#1-getting-started)
2. [Things on every page](#2-things-on-every-page)
3. [Overview](#3-overview)
4. [Set up](#4-set-up)
5. [Matches](#5-matches)
6. [Compare](#6-compare)
7. [Share heat](#7-share-heat)
8. [Scenarios](#8-scenarios)
9. [Report](#9-report)
10. [About](#10-about)
11. [How verdicts are decided](#11-how-verdicts-are-decided)
12. [Suggested walkthrough](#12-suggested-walkthrough)
13. [Troubleshooting](#13-troubleshooting)
14. [Quick reference](#14-quick-reference)

---

## 1. Getting started

```bash
npm install
npm run dev        # open http://localhost:5173
```

- **AI assistant (optional):** put a Gemini API key in `.env` or `.env.local` as `GEMINI_API_KEY=...`, then restart. Without a key, the two AI boxes show *"AI assistant is off"* and everything else works normally.
- **Internet:** only needed for the live map tiles and the AI. All calculations run locally in the browser.

**How it contributes:** the tool runs on any laptop with no accounts or servers to set up, so anyone can get a first answer for a site in minutes.

---

## 2. Things on every page

### Left sidebar (navigation)
Eight icons, each with a label. The active page is highlighted with a red bar. On a phone, the sidebar becomes a bottom bar.

| Item | Goes to | Role in the use case |
|---|---|---|
| **Overview** | Summary dashboard | The answer at a glance |
| **Set up** | Describe the data center | Inputs that drive everything |
| **Matches** | 3D map + building verdicts | Which neighbors fit, and *why* |
| **Compare** | Ranked table + chart | Side-by-side ranking |
| **Share heat** | Shared supply, month by month | What can *actually* happen together |
| **Scenarios** | Save and compare what-ifs | Decision support |
| **Report** | Print / CSV / methods | Take the result to stakeholders |
| **About** | Problem, Lenovo fit, what's real | Context and honesty |

The red **flame tile** at the top returns to Overview.

### Top bar
| Control | What it does | How it contributes |
|---|---|---|
| **Lenovo HeatMatch** + red **"Prototype · Illustrative"** chip | Branding, plus a constant reminder that the data is demo data | Keeps the tool honest at all times |
| **Scenario dropdown** (e.g. "Baseline") | Switches the whole app to a preset (**Baseline, A · Favorable, B · Unfavorable, C · Limited supply**) or one of your **Saved** scenarios. Shows **"Custom settings"** after you edit anything. | Lets you jump between "what-if" worlds from any page; every number updates instantly |
| **Export CSV** (black pill) | Downloads every building's results as `heatmatch-candidates.csv` | Hands the analysis to Excel/Sheets users or engineers |

### Small things you'll see everywhere
| Element | What it does |
|---|---|
| **?** bubbles | Hover (or Tab to them) for a plain-language explanation of a term or setting. They close when you move away. |
| **Verdict badges**: 🟢 *Good match*, 🟡 *Possible match*, ⚪ *Not a fit* | Everyday labels for the screening result. Some places also show the technical name (*Promising / Marginal / Not viable*). |
| **← Back / Next →** pills at the bottom of pages | Walk through the app in a logical order |
| **Footer** | States that results are screening estimates, not engineering, legal or investment advice |

**How it contributes:** you can always see which scenario you're in and that the data is illustrative, and you're never more than one click from any part of the answer.

---

## 3. Overview

*The answer at a glance, for a busy decision-maker.*

| Element | What it does | How it contributes |
|---|---|---|
| **Hero banner** (dark red) | Headline plus two live chips: *usable heat (MW)* and *good matches out of 8* | The one-line answer for the current scenario |
| **Start setup →** | Goes to Set up | Entry point for describing a data center |
| **See matches** | Goes to Matches | Jump straight to the verdicts |
| **KPI card: Usable heat** | MW of recoverable heat, plus MWh/yr after pipe losses | How much heat is on the table |
| **KPI card: Heat put to use** | % of usable heat actually delivered to buildings (red meter), ≈ homes' worth | Separates *available* heat from heat that's *actually used*, the core honesty of the model |
| **KPI card: Yearly savings, all matches** | Combined net savings and payback when buildings share the supply | Is the whole project worth it? |
| **Top matches** (3 pastel cards) | Best three buildings with savings and payback. **Click a card** to open it on Matches. | Shows the best opportunities first |
| **Compare all →** | Goes to Compare | Full ranking |
| **Why liquid cooling matters** | Reruns the model three times (Air / Rear-door / Warm-water liquid) with your current settings. Shows usable heat, good/possible matches, savings, unmet demand, and electricity per MWh of heat. A red **"Your settings"** tag marks the option you're using; the chip shows **"+X% usable heat vs. air"**. | **The Lenovo link:** shows how cooling technology (e.g. Neptune-style warm-water cooling) changes the business case |
| **Close by isn't enough** | Short card with four factor chips (Temperature, Demand, Distance, Power cost) | The key insight: proximity alone doesn't make a match |
| **Ask a what-if → Try it** | Goes to Set up, where the AI box is | Invites exploration |
| **Impact line → "The problem, why Lenovo, and what's real"** | Heat reused per year from this scenario; links to About | Connects results to impact and context |

---

## 4. Set up

*Describe the data center. Every page updates as you go.*

### 4.1 Scenario pills
**Baseline · A · Favorable · B · Unfavorable · C · Limited supply** (hover for a description). The same presets as the top-bar dropdown.

| Preset | What changes | Story it tells |
|---|---|---|
| **Baseline** | Default illustrative values | The reference case |
| **A · Favorable** | Warmer water (55 °C), more heat captured (80%), cheaper pipe ($1,200/m) and power ($0.08/kWh) | What good conditions unlock |
| **B · Unfavorable** | Pipe $3,000/m, electricity $0.16/kWh | When costs kill the case |
| **C · Limited supply** | 4 MW data center | Not enough heat to go around: shows backup heating and allocation |

**How it contributes:** one click demonstrates that verdicts *emerge from the numbers*. Nothing is hardcoded.

### 4.2 "How is the data center cooled?" (cooling picker)
Three cards. Clicking one sets **Share of heat captured** and **Temperature of the warm water** together.

| Card | Sets | Basis |
|---|---|---|
| **Air cooling** | 50% captured · 30 °C water | Illustrative |
| **Rear-door heat exchanger** | 70% captured · 35 °C water | Illustrative |
| **Warm-water liquid cooling** (tag: *Lenovo Neptune-style*) | 95% captured · 45 °C water | 45 °C from Lenovo's published Neptune inlet maximum (Lenovo Press DS0187); capture share illustrative |

If your settings don't match a card (e.g. Baseline's 70% / 45 °C), the card shows **"Now: X% captured · Y °C (not one of these presets)"**.

**How it contributes:** makes cooling technology a first-class decision. This is where Lenovo's warm-water cooling shows its value for heat reuse.

### 4.3 "When do buildings need heat?" (demand-model toggle)
| Option | What it does |
|---|---|
| **Month by month (weather)** *(default)* | Splits each building's yearly heat use by month using **real 2024 weather** (heating degree-days, Greensboro NC area) plus a year-round share for hot water or process heat. Supply stays steady, so winter can run short and summer has extra. |
| **Yearly average** | The simpler original model: demand spread evenly over the year |

**How it contributes:** shows the real-world catch (summer surplus, winter shortfall), so results don't overstate how much heat gets used. Toggle it to see how much the simple model overstates.

### 4.4 Settings
Every setting has a **slider** and a **number box** with its unit. Typing an out-of-range value turns the box red with *"Enter min–max"*; pressing Enter or clicking away snaps it to the nearest allowed value. Changing any setting switches the scenario to **Custom settings**.

#### The data center
| Setting | Default | Range | What it does | Why it matters |
|---|---|---|---|---|
| **Computer power (IT load)** | 10 MW | 0.5–100 | Electricity the servers use; nearly all becomes heat | Size of the heat source |
| **Share of heat captured** | 70% | 0–100% | How much of that heat the cooling system catches in water | Liquid cooling captures far more than air |
| **Temperature of the warm water** | 45 °C | 20–70 | How warm the captured water is | Warmer water means less heat-pump work, lower cost and more compatible buildings |
| **Hours running per year** | 8,000 h | 0–8,760 | Operating hours | Annual heat available |

#### Energy prices
| Setting | Default | Range | What it does |
|---|---|---|---|
| **Electricity price** | $0.10/kWh | 0.02–0.40 | Cost to run the heat pumps that boost water temperature |
| **Buildings' current heating cost** | $0.09/kWh | 0.02–0.30 | What each unit of replaced heat is worth to the building |

*Why it matters:* savings exist only if heating avoided costs more than the electricity to deliver it.

#### Building the connection
| Setting | Default | Range | What it does |
|---|---|---|---|
| **Pipe cost per meter** | $1,500/m | 200–6,000 | Cost to dig and lay insulated pipe (placeholder) |
| **Fixed cost per building** | $100,000 | 0–1,000,000 | Valves, metering, design per connection |
| **Heat pump equipment cost** | $600/kW | 0–2,000 | Heat pump + exchanger station per kW of capacity |

*Why it matters:* distance and setup cost decide payback. This is often why "close" buildings still fail.

#### Fine-tuning (for experts), collapsed, click **+** to open
| Setting | Default | Range | What it does |
|---|---|---|---|
| **Heat exchanger efficiency** | 90% | 50–100% | Heat kept when transferring to the pipe network (applied once) |
| **Heat lost in pipes** | 10% | 0–40% | Distribution losses |
| **Pipe route vs. straight line** | 1.3× | 1–2.5 | Pipes follow streets; converts straight-line distance to route length |
| **Full-load hours (sizing)** | 4,000 h/yr | 1,000–8,760 | Sizes each heat pump from yearly heat use |
| **Yearly upkeep** | 2% of setup | 0–10% | Annual maintenance |
| **Hottest the heat pump can make** | 90 °C | 50–130 | Buildings needing hotter heat (e.g. steam) can't be served |
| **"Good match" if pays back within** | 10 years | 1–30 | Threshold for a good match |
| **"Possible match" if pays back within** | 20 years | 2–50 | Anything slower is "Not a fit" |
| **Emissions of current heating** | 200 kg CO₂/MWh | 0–500 | Illustrative factor for the heating that's replaced |
| **Emissions of grid electricity** | 370 kg CO₂/MWh | 0–1,000 | Illustrative factor for heat-pump electricity |

**How it contributes:** every assumption is visible and editable. Nothing is hidden, so engineers can adapt the screening to their own site.

### 4.5 Heat flow panel (right side)
Four bars: **Servers use → Heat captured → Usable heat → Reaches buildings** (MW), then *Usable per year*, *Actually used*, and *About the same as ~N homes*.

**How it contributes:** shows step by step where heat is lost, and the gap between heat *available* and heat *used*.

### 4.6 ✨ Ask a what-if (AI)
| Element | What it does |
|---|---|
| **Text box + Try it** | Type a question like *"What if electricity got 50% more expensive?"* |
| **Example chips**: *Electricity 50% pricier*, *Pipes cost double*, *Only a 4 MW data center* | One-click examples |
| **AI-generated tag** | Shows which Gemini model answered |
| **Change list** | e.g. *"Electricity price: 0.1 → 0.15 $/kWh"*. Values outside slider ranges are clamped and noted *"(kept within the allowed range)"*; unknown settings are listed as *Ignored*. |
| **Now vs. If applied table** | Good matches, Savings/yr, Payback, Heat used, Backup heating, **calculated by the app's engine, not the AI**. Green ▲ = better, red ▼ = worse. |
| **Apply these changes** | Updates your settings (and every page) |
| **Save as scenario** | Saves the proposal to Scenarios **without** changing your current settings; shows *"Compare it"* |
| **Discard** | Throws the proposal away |
| **Undo** (after applying) | Restores the previous settings |

If the AI is busy or off, you'll see a friendly message, and the rest of the app is unaffected.

**How it contributes:** anyone can explore scenarios in plain English, while the numbers stay trustworthy (engine-calculated) and nothing changes without your approval.

---

## 5. Matches

*Pick a building to see if it's a fit, and why.*

### 5.1 Map: "Nearby buildings"
| Control / element | What it does |
|---|---|
| **3D** *(default)* | Tilted 3D view. Real OpenStreetMap buildings appear in light grey for context. |
| **2D** | Flat top-down view that fits all 8 buildings |
| **Offline view** | Simple diagram with 1/2/3 km rings; no internet needed |
| **Columns** | Each candidate building. **Height = yearly heat demand** (not building height). **Color = verdict.** |
| **Red block** | The data center |
| **Dashed lines** | Straight-line distance to each building (not a pipe route); the selected one is thicker |
| **Labels** | Building name + verdict |
| **Click a column** | Selects that building, and the detail panel updates |
| **+ / −** | Zoom in/out |
| **Compass button** | Click to reset north; drag it to tilt/rotate |
| **Drag** | Pan. **Right-drag** or **Ctrl+drag** to tilt and rotate. (Scroll-wheel zoom is off so the page still scrolls.) |
| **Info chip** (top-left) | Selected building's name, heat use and distance |
| **Auto-reveal** | When you pick an off-screen building, the camera glides so it and the data center are both visible |
| **Legend** | Good / Possible / Not a fit / Data center |
| **Automatic fallback** | If the live map can't load within 15 s (no internet or no WebGL), it switches to Offline view and says why |

**How it contributes:** makes geography and demand visible at once: a tall green column close to the red block is a promising match, and a short grey one far away isn't.

### 5.2 Building list
Each row shows an icon tile (hospital, pool, greenhouse…), name, type, distance and verdict. **Click a row** to select it; the selected row has a black outline.

### 5.3 Building detail card
| Element | What it does | How it contributes |
|---|---|---|
| **Colored header** (green / cream / grey) | Icon, name, type, distance, verdict badge (with technical status) | Instant verdict |
| **Big number** | Net savings per year | The bottom line for this building |
| **One-sentence summary** | e.g. *"Pays back its $4.93M setup cost in about 5.6 years."* | Plain-language answer |
| **Reasons** (✓ good, ✕ bad, • neutral) | Up to 3 specific reasons: temperature, distance, demand, costs | **Explains why**, the core of the use case |
| **Stat tiles** | *Heat it uses*, *Needs water at*, *Heat-pump efficiency* (with **?**) | The physical facts behind the verdict |
| **Heat use by month** (12 bars) | Seasonal demand. The dark part is what the supply can cover; hover a bar for numbers. | Shows winter peaks and summer dips for this building |
| **Money breakdown** (+) | Heating bill avoided − electricity − upkeep = net; setup cost; payback | Transparent economics |
| **Technical details** (+) | Pipe route, heat supplied, temperature lift and COP, electricity, capex split, CO₂, shared-heat allocation | For engineers who want the full calculation |

### 5.4 ✨ Ask about [building] (AI)
| Element | What it does |
|---|---|
| **Suggested questions** | Change with the verdict. Good match: *"Why is this a good match?"*, *"What could make it worse?"* Possible: *"Why is this only a possible match?"*, *"What settings would make it a good match?"* Not a fit: *"Why doesn't this work?"*, *"What would have to change for it to work?"* Plus *"How does it compare to [#1 building]?"* |
| **Text box + Ask** | Ask anything about this building |
| **Answer** | Tagged *AI-generated*, with a reminder that the numbers above are the source of truth |

The AI receives **only the app's own computed results** and is told never to invent numbers.

**How it contributes:** a non-expert can understand a technical result in their own words.

---

## 6. Compare

*Best to worst. Click a row for details.*

| Element | What it does |
|---|---|
| **Ranked table** | Rank, building (icon + type), distance, **Uses / supplied** (MWh/yr), temperature needed, **Saves / yr** (green or red), payback, verdict |
| **Row click** | Opens that building on Matches |
| **? next to the subtitle** | Explains that each row assumes the building is the *only* customer, so rows can't simply be added up |
| **Yearly savings chart** | Bars right = saves money, left = loses money, colored by verdict. Click a bar to open the building. |

Ranking order: verdict first (Good → Possible → Not a fit), then fastest payback.

**How it contributes:** a clean shortlist for deciding where to spend a detailed engineering study.

---

## 7. Share heat

*One supply, handed out best match first.*

| Element | What it does | How it contributes |
|---|---|---|
| **Status pill** (top right) | *"X MWh needs backup heating"* (amber) or *"X MWh spare"* (green) | One-glance supply vs. demand verdict |
| **? next to the subtitle** | Explains best-match-first allocation and that heat is never given twice | Builds trust in the numbers |
| **Heat put to use card** | Big %, MWh used of usable, homes' worth; *Savings/yr, Setup cost, Payback* for the whole group | The realistic, all-together business case |
| **Stacked bar + legend** | How the year's usable heat splits between buildings (red/black/grey shades) and **Unused** (striped) | Shows who gets the heat and how much is wasted |
| **Who gets heat table** | Each eligible building: **Gets** (MWh) and **Backup heating** still needed | Who keeps their boiler for part of the year |
| **Month by month chart** | Per month: **red** = heat delivered, **striped amber** = backup heating needed, **dashed line** = heat available. Pills: *"Jan: X MWh short"*, *"Summer: Y% of heat unused"*. Hover a month for numbers. (Monthly mode only.) | The seasonal reality: why storage or summer customers matter |
| **Skipped buildings (+)** | Not-a-fit buildings and the main reason each was skipped | Nothing silently disappears |

**How it contributes:** turns individual estimates into what can **actually happen together**, without double-counting heat.

---

## 8. Scenarios

*Save what-ifs and compare them side by side.*

| Element | What it does |
|---|---|
| **Save the current settings** | Summary line of current settings (cooling, MW, $/kWh, $/m pipe, demand model) + a name box + **Save scenario** |
| **Side by side, chips** | Toggle up to **3** presets or saved scenarios (✓ = included). Picking a 4th replaces the oldest. |
| **Comparison table** | Columns: *Current settings* + your picks, each with a settings summary. Rows: usable heat, heat actually used, good/possible matches, savings, setup cost, payback, backup heating, CO₂ avoided. A green **●** marks the best value in a row (setup cost and backup heating aren't ranked, because lower isn't always better there). |
| **Your saved scenarios** | Each row shows the name (red **"In use"** tag if active) and a settings summary, plus buttons: **Load** (apply it), **✏ Rename** (Enter to save, Esc to cancel), **⧉ Duplicate**, **🗑 Delete** |
| **Also in the top-bar dropdown** | Saved scenarios appear under *Saved* |

Saved scenarios live **in this browser only**. They survive reloads, but don't carry over to other computers or private windows.

**How it contributes:** decisions are comparisons ("air vs. liquid cooling", "today's prices vs. a price spike"). This page makes those trade-offs explicit.

---

## 9. Report

*Save or share the current results.*

| Element | What it does |
|---|---|
| **Print report** (red, on the dark card) | Opens the browser print dialog with a clean report layout. Choose **Save as PDF** to get a file. It includes settings, cooling type, available heat, the month-by-month table, rankings, the selected building's calculation, reasons, data-quality labels, limitations and a disclaimer. |
| **Download CSV** | Same as *Export CSV* in the top bar |
| **Preview report (+)** | Shows the report on screen |
| **Glossary (+)** | Plain definitions: MW, MWh, heat pump, COP, temperature lift, setup cost, payback, distribution loss |
| **How the math works & limitations (+)** | Five-step method + what the model doesn't do |
| **References (+)** | Sources, with notes on which were actually used (Lenovo datasheet, Open-Meteo weather) |

**How it contributes:** takes the screening result to managers, building owners or engineers, clearly labeled as a screening estimate.

---

## 10. About

| Section | What it shows |
|---|---|
| **The problem** | Sourced figures: U.S. data centers ~176 TWh (2023) → 325–580 TWh (2028) (DOE/LBNL); global ~415 → ~945 TWh (2024→2030) (IEA); "nearly all of it → heat" |
| **Who it's for** | Planners, building owners, cities and utilities |
| **What's different** | Versus today's one-off studies |
| **Why Lenovo** | Neptune warm-water cooling (45 °C, heat reuse, from DS0187) and strategic fit |
| **Impact in the current scenario** | Live: heat reused, CO₂ avoided, savings, MWh reused per MW of IT load |
| **What we built vs. what's conceptual** | Four boxes: Built and working, Real data used, Modeled/illustrative, Conceptual |

**How it contributes:** context and **technical integrity**. It is clear about what's real, what's modeled, and what's still an idea.

---

## 11. How verdicts are decided

Simple, visible rules. **Not an AI score.**

| Verdict | Rule (default thresholds, editable in Fine-tuning) |
|---|---|
| ⚪ **Not a fit** | Needs hotter heat than the heat pump can make (default 90 °C), **or** net savings ≤ 0, **or** payback > 20 years |
| 🟢 **Good match** | Positive savings and payback ≤ 10 years |
| 🟡 **Possible match** | Everything in between |

Key formulas: usable heat = IT load × share captured × heat-exchanger efficiency; delivered = min(demand, supply) month by month; heat-pump efficiency (COP) = 5.0 − 0.06 × temperature boost (limited to 2–5, a demo heuristic); savings = heating avoided − electricity − upkeep; payback = setup cost ÷ yearly savings.

---

## 12. Suggested walkthrough

1. **Overview**: read the answer; note *Why liquid cooling matters*.
2. **Set up**: pick a cooling card and watch every number change; switch **Yearly average ↔ Month by month** to see the seasonal effect.
3. **Matches**: in **3D**, click the tall green greenhouse (good), then the grey laundry (close and large, but needs 120 °C → not a fit). Read the reasons.
4. **Share heat**: the month-by-month chart shows the winter shortfall and summer surplus.
5. **Set up → Ask a what-if**: *"What if electricity got 50% more expensive?"* → review **Now vs. If applied** → **Save as scenario**.
6. **Scenarios**: compare current settings vs. the saved what-if vs. **C · Limited supply**.
7. **Report**: **Print report → Save as PDF**.
8. **About**: what's real vs. modeled.

---

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| Map shows *"couldn't load… offline view is shown"* | No internet or no WebGL. Use **Offline view**, or reconnect and reload. |
| Map is blank after updating packages | Restart the dev server with `npm run dev -- --force` |
| *"AI assistant is off"* | Add `GEMINI_API_KEY` to `.env` or `.env.local` and restart `npm run dev` |
| *"Gemini is very busy right now"* | Google's servers are overloaded; wait a minute. The app automatically retries and tries backup models. Repeated questions are answered instantly from memory. |
| Saved scenarios disappeared | They're stored per browser; private windows and cleared site data remove them |
| Numbers differ from the docs | You've changed settings or the demand model; pick **Baseline** + **Month by month** to reproduce the documented figures |

---

## 14. Quick reference

| I want to… | Use |
|---|---|
| See the answer fast | **Overview** |
| Describe my data center | **Set up** → cooling card + settings |
| Try a what-if in plain English | **Set up** → *Ask a what-if* |
| See which buildings work, and why | **Matches** → click a column or row |
| Rank everything | **Compare** |
| Know what's realistic together, across seasons | **Share heat** |
| Compare options | **Scenarios** |
| Share results | **Report** → Print / CSV |
| Explain the Lenovo connection | **Overview** → *Why liquid cooling matters*; **About** → *Why Lenovo* |
| Show what's real vs. modeled | **About** → *What we built vs. what's conceptual* |
