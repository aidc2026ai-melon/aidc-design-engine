# AIDC Design Engine Plugin

Size, validate, and lay out AI data centers from Claude or Codex - for NVIDIA
Hopper, Blackwell (GB200 NVL72), and Rubin (Vera Rubin NVL72) deployments.
Backed by the deterministic engineering engine at [aidc-ai.io](https://aidc-ai.io).

## Install

### Claude

```bash
claude plugin marketplace add aidc2026ai-melon/aidc-design-engine
claude plugin install aidc-design-engine@aidc-ai
```

### Codex

```bash
codex plugin marketplace add aidc2026ai-melon/aidc-design-engine
codex plugin add aidc-design-engine@aidc-ai
```

## What's inside

| Component | Purpose |
|---|---|
| MCP server `aidc-design-engine` | Three tools: `design` (rack count, PUE, MVA, cost, schedule), `validate` (electrical/cooling/layout/safety rule QA with severity-classified findings and RFIs), and `layout` (rack plan in mm plus site plan blocks) |
| Skill `aidc-design-engine` | Encodes one canonical DesignRequest across design -> validate -> layout -> report, GPU-generation density/PUE defaults, validation gating, rack-count and MVA semantics, and a standard design-basis report template |
| Codex marketplace | Connects directly to `https://aidc-ai.io/api/mcp`; the Claude plugin continues to use `npx aidc-mcp-server` |

## Requirements

- Claude: Node.js >= 18 (the MCP server runs via `npx -y aidc-mcp-server`)
- Codex: no local Node.js requirement; it uses the Remote MCP endpoint
- Internet access to `https://aidc-ai.io`

## Authentication (optional)

Anonymous use is allowed (10 requests/hour). The Codex Remote MCP transport
maps the following environment variable to a Bearer token. Claude stdio also
uses it when the installed `aidc-mcp-server` release supports bearer
forwarding:

```
AIDC_API_KEY=aidc_live_...
```

Claude stdio key forwarding requires `aidc-mcp-server` 0.2.2 or later; npm
`latest` is 0.2.2 as of 2026-07-14. The Codex Remote MCP transport forwards
the same variable directly as a Bearer token.

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
