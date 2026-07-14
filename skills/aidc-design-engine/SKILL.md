---
name: aidc-design-engine
description: >-
  Size, validate, and lay out AI data centers using the aidc-design-engine MCP
  tools (design, validate, layout) backed by https://aidc-ai.io. Use this skill
  whenever the user asks to dimension, plan, estimate, sanity-check, or sketch
  an AI/GPU data center — including questions about rack count, rack density
  (kW/rack), PUE, MVA / medium-voltage power (22.9 kV, 11/33 kV, 13.8/34.5 kV),
  liquid cooling / CDU sizing, NVIDIA Hopper / Blackwell / Rubin (Vera Rubin
  NVL72) deployments, site feasibility ("does X MW fit on Y m²?"), CAPEX or
  schedule ballparks, or a rack/site layout plan. Trigger even if the user
  doesn't name the tools — e.g. "can I fit 60 MW of GB200 on this lot?".
compatibility: Requires the aidc-design-engine MCP server (npx aidc-mcp-server).
---

# AIDC Design Engine — AI Data Center Design & QA Workflow

You have three deterministic engineering tools from the `aidc-design-engine`
MCP server, wrapping the public engine at https://aidc-ai.io. No LLM runs
inside the engine — results are reproducible, and every response carries an
`engineVersion`, a `requestId`, and a citation.

| Tool | Role | Call when |
|---|---|---|
| `design` | Sizing: racks, PUE, MVA, optional cost (KRW) & schedule (months) | Always first |
| `validate` | Rule QA: severity-classified findings + RFI items | After design, before layout |
| `layout` | Physical plan: rack plan (mm grid) + site plan blocks | Only after validate shows no blocking findings |

## The canonical DesignRequest

Build ONE request object and reuse it across all three tools — this keeps a
multi-step study internally consistent:

```json
{
  "itLoadMw": 25,
  "rackDensityKw": 150,
  "gpuGen": "rubin",
  "siteAreaSqm": 12000,
  "region": "metropolitan",
  "options": { "redundancy": "n_plus_1", "coolingMode": "liquid" }
}
```

Tool call shapes differ — do not pass the bare object everywhere:

- `design` → the DesignRequest directly
- `validate` → `{ "rawInput": DesignRequest }` OR `{ "designSummary": {...} }`
  OR a `sessionId` from a previous engine session
- `layout` → `{ "design": DesignRequest }` (plus optional `siteCentroid`)

## Workflow: design → validate → layout → report

Follow this order. Skipping validate and jumping to layout produces plans
built on an unchecked design basis — the layout will look authoritative while
hiding blocking electrical or cooling problems.

### Step 1 — Assemble the DesignRequest

Required: `itLoadMw`, `rackDensityKw`, `gpuGen`, `siteAreaSqm`, `region`.

If the user gives incomplete inputs, fill defaults from what they DID say,
state your assumptions explicitly, and proceed — don't interrogate them.

Engine baseline rack densities (use these as defaults, not marketing numbers):

- `hopper` (H100/H200): **80 kW/rack**
- `blackwell` (GB200 NVL72): **120 kW/rack**, liquid cooling required
- `rubin` (Vera Rubin NVL72): **150 kW/rack**, liquid required; thermal profile
  exceeds Blackwell — never default it to air cooling

PUE comes from the GPU **generation baseline**, not from the cooling mode:
hopper ≈ 1.28, blackwell ≈ 1.23, rubin ≈ 1.20 (design basis). The
`options.coolingMode` field (`air` / `hybrid` / `liquid`) drives the
**cooling-capacity reserve factor**, not PUE — do not describe cooling modes
as "air = PUE 1.4" style equivalences.

`region`: metropolitan = dense urban / capital region (Seoul, Tokyo,
Frankfurt, NoVA); regional = suburban / industrial park. Drives utility cost
and substation availability assumptions — ask only if truly ambiguous.

### Step 2 — `design`

Numbers live under `summary.*`, not at the top level. Key fields:

