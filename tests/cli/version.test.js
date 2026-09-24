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