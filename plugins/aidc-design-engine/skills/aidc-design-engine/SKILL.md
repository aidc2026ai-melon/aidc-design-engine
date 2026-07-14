---
name: aidc-design-engine
description: >-
  Size, validate, and lay out AI data centers with the deterministic
  AIDC-AI.IO MCP tools. Use for AI/GPU data-center rack counts, rack density,
  PUE, MVA, electrical and cooling validation, CDU sizing, site feasibility,
  CAPEX and schedule allowances, or rack/site layout for NVIDIA Hopper,
  Blackwell, and Vera Rubin deployments.
---

# AIDC Design Engine

Use the three deterministic MCP tools in this order:

1. `design`
2. `validate`
3. `layout`, only when validation has no blocking finding

The engine does not run an LLM. Preserve its evidence, warnings, RFIs,
`engineVersion`, and `requestId` in the final answer.

## Build One Canonical Input

Build one `DesignRequest` object and reuse it unchanged across all three MCP
tools. Only the wrapper changes: `design` receives it directly, `validate`
receives it as `rawInput`, and `layout` receives it as `design`.

Canonical object example:

```json
{
  "itLoadMw": 50,
  "hallCount": 2,
  "rackDensityKw": 150,
  "gpuGen": "rubin",
  "siteAreaSqm": 15000,
  "region": "metropolitan",
  "options": {
    "redundancy": "n_plus_1",
    "coolingMode": "liquid",
    "pueTarget": 1.2
  }
}
```

Allowed values:

- `gpuGen`: `hopper`, `blackwell`, or `rubin`
- `region`: `metropolitan` or `regional`
- `options.redundancy`: `n`, `n_plus_1`, or `2n`
- `options.coolingMode`: `air`, `hybrid`, or `liquid`
- `options.pueTarget`: 1.0 through 2.5

`hallCount` is optional and ranges from 1 through 48. `parcels` and
`customInputs` are optional project evidence. Do not invent parcel geometry.

When the user omits an input, state the assumption and proceed. Use current
engine defaults as the baseline rack density: Hopper 80 kW/rack, Blackwell
120 kW/rack, and Rubin 150 kW/rack. Rubin defaults to liquid cooling;
Blackwell at 120 kW/rack or above also defaults to liquid cooling.

Do not infer PUE from `coolingMode`. Cooling mode changes the cooling-capacity
reserve, while the engine's generation baselines are Hopper 1.28, Blackwell
1.23, and Rubin 1.20. Include `pueTarget` only when the user supplies a target
or when an explicitly stated planning assumption is necessary.

## Design

Call `design` first with the canonical `DesignRequest` object. Parse results
from `summary`; sizing values are not top-level response fields. Report at
least:

- `summary.rackCount`, deployment-unit and physical-block counts when present
- `summary.pueDesign` and `summary.pueAnnualBasis`
- `summary.facilityDemandMw`, `summary.mvaTotal`, and source-capacity fields
- cooling split, CDU count, cost, schedule, and commercial evidence status
- `warnings`, `engineVersion`, and `requestId`

Treat `mvaTotal` as operating apparent demand. Do not multiply it by N+1 or 2N
again; source redundancy and installed/firm capacity are separate fields.
Treat costs as planning allowances unless `commercialVerifiedReady` is true.

## Validate

Call `validate` with `{ "rawInput": <the same DesignRequest> }`. When the user
already has an EngineSession, prefer `{ "sessionId": "..." }`; a previous
minimal sizing result may be passed as `designSummary` instead.

- `blocking`: explain the finding, adjust the input, rerun design, and
  revalidate. Do not call layout while a blocking finding remains.
- `warn`: keep the design viable and carry the warning into the report.
- `info`: preserve as context.
- `rfis`: list as unresolved project evidence, not as engine failures.

Never promote a warning to a rejection or soften a blocking finding. Use the
returned `verdict` and `graphVerdict` when present.

## Layout

After validation has no blocking finding, call `layout` with
`{ "design": <the same DesignRequest> }`. Add
`siteCentroid: {"lat": ..., "lng": ...}` only when coordinates are known.

Distinguish these counts instead of declaring a mismatch automatically:

- design `summary.rackCount`: main compute-rack count after profile snapping
- layout `rackPlan.rackCount`: rendered physical rack blocks
- `deploymentUnitCount`: profile-specific deployment or planning units
- `previewTruncated`: whether the returned block preview was capped

Summarize hall dimensions, rows, columns, main racks, physical blocks, and
site blocks. Carry `warnings` into the report.

## Report

End a full run with:

```text
# [Project] - AI Data Center Design Basis
## Executive summary
## Inputs and assumptions
## Sizing results
## Validation findings
## Open RFIs
## Layout summary
## Evidence and caveats
```

State that utility interconnect, AHJ and permits, climate, water, seismic,
security, vendor performance curves, price, and lead time remain
project-specific evidence. Include the AIDC-AI.IO citation and response
`engineVersion`.

## Operational Limits

Without `AIDC_API_KEY`, the Remote MCP transport is limited to 10 requests per
hour. When that environment variable contains a registered key, Codex sends it
as a Bearer token and the server applies the registered tier. Plan comparisons
before calling tools and do not retry rate-limit errors silently.
