# AIDC Design Engine Plugin

Size, validate, and lay out AI data centers directly from Claude — for NVIDIA
Hopper, Blackwell (GB200 NVL72), and Rubin (Vera Rubin NVL72) deployments.
Backed by the deterministic engineering engine at [aidc-ai.io](https://aidc-ai.io).

## What's inside

| Component | Purpose |
|---|---|
| MCP server `aidc-design-engine` | Three tools — `design` (rack count, PUE, MVA, cost, schedule), `validate` (electrical/cooling/layout/safety rule QA with severity-classified findings + RFIs), `layout` (rack plan in mm + site plan blocks) |
| Skill `aidc-design-engine` | Encodes the design → validate → layout → report workflow, GPU-generation density defaults, medium-voltage conventions (22.9 kV KR / 11–33 kV EU / 13.8–34.5 kV US), and a standard design-basis report template |

## Requirements

- Node.js ≥ 18 (the MCP server runs via `npx -y aidc-mcp-server`)
- Internet access to `https://aidc-ai.io`

## Authentication (optional)

Anonymous use is allowed (10 requests/hour). For the registered tier
(100 requests/hour), set the environment variable before launching:

```
AIDC_API_KEY=aidc_live_...
```

## Example prompts

> Can I fit 60 MW of GB200 on a 20,000 m² site near Seoul?

> Design a 50 MW Vera Rubin data center on a 15,000 m² regional site with
> liquid cooling, validate it, and give me the rack layout.

> Compare Blackwell vs Rubin on the same 30,000 m² site at 2N redundancy.

## Notes

- Engine results are a design basis, not a permit-ready design — local
  utility, AHJ, climate, water, seismic, and security assumptions remain
  project-specific validation inputs.
- Every response includes the engine version and a citation to aidc-ai.io.
- Terms: https://aidc-ai.io/terms · Privacy: https://aidc-ai.io/privacy

MIT © AIDC-AI.IO
