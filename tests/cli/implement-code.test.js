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

test('implement-code reads nested Epic story and saves brief beside source files', () => {
  const dir = tmpProject();
  const storyDir = path.join(dir, 'docs', 'production', 'user-auth', 'accounts', '01-register');
  for (const type of ['prod', 'tech', 'design', 'testing']) {
    fs.outputFileSync(path.join(storyDir, `${type}.md`), `# ${type}\n\n## User Story\n\n**As a** nested visitor\n`);
  }

  const result = runCli(['/implement-code', '01', 'user-auth'], dir);
  assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  const briefPath = path.join(storyDir, 'implement.md');
  assert.ok(fs.pathExistsSync(briefPath));
  const brief = fs.readFileSync(briefPath, 'utf-8');
  assert.match(brief, /Epic: accounts/);
  assert.match(brief, /accounts[\\/]+01-register[\\/]+prod\.md/);
  assert.match(brief, /nested visitor/);
  fs.removeSync(dir);
});

test('implement-code rejects ambiguous nested story numbers without writing a brief', () => {
  const dir = tmpProject();
  for (const epic of ['accounts', 'recovery']) {
    const storyDir = path.join(dir, 'docs', 'production', 'user-auth', epic, '01-register');
    fs.outputFileSync(path.join(storyDir, 'prod.md'), `## User Story\\n${epic}\\n`);
  }

  const result = runCli(['/implement-code', '01', 'user-auth'], dir);
  assert.strictEqual(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /scenario 01 is ambiguous/i);
  assert.strictEqual(fs.pathExistsSync(path.join(dir, 'docs', 'production', 'user-auth', 'accounts', '01-register', 'implement.md')), false);
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