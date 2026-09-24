const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runCli, tmpProject } = require('./helpers');

const PROD_DIR = 'docs/production/user-auth';
const FILES = {
  prod: 'user-auth-01-register-prod.md',
  tech: 'user-auth-01-register-tech.md',
  design: 'user-auth-01-register-design.md',
  testing: 'user-auth-01-register-testing.md'
};

function seedScenario(dir) {
  for (const f of Object.values(FILES)) {
    fs.outputFileSync(path.join(dir, PROD_DIR, f), `# ${f}\n\ncontent for ${f}\n`);
  }
}

test('implement-code: generates brief referencing all four source files', () => {
  const dir = tmpProject();
  seedScenario(dir);

  const { status, stdout } = runCli(['/implement-code', '01'], dir);
  assert.strictEqual(status, 0, stdout);
  assert.match(stdout, /Implementation brief created/);

  const brief = path.join(dir, PROD_DIR, 'user-auth-01-register-implement.md');
  assert.ok(fs.pathExistsSync(brief));
  const content = fs.readFileSync(brief, 'utf-8');
  for (const f of Object.values(FILES)) {
    assert.ok(content.includes(f), `brief should reference ${f}`);
  }
  fs.removeSync(dir);
});

test('implement-code: alias /sdd-implement-code dispatches', () => {
  const dir = tmpProject();
  seedScenario(dir);

  const { status, stdout } = runCli(['/sdd-implement-code', '01', 'user-auth'], dir);
  assert.strictEqual(status, 0, stdout);
  assert.match(stdout, /Implementation brief created/);
  fs.removeSync(dir);
});

test('implement-code: missing scenario prints listing and exits 1', () => {
  const dir = tmpProject();
  seedScenario(dir); // only scenario 01 exists

  const { status, stdout, stderr } = runCli(['/implement-code', '09', 'user-auth'], dir);
  assert.strictEqual(status, 1);
  assert.match(stdout + stderr, /no breakdown files found for scenario 09/);
  assert.match(stdout + stderr, /Available scenarios: 01/);
  fs.removeSync(dir);
});