# Lenovo HeatMatch: Use Case, Value, and Why Lenovo

> **Every AI data center already makes the heat. HeatMatch finds who can use it, and whether it pays off.**

*HeatMatch is a hackathon concept prototype built for the NC A&T × Lenovo challenge. It is not an existing Lenovo product and does not imply Lenovo endorsement. Building data in the demo is fictional. Every figure below is labeled as **sourced**, **modeled** (computed by the app), or **illustrative**.*

---

## TL;DR

- **The problem:** AI data centers turn almost all of their electricity into heat, and most of that heat is thrown away. Meanwhile, hospitals, pools, greenhouses and apartments nearby pay to make heat. Whether a given neighbor could use the waste heat, *and whether it would pay off*, is hard and slow to answer today.
- **What we built:** **HeatMatch**, a working planning tool. It screens nearby buildings in minutes and explains in plain language which ones are a good match, which aren't, and why. It accounts for temperature, demand, distance, seasons, cooling technology and cost.
- **Why Lenovo:** heat reuse depends on capturing heat in **warm water**. Lenovo's Neptune warm-water liquid cooling runs with inlet water up to **45 °C** and is designed so the heat can be reused for building heating (sourced: Lenovo Press DS0187). In our model, the same site with warm-water liquid cooling delivers **~53% more yearly savings** than with air cooling and needs **~84% less winter backup heating** (modeled). Lenovo already sits at the moment customers choose their cooling, which is exactly when heat reuse has to be planned.

---

## 1. Real problem: what problem is worth solving?

### The heat is enormous, and growing fast

| Fact | Source |
|---|---|
| U.S. data centers used **~176 TWh** of electricity in 2023, about **4.4%** of U.S. electricity. | U.S. DOE / Lawrence Berkeley National Laboratory, 2024 report *(sourced)* |
| U.S. data-center use is projected to reach **325–580 TWh by 2028**. | DOE / LBNL *(sourced)* |
| Global data-center electricity was **~415 TWh in 2024**, projected to reach **~945 TWh by 2030**. | IEA, *Energy and AI* *(sourced)* |
| Nearly every watt a server uses ends up as **heat**, which cooling systems reject to the outdoors. | Basic physics |

Put simply, data centers are becoming some of the largest heat sources in many communities, and the heat is mostly wasted.

### The waste sits right next to demand
Buildings near data centers (hospitals, indoor pools, greenhouses, apartment complexes, hotels, schools) burn fuel or buy energy to heat water and space. Connecting the two is called **waste-heat reuse**, often through a small heat network.

### Why it doesn't happen more often
**Being close isn't enough.** Whether a match works depends on several factors at once:

| Factor | Why it matters |
|---|---|
| **Temperature** | Data-center water is warm, not hot. Buildings that need hotter water need a heat pump to boost it, and heat pumps use electricity. Some needs (e.g. 120 °C process steam) can't be met at all. |
| **Demand** | Small users can't justify the fixed cost of connecting. |
| **Distance** | Pipe is expensive per meter, and long runs can wipe out the savings. |
| **Seasons** | The data center makes heat year-round, but buildings mostly need it in winter. |
| **Energy prices** | Heat-pump electricity has to cost less than the heating it replaces. |
| **Cooling technology** | Air-cooled servers give off lukewarm air that is hard to capture. Liquid-cooled servers give off warm water that is easy to reuse. |

Answering this today typically takes a **site-specific engineering study**. Studies take time and money, so most sites are never evaluated, and the heat-reuse decision often comes *after* the cooling and site design are locked in.

### Regulators are starting to require it
Europe is already moving from "nice to have" to "required". Under Germany's Energy Efficiency Act (EnEfG), new data centers commissioned from 2026 must reuse a minimum share of their waste heat, rising to 20% for later commissioning dates (*sourced*; legal summaries differ on exact shares and thresholds). Operators who build in, or sell into, these markets need a fast way to find reuse partners.

**Conclusion:** the need is real, large, growing, and increasingly mandatory. What's missing is a fast, honest first answer.

---

## 2. Who experiences the problem, and why does it matter?

