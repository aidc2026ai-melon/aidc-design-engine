# AIDC Design Engine Plugin

Use the AIDC-AI.IO engine to size, validate, and lay out AI data centers from
Claude or Codex. Both clients connect to the remote MCP server at
`https://aidc-ai.io/api/mcp` (Streamable HTTP); no local Node.js runtime is
required.

## Install

Claude Code:

```bash
claude plugin marketplace add aidc2026ai-melon/aidc-design-engine
claude plugin install aidc-design-engine@aidc-ai
```

Codex:

```bash
codex plugin marketplace add aidc2026ai-melon/aidc-design-engine
codex plugin add aidc-design-engine@aidc-ai
```

After updating an installed plugin, refresh/restart the client as required
and open a new chat so it loads the new tool configuration.

## Claude plugin (0.2.0)

- MCP server `aidc`: `https://aidc-ai.io/api/mcp`. No sign-in while the
  keyless window is open (until 2026-12-31 KST), with a per-IP rate limit.
  After that an API key is required; access is requested through
  [Contact](https://aidc-ai.io/contact).
- Skill: `aidc-datacenter-design`.
- 12 read-only tools: `design`, `validate`, `layout`, `pod_feasibility`,
  `find_site`, `nearby_substations`, `site_design`, `site_rack_capacity`,
  `validation_programs`, `rack_catalog`, `list_equipment_models`,
  `get_equipment_model`. `layout`, `pod_feasibility` and `site_design` open a
  3D view in clients that support MCP Apps.
- The tools are stateless: nothing is stored and no private AIDC design
  session is read or changed.

Try: "Check the POD feasibility of a 10 MW Rubin data hall and show it in 3D."

## Codex plugin (0.1.1)

The Codex plugin under `plugins/aidc-design-engine` is unchanged. It uses
`bearer_token_env_var: "AIDC_API_KEY"`; supply that variable securely to the
Codex host before connecting. Do not put real keys into this repository,
uploaded plugin files, examples, or messages. See
[its README](plugins/aidc-design-engine/README.md).

## Evidence

Tool results are deterministic engineering screening output. Report holds,
blocking findings and RFIs as returned; `ok: true` confirms a successful tool
response and does not replace engineering approval.

Terms: https://aidc-ai.io/terms · Privacy: https://aidc-ai.io/privacy

MIT © AIDC-AI.IO