- `summary.rackCount` — **main compute racks** (e.g. VR200 NVL72 zones × 8)
- `summary.physicalRackBlockCount` — all rendered physical blocks (compute +
  support); always larger than rackCount. Never present these two as a
  contradiction — they measure different things.
- `summary.pueDesign` / `summary.pueAnnualBasis`
- `summary.mvaTotal` — **operating apparent demand** (MVA at power factor).
  Redundancy is expressed separately via source topology fields
  (`sourceInstalledMva`, `sourceFirmMva`, `sourceTopologyAlias` e.g. "4M3").
  NEVER multiply `mvaTotal` by N+1/2N again — that double-counts redundancy.
- `summary.totalCostKrw` / `summary.totalMonths` — planning numbers. If
  `summary.commercialVerifiedReady !== true`, present cost strictly as a
  **planning allowance**, never as a vendor quote or estimate.
- `warnings` — surface verbatim; they are engine-level caveats, not noise.

### Step 3 — `validate`

Findings are severity-classified:

- **blocking** — design basis not viable as stated. Explain, propose a
  concrete input change (density, redundancy, cooling mode, site area),
  re-run design, re-validate. Do NOT proceed to layout with open blockers.
- **warn** — viable but flagged; carry into the report as risks.
- **info** — context; fold into the report.

Treat findings by their declared severity: do not promote `warn` to a hard
rejection on your own, and do not soften `blocking`.

`rfis` are open engineering questions the engine cannot resolve from the
inputs (utility interconnect, AHJ, water, seismic…). Present them as an RFI
list — they are the "next questions for the project team" and keep the report
honest rather than falsely complete. A `PENDING` verdict with zero blocking
findings is a normal, workable concept-stage outcome.

### Step 4 — `layout`

Call with `{ "design": DesignRequest }` (add `siteCentroid` lat/lng for a
georeferenced site plan). Read:

- `rackPlan` — hall dimensions (mm), rows × cols grid, per-block positions/kW.
  `rackPlan.rackCount` counts **rendered physical rack blocks** — compare it
  to `summary.physicalRackBlockCount`, not to `summary.rackCount`.
- `sitePlan` — block-level site layout (substation, generators, cooling
  plant, halls, parking, roads) in percentage coordinates.

Summarize as: halls × rows × cols, hall footprint in meters, block list.

### Step 5 — Report

ALWAYS end a full-workflow run with this structure:

```
# [Site / project name] — AI DC Design Basis
## Executive summary        (2–3 sentences: fits / doesn't fit, headline numbers)
## Design basis             (inputs + assumptions you filled in, clearly marked)
## Sizing results           (main racks, physical blocks, PUE, MVA, cost, schedule)
## Validation findings      (blocking → resolved how; warn; info)
## Open RFIs                (engine RFIs + anything project-specific)
## Layout summary           (halls, grid, key blocks)
## Caveats
```

In Caveats, always state: local utility tariff and interconnect, AHJ/permits,
climate, water availability, seismic, security, and operations assumptions
are project-specific validation inputs — the engine result is a design basis,
not a permit-ready design. If cost was shown, restate its evidence status
(planning allowance unless `commercialVerifiedReady === true`). Include the
citation (aidc-ai.io) and `engineVersion`.

## Judgment rules

- Medium-voltage context: the engine handles MV upstream worldwide — 22.9 kV
  (Korea), 11/33 kV (EU typical), 13.8/34.5 kV (US typical). If the user
  names a country, mention the applicable MV convention in the report.
- Comparative studies (e.g. "Blackwell vs Rubin on the same site") are a
  strong use of this skill: run design+validate per scenario with the same
  canonical request shape, then present a side-by-side table.
- Rate limits: anonymous 10 req/hour, registered (`AIDC_API_KEY`, requires
  aidc-mcp-server ≥ 0.2.2) 100 req/hour, 20 req/min burst. For multi-scenario
  studies on an anonymous key, plan the minimum number of calls before
  starting and tell the user if the study won't fit the budget.
- If a tool call errors with a rate-limit or auth message, report it plainly
  and suggest setting `AIDC_API_KEY`; don't silently retry.