| Who | Their problem | Why it matters |
|---|---|---|
| **Data-center planners and operators** | Must remove all the heat, pay to reject it, and face sustainability targets and (in some markets) reuse rules. No quick way to know if reuse is viable at a site. | Wasted heat is a missed source of revenue and community goodwill, and in some markets a compliance risk. |
| **Sustainability and ESG leads** | Need credible numbers on heat reused and emissions avoided, not vague claims. | Their reports have to stand up to investors and regulators. |
| **Nearby building owners** (hospitals, pools, greenhouses, housing) | High, volatile heating bills and their own emissions goals. | Lower-cost, lower-carbon heat goes straight to their budgets and tenants. |
| **Cities, utilities and planners** | AI growth brings grid load and public pushback. | Heat reuse turns a data center from a pure energy consumer into a local energy *supplier*, a tangible community benefit. |

---

## 3. What would we build? (What we built)

**HeatMatch** is a working web app: a screening and planning tool for waste-heat reuse.

### The user journey
1. **Describe the data center.** IT load, cooling technology (air, rear-door heat exchanger, or warm-water liquid / Neptune-style), water temperature, energy prices, pipe costs. Or pick a ready-made scenario.
2. **See which neighbors fit.** A **3D map** shows the data center as a red block and each nearby building as a column. Column height is how much heat the building uses, and color is the verdict: **Good match**, **Possible match** or **Not a fit**.
3. **Understand why.** Each building gets a one-line verdict plus plain-language reasons, for example:
   - *"Pays back its setup cost in about 6.1 years, within the 10-year target."* (Regional Hospital)
   - *"It needs 120 °C heat. The modeled heat pump tops out at 90 °C, so it can't supply this building."* (Eastside Industrial Laundry)
   - *"It's far away (about 3.4 km of pipe): the pipe alone is 95% of the setup cost."* (Riverside Office Park)
4. **See the seasons.** A month-by-month chart compares the steady data-center supply with weather-driven demand. It shows the winter shortfall (backup heating needed) and the summer surplus.
5. **Share the heat fairly.** One supply is allocated best-match-first, month by month, and heat is never counted twice.
6. **Ask what-ifs in plain English.** "What if electricity got 50% more expensive?" The AI assistant (Gemini) proposes the setting changes, and **the calculation engine** computes the before/after. You approve, discard, or save it as a scenario.
7. **Compare scenarios side by side**, then **print a report** or export a CSV.

### Example results (modeled, illustrative demo site: 10 MW AI data center, Greensboro NC area)

