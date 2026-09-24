const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { runNode } = require('./helpers');

const PROMPT = path.resolve(__dirname, '..', '..', 'lib', 'utils', 'prompt.js');

test('promptOrFail: missing value in non-TTY prints error + usage and exits 1', () => {
  const { status, stderr, stdout } = runNode(
    `const { promptOrFail } = require(${JSON.stringify(PROMPT)});` +
      `promptOrFail('', 'Enter feature name:', 'sdd-gen /prd <featureName>').then(() => {});`
  );
  assert.strictEqual(status, 1);
  assert.match(stderr, /Error: missing required value\./);
  assert.match(stderr, /Usage: sdd-gen \/prd <featureName>/);
  assert.strictEqual(stdout.includes('Error'), false);
});

test('promptOrFail: provided value is returned without error', async () => {
  const { status, stdout } = runNode(
    `const { promptOrFail } = require(${JSON.stringify(PROMPT)});` +
      `promptOrFail('user-auth', 'Enter feature name:', 'usage', false).then(v => console.log('VALUE:' + v));`
  );
  assert.strictEqual(status, 0);
  assert.match(stdout, /VALUE:user-auth/);
});

test('promptOrFail: --yes derives defaultValue, no prompt, no hang', async () => {
  const { status, stdout, stderr } = runNode(
    `const { promptOrFail } = require(${JSON.stringify(PROMPT)});` +
      `promptOrFail('', 'msg', 'usage', true, 'fallback-feature').then(v => console.log('VALUE:' + v));`
  );
  assert.strictEqual(status, 0);
  assert.match(stdout, /VALUE:fallback-feature/);
  assert.strictEqual(stderr, '');
});