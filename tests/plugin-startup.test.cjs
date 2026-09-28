const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const config = readJson('.mcp.json');
const launcher = config.mcpServers['aidc-design-engine'].args[1];

function run(platform, env, keychainValue) {
  const state = { spawns: [], lookups: [], errors: '', exitCode: null };
  const child = { on() { return this; }, kill() {} };
  const context = {
    require(name) {
      assert.equal(name, 'node:child_process');
      return {
        execFileSync(command, args, options) {
          state.lookups.push({ command, args, options });
          if (keychainValue === undefined) throw Error('missing');
          return keychainValue;
        },
        spawn(command, args, options) { state.spawns.push({ command, args, options }); return child; },
      };
    },
    process: { platform, env, stderr: { write(text) { state.errors += text; } }, exit(code) { state.exitCode = code; throw Error('exit'); }, on() {} },
  };
  try { vm.runInNewContext(launcher, context); }
  catch (error) { assert.equal(error.message, 'exit'); }
  return state;
}

test('each client retains one server and the intended transport', () => {
  const remote = readJson('plugins/aidc-design-engine/.mcp.json');
  assert.deepEqual(Object.keys(remote.mcpServers), ['aidc-design-engine']);
  assert.equal(remote.mcpServers['aidc-design-engine'].type, 'http');
  assert.equal(remote.mcpServers['aidc-design-engine'].url, 'https://aidc-ai.io/api/mcp');
  assert.equal(remote.mcpServers['aidc-design-engine'].bearer_token_env_var, 'AIDC_API_KEY');
  assert.deepEqual(Object.keys(config.mcpServers), ['aidc-design-engine']);
  assert.equal(config.mcpServers['aidc-design-engine'].command, 'node');
  assert.equal(readJson('.claude-plugin/plugin.json').version, '0.1.1');
  assert.equal(readJson('plugins/aidc-design-engine/.codex-plugin/plugin.json').version, '0.1.1');
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) readJson(file);
});

test('missing credentials stop every platform before spawning a server', () => {
  for (const platform of ['darwin', 'linux', 'win32']) {
    const state = run(platform, {}, undefined);
    assert.equal(state.exitCode, 1);
    assert.equal(state.spawns.length, 0);
    assert.match(state.errors, /API key/);
  }
});

test('macOS Keychain credentials reach only the child environment', () => {
  const secret = 'fixture-key';
  const state = run('darwin', {}, secret + '\n');
  assert.equal(state.lookups[0].command, '/usr/bin/security');
  assert.equal(state.lookups[0].args.join(' '), 'find-generic-password -a aidc-design-engine -s AIDC MCP API Key -w');
  const spawn = state.spawns[0];
  assert.equal(spawn.options.env.AIDC_API_KEY, secret);
  assert.equal(spawn.args.join(' '), '-y aidc-mcp-server@0.2.4');
  assert.equal(spawn.command, 'npx');
  assert.equal(spawn.args.join(' ').includes(secret), false);
  assert.equal(state.errors.includes(secret), false);
});

test('explicit environment credentials take precedence, including on Windows', () => {
  for (const platform of ['darwin', 'linux', 'win32']) {
    const state = run(platform, { AIDC_API_KEY: ' fixture-env-key ' }, 'unused-key');
    assert.equal(state.lookups.length, 0);
    assert.equal(state.spawns.length, 1);
    assert.equal(state.spawns[0].options.env.AIDC_API_KEY, 'fixture-env-key');
    assert.equal(state.spawns[0].command, platform === 'win32' ? 'cmd.exe' : 'npx');
  }
});
