const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const readJson = name => JSON.parse(read(name));

test('the Claude plugin connects to the remote server with no credential or local process', () => {
  const config = readJson('.mcp.json');
  assert.deepEqual(Object.keys(config.mcpServers), ['aidc']);
  assert.deepEqual(config.mcpServers.aidc, { type: 'http', url: 'https://aidc-ai.io/api/mcp' });
  assert.equal(read('.mcp.json').includes('AIDC_API_KEY'), false);
});

test('the Claude plugin manifest and marketplace entry agree', () => {
  const plugin = readJson('.claude-plugin/plugin.json');
  assert.equal(plugin.name, 'aidc-design-engine');
  assert.equal(plugin.version, '0.2.0');
  const marketplace = readJson('.claude-plugin/marketplace.json');
  assert.equal(marketplace.name, 'aidc-ai');
  assert.deepEqual(marketplace.plugins.map(entry => [entry.name, entry.source]), [['aidc-design-engine', './']]);
});

test('the Claude plugin ships one skill that names the server and its access terms', () => {
  assert.deepEqual(fs.readdirSync(path.join(root, 'skills')), ['aidc-datacenter-design']);
  const skill = read('skills/aidc-datacenter-design/SKILL.md');
  assert.match(skill, /^---\nname: aidc-datacenter-design\n/);
  assert.match(skill, /https:\/\/aidc-ai\.io\/api\/mcp/);
  assert.match(skill, /keyless window is open \(until 2026-12-31 KST\)/);
});

test('the Codex plugin keeps its remote transport and Bearer credential', () => {
  const remote = readJson('plugins/aidc-design-engine/.mcp.json');
  assert.deepEqual(Object.keys(remote.mcpServers), ['aidc-design-engine']);
  assert.equal(remote.mcpServers['aidc-design-engine'].type, 'http');
  assert.equal(remote.mcpServers['aidc-design-engine'].url, 'https://aidc-ai.io/api/mcp');
  assert.equal(remote.mcpServers['aidc-design-engine'].bearer_token_env_var, 'AIDC_API_KEY');
  assert.equal(readJson('plugins/aidc-design-engine/.codex-plugin/plugin.json').version, '0.1.1');
  readJson('.agents/plugins/marketplace.json');
});
