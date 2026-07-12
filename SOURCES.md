# Rapidual — Sustainability Figures: Sources & Assumptions

The Environmental & Cost Savings engine (`packages/utils`, `SAVINGS_PER_BAG`)
derives every displayed number from the inputs below. **Cited** inputs have a
public source; **assumptions** are ours and should be validated (or replaced
with measured facility data) before being used in public marketing claims.

## Cited inputs
| Input | Value | Source |
|---|---|---|
| Water per home washer load (standard machine) | 20 gal (14 for ENERGY STAR) | ENERGY STAR, "Clothes Washers" — energystar.gov/products/clothes_washers |
| Home washer electricity per cycle | ~0.5–1 kWh (we use 0.7) | DOE/industry analyses of current models |
| Electric dryer electricity per cycle | ~2.5–3 kWh (we use 2.8) | DOE/industry analyses; dryers are 75–85% of laundry energy |
| Grid carbon intensity (US average) | ~0.81 lb CO₂ / kWh (2023) | US EIA, FAQ "How much CO₂ is produced per kWh?" — eia.gov |
| Residential electricity price (US average) | ~$0.16 / kWh | EIA via EPA Household Carbon Footprint Calculator assumptions |

## Assumptions (ours — validate before public claims)
| Assumption | Value | Rationale |
|---|---|---|
| Home loads per Rapidual bag | 1.5 | 12 lb standard bag ≈ 1.5 machine loads (Business Plan v4 §07) |
| Net water avoided vs home | 75% of home usage | ≈15 gal/load net — commercial tunnel washers + closed-loop reclamation (Plan §10); replace with measured facility data |
| Net energy avoided vs home | 57% of home usage | ≈2.0 kWh/load net (Plan §10: 3.5 home → 1.0–1.5 commercial); replace with measured data |
| Active time per bag | 38 min | ~25 active min per load × 1.5 loads (Plan §07) |
| Water value | $0.015 / gal | Approx. combined US water+sewer retail; varies widely by utility |
| CO₂ value | $0.05 / lb | Nominal internal carbon value (≈$110/ton) |
| Time value | $0.176 / min (~$10.6/hr) | Conservative fraction of median US wage |

## What this means in-app
Per bag, the app currently credits ~23 gal water, ~3.0 kWh, ~2.4 lb CO₂, and
38 minutes — consistent with Business Plan v4 §10's per-load figures (15 gal, 2.0 kWh). The "Total Cost Savings / Real Order Price" reframe additionally
caps applied savings so a token real price (`REAL_PRICE_FLOOR`) stays visible —
that cap is a **marketing presentation choice** (`CAP_REAL_PRICE` flag), not a
physical claim, and the checkout CTA always shows the true charge.

## Before launch
1. Replace the two facility-efficiency assumptions with measured water/energy
   per pound from your actual wash facility.
2. Localize the grid-carbon factor by eGRID subregion (EPA Power Profiler) —
   California's grid is ~4× cleaner than the US average.
3. Have marketing/legal review any customer-facing dollar-equivalence claims.
