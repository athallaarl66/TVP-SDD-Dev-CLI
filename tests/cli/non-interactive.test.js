const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runCli, tmpProject } = require('./helpers');

test('--yes: no-arg /prd derives feature name from docs/features/*-prd.md', () => {
  const dir = tmpProject();
  fs.outputFileSync(path.join(dir, 'docs', 'features', 'user-auth-prd.md'), '# PRD\n');

  // --force: the fixture PRD already occupies the output path.
  const { status, stdout } = runCli(['--yes', '--force', '/prd'], dir);
  assert.strictEqual(status, 0, stdout);
  assert.match(stdout, /user-auth-prd\.md/);
  fs.removeSync(dir);
});

test('--yes: no-arg /prd with nothing derivable errors without hanging', () => {
  const dir = tmpProject(); // empty project, no docs/
  const { status, stdout, stderr } = runCli(['--yes', '/prd'], dir);
  assert.strictEqual(status, 1);
  assert.match(stdout + stderr, /Error: missing required value\./);
  fs.removeSync(dir);
});

test('--yes: /qa-test-script defaults to detected framework and reads nested stories', () => {
  const dir = tmpProject();
  const PROD = 'docs/production/checkout';
  fs.outputFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'jsapp' }));
  fs.outputFileSync(path.join(dir, PROD, 'checkout-01-login-testing.md'), '# legacy-test\n');
  fs.outputFileSync(path.join(dir, PROD, 'accounts', '01-register', 'testing.md'), '# nested-test\n');
  fs.outputFileSync(path.join(dir, PROD, 'recovery', '02-reset', 'testing.md'), '# second-nested-test\n');

  const { status, stdout } = runCli(['--yes', '/qa-test-script', 'checkout'], dir);
  assert.strictEqual(status, 0, stdout);
  const jestFile = path.join(dir, 'tests', 'checkout.test.ts');
  assert.ok(fs.pathExistsSync(jestFile), `expected Jest test file; stdout: ${stdout}`);
  const generated = fs.readFileSync(jestFile, 'utf-8');
  assert.ok(generated.includes('legacy-test'));
  assert.ok(generated.includes('nested-test'));
  assert.ok(generated.includes('second-nested-test'));

  const secondRun = runCli(['--yes', '--force', '/qa-test-script', 'checkout'], dir);
  assert.strictEqual(secondRun.status, 0, secondRun.stdout);

  // Persisted framework should be picked on subsequent runs without re-asking.
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'sdd.config.json'), 'utf-8'));
  assert.strictEqual(config.testFramework, 'jest');
  fs.removeSync(dir);
});