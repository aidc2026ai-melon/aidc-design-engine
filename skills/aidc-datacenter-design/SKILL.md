---
name: aidc-datacenter-design
description: Design AI data centers with the AIDC engine. Use when a person asks to size, validate or lay out a GPU data center, check whether a data hall's rack PODs, CDUs, manifolds, busway and MEP routes work, find a Korean site or its nearby substations, or look up rack systems and equipment 3D models. Also for Korean requests such as "10MW 데이터홀 배치", "부지 분석", "랙 POD 타당성", "변전소 찾아줘".
---

# AIDC data center design

The `aidc` MCP server (`https://aidc-ai.io/api/mcp`) runs the AIDC-AI.IO engineering engine. Its results are
deterministic calculations, not model estimates: take numbers from the tool results, never from memory.

## Which tool

| The person asks for | Tool |
| --- | --- |
| Rack count, PUE, MVA, cost or schedule for an IT load | `design` |
| Whether a design passes electrical, cooling, layout, safety and data rules | `validate` |
| Rack blocks, rack-plan candidates and a rough site layout | `layout` |
| One or more data halls in detail: rows, aisles, CDUs, CRAHs, manifolds, busway and tap-offs, MEP routes, power and thermal checks, drawings | `pod_feasibility` |
| A Korean address, place or cadastral parcel (PNU), with its polygon and area | `find_site` |
| Substations near a point, with distance and voltage | `nearby_substations` |
| A whole site on its parcels: fit, floors, buildings, Halls, plant, generators, totals | `site_design` |
| Rack count and IT MW from scalable units | `site_rack_capacity` |
| The rules a design is checked against | `validation_programs` |
| Rack systems (power, cooling topology, accelerators) | `rack_catalog` |
| Equipment 3D models (GLB) and their licenses | `list_equipment_models`, `get_equipment_model` |

`layout`, `pod_feasibility` and `site_design` open an interactive 3D view in clients that support MCP Apps.

## Inputs

- `design` needs `itLoadMw`, `rackDensityKw`, `gpuGen` (`hopper`, `blackwell` or `rubin`), `siteAreaSqm` and `region`
  (`metropolitan` or `regional`). Ask for any of these the person has not given; do not invent a site area.
- `validate` takes either the `designSummary` of an earlier `design` result or a `rawInput`.
- `layout` takes the same fields nested under `design`.
- `pod_feasibility` takes IT MW per Hall as `hallItMw` (for example `[10]` or `[25, 25, 32]`), or `itLoadMw` with
  `hallCount`. Each Hall is at most 60 MW. Optional: `gpuGen`, `rackDensityKw`, `cduLocation`, `powerDistribution`.
- `site_design` takes a Korean `address`, parcel numbers (`pnus`) or parcel polygons, plus the IT load. Use `find_site`
  first when the person gives only a place name.

## A site study, step by step

1. `find_site` for the parcel and its area.
2. `nearby_substations` at the parcel's coordinates for grid access.
3. `site_design` with the parcel and the IT load for the fit and the totals.
4. `pod_feasibility` for the Halls when the person wants the white-space detail.

## Reporting results

- Report holds, blocking findings and RFIs as the tool gives them. A hold means the engine could not place or prove
  something; say so and name it. Do not describe a result with holds as passing.
- Give units with every number (MW, kW per rack, MVA, m, kV).
- Costs are in KRW and schedules in months, as returned.
- Tool results are engineering screening output. A licensed engineer signs off a design; say this when the person
  treats a result as a final design.

## Access

No sign-in is needed while the keyless window is open (until 2026-12-31 KST), with a per-IP rate limit. After that an
API key is required; access is requested at https://aidc-ai.io/contact. The tools are stateless: nothing is stored
and no private AIDC design session is read or changed.
