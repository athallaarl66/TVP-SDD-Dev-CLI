const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runCli, tmpProject, CLI_DIR } = require('./helpers');
const { validateFeatureName, assertInside } = require('../../lib/utils/file');

const PRD_FIXTURE = `# Feature: user-auth

## User Stories

#### User Story 1: Register

**As a** new visitor
**I want** to create an account
**So that** I can access the app

**Acceptance Criteria:**
- [ ] Registration form validates email
`;

test('validateFeatureName: rejects traversal, separators, absolute paths, empty', () => {
  for (const bad of ['', '   ', '..', '../evil', 'a/b', 'a\\b', '/abs', 'C:\\evil', 'user auth', '.hidden']) {
    assert.throws(
      () => validateFeatureName(bad),
      /Feature name is required|Invalid feature name/,
      `expected rejection for ${JSON.stringify(bad)}`
    );
  }
  assert.strictEqual(validateFeatureName('user-auth'), 'user-auth');
  assert.strictEqual(validateFeatureName(' user_2 '), 'user_2');
});

test('assertInside: rejects paths that escape the output root', () => {
  const root = path.join(path.resolve(path.sep), 'proj', 'docs', 'features');
  assert.throws(() => assertInside(root, path.join(root, '..', 'evil.md')), /outside/);
  assert.throws(() => assertInside(root, root), /outside/);
  assert.ok(assertInside(root, path.join(root, 'ok.md')));
});

test('/prd rejects a traversal feature name and writes nothing', () => {
  const dir = tmpProject();
  const { status, stdout, stderr } = runCli(['--yes', '/prd', '../escape'], dir);
  assert.strictEqual(status, 1, stdout);
  assert.match(stdout + stderr, /Invalid feature name/);
  assert.strictEqual(fs.pathExistsSync(path.join(dir, 'escape-prd.md')), false);
  assert.strictEqual(fs.pathExistsSync(path.join(dir, 'docs', 'escape-prd.md')), false);
  fs.removeSync(dir);
});

test('/init rejects a traversal feature name', () => {
  const dir = tmpProject();
  const { status, stdout, stderr } = runCli(['--yes', '/init', '../../evil'], dir);
  assert.strictEqual(status, 1, stdout);
  assert.match(stdout + stderr, /Invalid feature name/);
  assert.strictEqual(fs.pathExistsSync(path.join(dir, 'docs')), false);
  fs.removeSync(dir);
});

test('/prd preserves an existing document unless --force is passed', () => {
  const dir = tmpProject();
  const prdPath = path.join(dir, 'docs', 'features', 'user-auth-prd.md');

  const first = runCli(['--yes', '/prd', 'user-auth'], dir);
  assert.strictEqual(first.status, 0, first.stdout);
  fs.writeFileSync(prdPath, '# hand edited\n');

  const second = runCli(['--yes', '/prd', 'user-auth'], dir);
  assert.strictEqual(second.status, 1, second.stdout);
  assert.match(second.stdout + second.stderr, /already exists/);
  assert.strictEqual(fs.readFileSync(prdPath, 'utf-8'), '# hand edited\n');

  const forced = runCli(['--yes', '--force', '/prd', 'user-auth'], dir);
  assert.strictEqual(forced.status, 0, forced.stdout);
  assert.ok(!fs.readFileSync(prdPath, 'utf-8').includes('hand edited'));
  fs.removeSync(dir);
});

test('breakdown preserves existing scenario files unless --force is passed', () => {
  const dir = tmpProject();
  fs.outputFileSync(path.join(dir, 'docs', 'features', 'user-auth-prd.md'), PRD_FIXTURE);

  const first = runCli(['/breakdown-task', 'docs/features/user-auth-prd.md', 'user-auth'], dir);
  assert.strictEqual(first.status, 0, first.stdout);

  const target = path.join(dir, 'docs', 'production', 'user-auth', 'user-auth-01-register-prod.md');
  const filesBefore = fs.readdirSync(path.dirname(target));
  fs.writeFileSync(target, 'edited by hand\n');

  const second = runCli(['/breakdown-task', 'docs/features/user-auth-prd.md', 'user-auth'], dir);
  assert.strictEqual(second.status, 1, second.stdout);
  assert.match(second.stdout + second.stderr, /already exist/);
  assert.strictEqual(fs.readFileSync(target, 'utf-8'), 'edited by hand\n');
  // Nothing else was regenerated either.
  assert.deepStrictEqual(fs.readdirSync(path.dirname(target)).sort(), filesBefore.sort());

  const forced = runCli(['--force', '/breakdown-task', 'docs/features/user-auth-prd.md', 'user-auth'], dir);
  assert.strictEqual(forced.status, 0, forced.stdout);
  assert.ok(!fs.readFileSync(target, 'utf-8').includes('edited by hand'));
  fs.removeSync(dir);
});

test('qa-test-script rejects an unsupported configured framework before side effects', () => {
  const dir = tmpProject();
  fs.outputFileSync(path.join(dir, 'sdd.config.json'), JSON.stringify({ testFramework: 'mocha-evil' }));
  fs.outputFileSync(path.join(dir, 'docs', 'production', 'checkout', 'checkout-01-login-testing.md'), '# testing\n');

  const { status, stdout, stderr } = runCli(['--yes', '/qa-test-script', 'checkout'], dir);
  assert.strictEqual(status, 1, stdout);
  assert.match(stdout + stderr, /unsupported testFramework/);
  assert.strictEqual(fs.pathExistsSync(path.join(dir, 'tests')), false, 'tests/ must not be created');
  assert.deepStrictEqual(
    JSON.parse(fs.readFileSync(path.join(dir, 'sdd.config.json'), 'utf-8')),
    { testFramework: 'mocha-evil' }
  );
  fs.removeSync(dir);
});

test('/init writes all four documents and then refuses to overwrite them', () => {
  const dir = tmpProject();
  const first = runCli(['--yes', '/init', 'user-auth'], dir);
  assert.strictEqual(first.status, 0, first.stdout);

  const expected = [
    path.join('docs', 'features', 'user-auth-prd.md'),
    path.join('docs', 'features', 'user-auth-technical.md'),
    path.join('docs', 'test-reports', 'user-auth', 'user-auth-spec-test.md'),
    path.join('docs', 'test-reports', 'user-auth', 'user-auth-qa-report.md')
  ];
  for (const rel of expected) {
    assert.ok(fs.pathExistsSync(path.join(dir, rel)), `expected ${rel}`);
  }

  const second = runCli(['--yes', '/init', 'user-auth'], dir);
  assert.strictEqual(second.status, 1, second.stdout);
  assert.match(second.stdout + second.stderr, /already exists/);
  fs.removeSync(dir);
});

test('/init fails when a required template is missing and writes nothing', () => {
  const dir = tmpProject();
  const fakeCliRoot = path.join(dir, 'fake-cli');
  const realTemplates = path.join(CLI_DIR, 'templates');
  for (const file of fs.readdirSync(realTemplates)) {
    if (file === 'qa-report-template.md') continue;
    fs.copySync(path.join(realTemplates, file), path.join(fakeCliRoot, 'templates', file));
  }

  const proj = path.join(dir, 'proj');
  fs.ensureDirSync(proj);
  const { status, stdout, stderr } = runCli(['--yes', '/init', 'user-auth'], proj, { SDD_CLI_ROOT: fakeCliRoot });

  assert.strictEqual(status, 1, stdout);
  assert.match(stdout + stderr, /qa-report-template\.md/);
  assert.strictEqual(fs.pathExistsSync(path.join(proj, 'docs')), false, 'no documentation should be written');
  fs.removeSync(dir);
});
