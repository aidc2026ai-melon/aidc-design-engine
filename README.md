# AIDC Design Engine Plugin

Use the AIDC-AI.IO engine to size, validate, and lay out AI data centers from
Claude or Codex. Claude runs the published `aidc-mcp-server@0.2.4` package
over local stdio; Codex retains its direct Streamable HTTP connection. Both
clients expose `design`, `validate`, and `layout` and preserve engine warnings,
RFIs, and request IDs.

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

## Requirements and authentication

- Claude local stdio: Node.js 18 or later. Codex Remote MCP needs no local Node.js.
- Internet access to `https://aidc-ai.io`.
- A registered AIDC API key, available through [Contact](https://aidc-ai.io/contact).
- Configure the key for the MCP server process; credentials are never
  `design`, `validate`, `layout`, or `customInputs` arguments.

For Claude local stdio, the launcher first reads `AIDC_API_KEY` from its process environment. On
macOS, if that variable is absent, it reads an existing Keychain application
password with service `AIDC MCP API Key` and account `aidc-design-engine`.
A missing credential stops startup with a setup error; anonymous calculations
are not supported. API errors and rate limits remain visible.

Claude on macOS can store the registered key under that Keychain service and
account using Keychain Access. The key value stays outside the plugin and
chat. Windows and Linux users must supply `AIDC_API_KEY` through their
client's private MCP environment/credential configuration. Some desktop
clients do not inherit shell environment variables; verify the MCP process
receives the variable rather than assuming a terminal export is sufficient.
If the client has no plugin credential configuration, use the package's
[private per-user MCP configuration](https://www.npmjs.com/package/aidc-mcp-server)
and disable the duplicate plugin server. Do not put real keys into this
repository, uploaded plugin files, examples, or messages.

## Tools and evidence

1. `design`: send the selected design inputs and read sizing from `summary`.
2. `validate`: send the same inputs as `rawInput`, or the returned `designSummary`.
   Private EngineSession IDs stay in the signed-in AIDC workflow.
3. `layout`: send the same inputs nested under `design` after checking blocking findings.

Reuse the selected OPR/BOD/catalog inputs; do not turn illustrative numbers
or GPU-generation names into new rack, power, cooling, or equipment defaults.
`ok: true` confirms a successful tool response. It does not replace engineering
approval or change `PENDING` into PASS.

## Codex and other remote clients

The Codex plugin uses `bearer_token_env_var: "AIDC_API_KEY"`; supply that
variable securely to the Codex host before connecting. A local Keychain item
is not automatically loaded into the remote client. Other hosted MCP clients can use `https://aidc-ai.io/api/mcp`
with their registered Bearer credential. This is a separate transport from
the npm package. npm package versions, plugin versions, and the remote
engine/API version identify different artifacts and need not match.

Terms: https://aidc-ai.io/terms · Privacy: https://aidc-ai.io/privacy

MIT © AIDC-AI.IO
