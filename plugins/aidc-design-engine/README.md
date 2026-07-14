# AIDC Design Engine for Codex

This Codex plugin connects directly to the public AIDC-AI.IO Remote MCP
endpoint and adds a workflow skill for deterministic AI data-center sizing,
validation, and layout.

## Components

- Remote MCP: `https://aidc-ai.io/api/mcp`
- Tools: `design`, `validate`, `layout`
- Skill: canonical input reuse, validation gating, count semantics, and a
  design-basis report format

## Authentication and limits

Without `AIDC_API_KEY`, the Remote MCP endpoint uses the anonymous tier (10
requests per hour). When `AIDC_API_KEY` is present, Codex sends it as a Bearer
token so the server can apply the registered tier.

Engine results are planning evidence, not a permit-ready design. Terms:
https://aidc-ai.io/terms. Privacy: https://aidc-ai.io/privacy.
