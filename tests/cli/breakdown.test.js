const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runCli, tmpProject } = require('./helpers');

const PRD_FIXTURE = `# Feature: user-auth

## User Stories

#### User Story 1: Register

**As a** new visitor
**I want** to create an account
**So that** I can access the app

**Acceptance Criteria:**
- [ ] Registration form validates email
- [ ] Password is hashed
`;

test('breakdown: generates numbered scenario files with {feature}-{no}-{slug}-{type}.md naming', () => {
  const dir = tmpProject();
  const prdPath = path.join(dir, 'docs', 'features', 'user-auth-prd.md');
  fs.outputFileSync(prdPath, PRD_FIXTURE);

  const { status, stdout } = runCli(['/breakdown-task', 'docs/features/user-auth-prd.md', 'user-auth'], dir);

  assert.strictEqual(status, 0, stdout);
  const outputDir = path.join(dir, 'docs', 'production', 'user-auth');
  const files = fs.readdirSync(outputDir);
  assert.deepStrictEqual(files.sort(), [
    'user-auth-01-register-design.md',
    'user-auth-01-register-prod.md',
    'user-auth-01-register-tech.md',
    'user-auth-01-register-testing.md'
  ]);
  fs.removeSync(dir);
});

test('breakdown: derives feature name from PRD file when arg omitted', () => {
  const dir = tmpProject();
  const prdPath = path.join(dir, 'docs', 'features', 'auth-flow-prd.md');
  fs.outputFileSync(prdPath, PRD_FIXTURE);

  const { status, stdout } = runCli(['--yes', '/breakdown-task', 'docs/features/auth-flow-prd.md'], dir);

  assert.strictEqual(status, 0, stdout);
  const outputDir = path.join(dir, 'docs', 'production', 'auth-flow');
  assert.ok(fs.pathExistsSync(outputDir), `expected ${outputDir}`);
  assert.match(stdout, /No feature name provided, using extracted name: auth-flow/);
  fs.removeSync(dir);
});