| Result | Value |
|---|---|
| Usable heat | **6.3 MW** |
| Heat actually used by matched buildings | **25,905 MWh/year** (57% of usable heat; roughly 2,160 homes' worth at ~12 MWh/home) |
| Net savings | **~$1.48M/year** on ~$11.8M setup, about a **7.9-year** payback |
| CO₂ avoided | **~2,920 t/year** (illustrative emission factors) |
| Verdicts | 3 good matches (greenhouse, hospital, aquatic center), 2 possible (apartments, hotel), 3 not a fit (school: too little demand for the cost; industrial laundry: needs 120 °C; office park: too far) |
| Seasons | January is **2,243 MWh short**; **79% of summer heat** goes unused |

### How it works (in one breath)
Usable heat = IT load × share captured × heat-exchanger efficiency × hours, minus pipe losses. Each building's yearly heat use is split by month using **real 2024 weather** (heating degree-days). Heat-pump electricity = heat delivered ÷ efficiency, which drops as the temperature boost grows. Savings = heating bill avoided − electricity − upkeep. Verdicts follow simple, visible payback rules, **not an opaque AI score**. The engine has **24 automated tests**.

---

## 4. Why is Lenovo uniquely positioned to make it possible?

### 4.1 Heat reuse starts with how servers are cooled, and Lenovo makes that cooling
The single biggest factor in whether data-center heat is reusable is **what form the heat leaves the server in**:

- **Air cooling:** heat ends up in large volumes of lukewarm air, which is hard and expensive to capture.
- **Warm-water liquid cooling:** heat goes straight into water at a useful temperature, ready for a heat exchanger.

Lenovo's **Neptune** direct water cooling is built for this. From Lenovo's own ThinkSystem N1380 Neptune datasheet *(sourced, Lenovo Press DS0187)*:
- operates at water inlet temperatures **"up to 45°C"**;
- **"allows for efficient reuse of the generated heat energy in building heating or adsorption cold water generation"**;
- **"a reduction in typical data center power consumption by up to 40% compared to similar air-cooled systems."**

### 4.2 Our model shows the difference
Same 10 MW site, same neighbors, same weather. Only the cooling changes *(modeled; liquid-cooling water temperature from DS0187, other cooling values illustrative)*:

| | Air cooling | Rear-door heat exchanger | **Warm-water liquid (Neptune-style)** |
|---|---|---|---|
| Usable heat | 4.5 MW | 6.3 MW | **8.55 MW** |
| Net savings / year | $1.13M | $1.40M | **$1.72M** (+53% vs air) |
| Winter backup heating needed | 8,432 MWh | 4,308 MWh | **1,382 MWh** (−84% vs air) |
| CO₂ avoided / year | 2,163 t | 2,661 t | **3,329 t** |
| Electricity per MWh of heat delivered | 259 kWh | 252 kWh | **239 kWh** |

**Warmer water means less boosting, and more captured heat means more neighbors served.** Liquid cooling doesn't just cool chips more efficiently; it turns waste heat into a usable product.

### 4.3 Lenovo is in the room at the decision moment
Heat reuse has to be planned **when the cooling and site are chosen**, not retrofitted afterwards. That is exactly when a customer is talking to their infrastructure vendor. As a supplier of data-center servers and liquid-cooling systems, Lenovo could put a screening tool like HeatMatch in front of customers at that moment. The conversation shifts from "here's a cooler server" to "here's what your heat could be worth to your neighbors".

### 4.4 Lenovo can connect the pieces
Making heat reuse real takes hardware (warm-water-cooled servers), data (site and building information), software (screening and planning), and partners (district-heating firms, utilities, engineers). A global technology company with infrastructure, services and customer reach is well placed to bring those together. HeatMatch would be the front door: a fast first answer that tells customers which opportunities are worth a detailed study.

*All of section 4.3–4.4 is framed as strategic fit. It is a proposal, not a description of any existing Lenovo offering.*

---

## 5. Human and business value: who benefits and how?

| Beneficiary | Value |
|---|---|
| **Data-center operators** | New value from a waste stream; a stronger sustainability story; faster answers on reuse obligations; better community relations when siting new AI capacity. |
| **Building owners** (hospitals, pools, greenhouses, housing) | Lower and more stable heating costs (e.g. ~$490k/year modeled for the demo hospital); lower emissions; less exposure to fuel-price spikes. |
| **Communities and residents** | Lower-carbon local heat; a visible local benefit from data-center growth; potential for affordable heat in housing. |
| **Cities and utilities** | A planning tool to pair new data centers with heat demand; less fuel burned for heating. |
| **Lenovo** | Differentiates liquid-cooled infrastructure with a concrete, site-specific business case; deepens customer relationships; supports Lenovo's and its customers' sustainability goals; opens a services opportunity (screening → engineering partners). |
| **Engineers and consultants** | Better-qualified leads: detailed studies go to the sites most likely to work. |

---

## 6. Innovation: what's different from today's approach?

| Today (typical) | HeatMatch |
|---|---|
| One-off engineering study per site; weeks of effort and cost | Screens many buildings in **minutes**, so every site can get a first answer |
| Done after cooling and site decisions are locked in | Used **at the design stage**, when cooling choice can still change the outcome |
| Rules of thumb ("it's close, it'll work") | Explains **why** each building passes or fails (temperature, distance, demand, cost) |
| Annual averages that hide seasonal mismatch | **Month-by-month** supply vs. demand from real weather data; shows winter shortfall and summer surplus |
| Cooling technology treated as a given | **Compares cooling technologies** side by side for heat-reuse value |
| Opaque scores, or AI that guesses numbers | Transparent rules. **AI explains and proposes, but a tested engine calculates**, and changes need user approval |
| Static reports | Interactive what-ifs, saved scenarios, side-by-side comparison, printable report |

---

## 7. Impact: could this scale, and create meaningful value?

### Economic, environmental and societal value per site *(modeled, illustrative demo site)*
- **~25,900 MWh/year** of heat put to use from a 10 MW site, about **2,590 MWh per MW of IT load**
- **~$1.5M/year** net savings across matched buildings
- **~2,900 t CO₂/year** avoided (illustrative factors), or **~3,300 t** with warm-water liquid cooling

### Scale of the opportunity
- Data-center electricity is projected to roughly **double globally by 2030** (IEA) and to grow **~2–3×** in the U.S. by 2028 (DOE/LBNL). Nearly all of it becomes heat.
- *Illustration only:* every **1%** of 2023 U.S. data-center electricity reused as heat would be about **1.76 TWh**, roughly **147,000 homes'** worth of heat at ~12 MWh/home. HeatMatch's job is to find out, site by site, how much of that is actually reachable.

### Why it scales technically
- The engine is a **tested, pure calculation**: inputs in, results out, in milliseconds. Running 1 site or 1,000 sites is the same code.
- The data needed at scale is **public or standard**: map and GIS data, building-energy surveys, weather archives, grid-emissions data, and operator telemetry.
- The AI layer **explains and orchestrates**; it never does the math, so more AI use doesn't make results less reliable.

### Roadmap *(planned, not built; see `docs/ROADMAP_AND_SCALABILITY.txt`)*
1. **Pilot (0–3 months):** one real site; real buildings from OpenStreetMap/GIS; demand from building-energy intensities, calibrated with utility bills; multi-year weather.
2. **Engineering-grade (3–9 months):** shared pipe networks, hourly matching and heat storage, validated heat-pump curves, full project finance (NPV, incentives), regional emissions data, team collaboration.
3. **Platform (9–24 months):** portfolio-scale site selection *before* land is bought, live telemetry after construction, multi-region rules, partner APIs.

---

## 8. Technical integrity: what's real, modeled, or conceptual

| Category | Items |
|---|---|
| **Built and working** | Calculation engine (24 tests); ranking with plain-language reasons; 3D/2D map with an offline fallback; month-by-month supply/demand; shared-heat allocation without double counting; cooling comparison; scenario save/compare; Gemini AI what-ifs (engine-computed before/after) and grounded Q&A; printable report and CSV export. |
| **Real data used** | 2024 daily temperatures for the Greensboro, NC area (Open-Meteo / ERA5 → monthly heating degree-days); Neptune 45 °C water inlet (Lenovo Press DS0187); OpenStreetMap map and 3D building data. |
| **Modeled / illustrative** | The 8 buildings (names, locations, heat demand, temperatures); pipe, equipment and maintenance costs; energy prices; heat-pump efficiency heuristic; heat-capture shares; year-round demand shares; emissions factors. |
| **Conceptual (not built yet)** | Automatic discovery of real buildings and use of utility data; engineered pipe routes and shared networks; hourly matching and storage; live telemetry; full project finance. |

---

## Sources

- U.S. DOE / Lawrence Berkeley National Laboratory: *2024 Report on U.S. Data Center Energy Use*: https://www.energy.gov/articles/doe-releases-new-report-evaluating-increase-electricity-demand-data-centers
- International Energy Agency: *Energy and AI* (2025), executive summary: https://www.iea.org/reports/energy-and-ai/executive-summary
- Lenovo Press DS0187: *ThinkSystem N1380 Neptune Chassis Datasheet*: https://lenovopress.lenovo.com/ds0187
- Open-Meteo Historical Weather API (ERA5): https://open-meteo.com/en/docs/historical-weather-api
- Germany Energy Efficiency Act (EnEfG), data-center waste-heat requirements (legal summaries): https://www.twobirds.com/en/insights/2024/germany/rechenzentren-und-abwaerme-ein-ueberblick-ueber-die-gesetzlichen-vorgaben-zur-abwaermenutzung · https://www.whitecase.com/insight-alert/data-center-requirements-under-new-german-energy-efficiency-act

*Modeled figures come from the HeatMatch app's baseline scenario (10 MW, monthly demand model) and the cooling comparison on its Overview page. Rerun the app to refresh them if any settings change.*
