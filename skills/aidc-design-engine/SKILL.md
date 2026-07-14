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
MCP server. They wrap the public engine at https://aidc-ai.io. No LLM runs
inside the engine — results are reproducible, and every response includes an
`engineVersion` and a citation.

| Tool | Role | Call when |
|---|---|---|
| `design` | Sizing: rack count, design PUE, total MVA, optional cost (KRW) & schedule (months) | Always first |
| `validate` | Rule QA: electrical / cooling / layout / safety / data findings + RFI items | After design, before layout |
| `layout` | Physical plan: rack plan (mm grid) + site plan (% blocks) | Only after validate shows no blocking findings |

## Workflow: design → validate → layout → report

Follow this order. Skipping validate and jumping to layout produces plans
built on an unchecked design basis — the layout will look authoritative while
hiding blocking electrical or cooling problems.

### Step 1 — Assemble the OPR inputs

Required: `itLoadMw`, `rackDensityKw`, `gpuGen`, `siteAreaSqm`, `region`.

If the user gives incomplete inputs, fill sensible defaults from what they DID
say, state your assumptions explicitly, and proceed — don't interrogate them.
Typical pairings to draw defaults from:

- `hopper` (H100/H200): 20–44 kW/rack, air or hybrid cooling
- `blackwell` (GB200 NVL72): ~120–132 kW/rack, liquid (L2C/L2L) required
- `rubin` (Vera Rubin NVL72): ~130+ kW/rack, liquid required; thermal profile
  exceeds Blackwell — never default it to air cooling
- `region`: metropolitan = dense urban / capital region (Seoul, Tokyo,
  Frankfurt, NoVA); regional = suburban / industrial park. This drives utility
  cost and substation availability assumptions, so ask only if truly ambiguous.
- `options`: redundancy (`n` / `n_plus_1` / `2n`), coolingMode (`air` ~1.4 PUE,
  `hybrid` ~1.2, `liquid` ~1.05–1.08), pueTarget (1.0–2.5).

### Step 2 — `design`

Call `design` with the assembled inputs. Returns
`{ rackCount, pueDesign, mvaTotal, totalCostKrw?, totalMonths?, coolingLoadMw?, hallCount?, warnings, engineVersion }`.
Surface `warnings` to the user verbatim — they are engine-level caveats, not
noise.

### Step 3 — `validate`

Pass either the `designSummary` you just received or the `rawInput`.
Findings come back severity-classified:

- **blocking** — the design basis is not viable as stated. Explain the finding,
  propose a concrete input change (lower density, add redundancy, switch
  cooling mode, larger site), re-run design, and re-validate. Do NOT proceed
  to layout with open blocking findings.
- **warn** — viable but flagged. Carry these into the final report as risks.
- **info** — context. Mention briefly or fold into the report.

`rfis` are open engineering questions the engine cannot resolve from the given
inputs (utility interconnect, AHJ, water, seismic…). Present them as an RFI
list — they are the natural "next questions for the project team" and make the
report actionable rather than falsely complete.

### Step 4 — `layout`

Call `layout` with the same design fields (plus optional `siteCentroid` lat/lng
for a georeferenced site plan). Returns a rack plan (hall dimensions in mm,
row/column grid, per-rack kW positions) and a site plan (block-level layout in
percentage coordinates). Summarize as: halls × rows × cols, hall footprint in
meters, and the block list (substation, generators, cooling plant, halls,
parking, roads).

### Step 5 — Report

ALWAYS end a full-workflow run with this structure:

```
# [Site / project name] — AI DC Design Basis
## Executive summary        (2–3 sentences: fits / doesn't fit, headline numbers)
## Design basis             (inputs + assumptions you filled in, clearly marked)
## Sizing results           (rackCount, PUE, MVA, cost, schedule — table)
## Validation findings      (blocking → resolved how; warn; info)
## Open RFIs                (engine RFIs + anything project-specific)
## Layout summary           (halls, grid, key blocks)
## Caveats
```

In Caveats, always state: local utility tariff and interconnect, AHJ/permits,
climate, water availability, seismic, security, and operations assumptions are
project-specific validation inputs — the engine result is a design basis, not
a permit-ready design. Include the engine citation (aidc-ai.io) and
`engineVersion`.

## Judgment rules

- Treat engine findings by their declared severity. Do not promote `warn`
  findings into hard rejections on your own, and do not soften `blocking` ones.
- Medium-voltage context: the engine handles MV upstream worldwide — 22.9 kV
  (Korea), 11/33 kV (EU typical), 13.8/34.5 kV (US typical). If the user names
  a country, mention the applicable MV convention in the report.
- Comparative studies (e.g. "Blackwell vs Rubin on the same site") are a
  strong use of this skill: run design+validate per scenario, then present a
  side-by-side table. Mind the rate limit below when batching.
- Rate limits: anonymous 10 req/hour, registered (AIDC_API_KEY) 100 req/hour,
  20 req/min burst. For multi-scenario studies on an anonymous key, plan the
  minimum number of calls before starting and tell the user if the study
  won't fit in the budget.
- If a tool call errors with a rate-limit or auth message, report it plainly
  and suggest setting `AIDC_API_KEY`; don't silently retry.
