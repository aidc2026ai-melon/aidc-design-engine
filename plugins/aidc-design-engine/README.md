# AIDC Design Engine for Codex

This plugin preserves the direct Streamable HTTP connection to
`https://aidc-ai.io/api/mcp`; no local Node.js runtime is required.

A registered API key is required. The configured `bearer_token_env_var`
reads `AIDC_API_KEY` from the Codex host and sends it as a Bearer credential.
Use private client credentials/environment settings; never put a real key
in a plugin, repository, tool argument, or chat. A file or macOS Keychain
item is not automatically read by the remote transport.

After updating, open a new Codex chat to load the tool configuration.
The tools are `design`, `validate`, and `layout`. Read sizing from `summary`,
preserve `requestId` and evidence, and keep `PENDING` distinct from approval.
Private EngineSession validation stays in the signed-in AIDC workflow.

For local stdio installation, see the repository README and the separately
versioned `aidc-mcp-server` npm package. The remote API, plugin, and npm
package identify different artifacts and do not share a version number.

Terms: https://aidc-ai.io/terms · Privacy: https://aidc-ai.io/privacy
