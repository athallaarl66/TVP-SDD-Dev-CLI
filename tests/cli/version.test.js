const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runCli, CLI_DIR } = require('./helpers');

test('version: CLI reports version matching package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package.json'), 'utf-8'));
  const { status, stdout } = runCli(['--version']);
  assert.strictEqual(status, 0);
  assert.match(stdout, new RegExp(pkg.version));
});

test('help: context, doctor, and MCP commands are discoverable', () => {
  const { status, stdout, stderr } = runCli(['--help']);
  assert.strictEqual(status, 0, stderr);
  for (const command of ['/context', '/doctor', '/remember', 'mcp']) {
    assert.match(stdout, new RegExp(`^\\s+${command}\\b`, 'm'));
  }
  const context = runCli(['/context', '--help']);
  assert.strictEqual(context.status, 0, context.stderr);
  assert.match(context.stdout, /--budget <characters>/);
  assert.match(context.stdout, /--terse/);
});