const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runCli, tmpProject, CLI_DIR } = require('./helpers');
const { parseUserStories } = require('../../lib/utils/file');

const EPIC_PRD_FIXTURE = `# Feature: account-management

### Epic 1: Registration

#### User Story 1: Register
**As a** visitor
**I want** to register
**So that** I can use the app

**Acceptance Criteria:**
- [ ] Email is valid
- [x] AC-ACCOUNT-MANAGEMENT-01-2 Password policy is documented

## Notes
- [ ] this is not a criterion

### Epic 2: Recovery

#### User Story 2: Reset password
**As a** member
**I want** to reset my password
**So that** I can recover access

**Acceptance Criteria:**
- [ ] Reset link is sent
`;

test('PRD template and parser retain explicit Epic ownership for stories', () => {
  const template = fs.readFileSync(path.join(CLI_DIR, 'templates', 'prd-template.md'), 'utf-8');
  assert.match(template, /### Epic 1: \[Epic Title\]/);
  assert.match(template, /#### User Story 1: \[Story Title\]/);

  const stories = parseUserStories(EPIC_PRD_FIXTURE);
  assert.deepStrictEqual(stories.map(({ epicTitle, title }) => ({ epicTitle, title })), [
    { epicTitle: 'Registration', title: 'Register' },
    { epicTitle: 'Recovery', title: 'Reset password' }
  ]);
  assert.deepStrictEqual(stories[0].acceptanceCriteria, [
    { text: 'Email is valid', checked: false, id: null },
    { text: 'AC-ACCOUNT-MANAGEMENT-01-2 Password policy is documented', checked: true, id: 'AC-ACCOUNT-MANAGEMENT-01-2' }
  ]);
  assert.deepStrictEqual(stories[1].acceptanceCriteria, [
    { text: 'Reset link is sent', checked: false, id: null }
  ]);
});

test('criteria parser stops at section heading and accepts checked criteria with IDs', () => {
  const stories = parseUserStories(`### Epic 1: Account\n#### User Story 1: Profile\n**Acceptance Criteria:**\n- [x] AC-ACCOUNT-01-1 Profile exists\n\n## Notes\n- [ ] not an acceptance criterion\n`);
  assert.deepStrictEqual(stories[0].acceptanceCriteria, [
    { text: 'AC-ACCOUNT-01-1 Profile exists', checked: true, id: 'AC-ACCOUNT-01-1' }
  ]);
});

test('story and duplicate Epic slugs stay safe, bounded, and unique', () => {
  const longTitle = 'A'.repeat(120);
  const stories = parseUserStories(`### Epic 1: Same Epic
#### User Story 1: ${longTitle}

### Epic 2: Same Epic!
#### User Story 1: ${longTitle}

### Epic 3: Same Epic 2
#### User Story 3: Third
`);
  assert.deepStrictEqual(stories.map(story => story.epicSlug), ['same-epic', 'same-epic-2', 'same-epic-2-2']);
  assert.ok(stories.every(story => story.epicSlug.length <= 50));
  assert.ok(stories.slice(0, 2).every(story => story.slug.length === 50));
  assert.ok(stories.every(story => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.slug)));
  assert.ok(stories.every(story => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.epicSlug)));
});

test('breakdown assigns feature-wide sequence and bounded paths when story numbers repeat across Epics', () => {
  const dir = tmpProject();
  const longTitle = 'A'.repeat(120);
  try {
    const prdPath = path.join(dir, 'docs', 'features', 'duplicate-ids-prd.md');
    fs.outputFileSync(prdPath, `### Epic 1: One
#### User Story 1: ${longTitle}
**As a** user
**I want** first
**So that** one

### Epic 2: Two
#### User Story 1: ${longTitle}
**As a** user
**I want** second
**So that** two
`);
    const result = runCli(['/breakdown-task', 'docs/features/duplicate-ids-prd.md', 'duplicate-ids'], dir);
    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    const firstStoryDir = path.join(dir, 'docs', 'production', 'duplicate-ids', 'one', `01-${'a'.repeat(50)}`);
    const secondStoryDir = path.join(dir, 'docs', 'production', 'duplicate-ids', 'two', `02-${'a'.repeat(50)}`);
    for (const storyDir of [firstStoryDir, secondStoryDir]) {
      const files = fs.readdirSync(storyDir).sort();
      assert.deepStrictEqual(files, ['design.md', 'prod.md', 'tech.md', 'testing.md']);
      assert.ok(files.every(file => file.length < 100));
    }
  } finally {
    fs.removeSync(dir);
  }
});

test('breakdown collision preflight leaves existing files and config untouched', () => {
  const dir = tmpProject();
  const outputDir = path.join(dir, 'docs', 'production', 'collision-check');
  const existingPath = path.join(outputDir, 'first', '01-same-title', 'prod.md');
  const laterPath = path.join(outputDir, 'second', '02-same-title', 'prod.md');
  try {
    fs.ensureDirSync(path.dirname(existingPath));
    fs.writeFileSync(existingPath, 'user content\n');
    const prdPath = path.join(dir, 'docs', 'features', 'collision-check-prd.md');
    fs.outputFileSync(prdPath, `### Epic 1: First\n#### User Story 1: Same title\n**As a** user\n**I want** first\n**So that** first\n\n### Epic 2: Second\n#### User Story 1: Same title\n**As a** user\n**I want** second\n**So that** second\n`);
    const configPath = path.join(dir, 'sdd.config.json');

    const result = runCli(['/breakdown-task', 'docs/features/collision-check-prd.md', 'collision-check'], dir);

    assert.strictEqual(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout + result.stderr, /already exist/);
    assert.strictEqual(fs.readFileSync(existingPath, 'utf-8'), 'user content\n');
    assert.strictEqual(fs.pathExistsSync(laterPath), false);
    assert.deepStrictEqual(fs.readdirSync(outputDir), ['first']);
    assert.deepStrictEqual(fs.readdirSync(path.dirname(existingPath)), ['prod.md']);
    assert.strictEqual(fs.pathExistsSync(configPath), false);
  } finally {
    fs.removeSync(dir);
  }
});

test('breakdown rejects an unassigned story before config or output writes', () => {
  const dir = tmpProject();
  try {
    const prdPath = path.join(dir, 'docs', 'features', 'unassigned-prd.md');
    fs.outputFileSync(prdPath, `#### User Story 1: Unassigned\n**As a** user\n**I want** x\n**So that** y\n\n**Acceptance Criteria:**\n- [ ] x\n`);
    const beforeConfig = path.join(dir, 'sdd.config.json');

    const result = runCli(['/breakdown-task', 'docs/features/unassigned-prd.md', 'unassigned'], dir);

    assert.strictEqual(result.status, 1, result.stdout);
    assert.match(result.stdout + result.stderr, /not assigned to an Epic|outside an Epic/i);
    assert.strictEqual(fs.pathExistsSync(beforeConfig), false, 'config must not change');
    assert.strictEqual(fs.pathExistsSync(path.join(dir, 'docs', 'production', 'unassigned')), false, 'no output directory must be created');
  } finally {
    fs.removeSync(dir);
  }
});


const PRD_FIXTURE = `# Feature: user-auth

## User Stories

### Epic 1: Accounts
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
  const outputDir = path.join(dir, 'docs', 'production', 'user-auth', 'accounts', '01-register');
    const files = fs.readdirSync(outputDir);
    assert.deepStrictEqual(files.sort(), ['design.md', 'prod.md', 'tech.md', 'testing.md']);
  fs.removeSync(dir);
});

test('breakdown preserves acceptance criterion checkbox state and identifiers in generated docs', () => {
  const dir = tmpProject();
  try {
    const prdPath = path.join(dir, 'docs', 'features', 'account-prd.md');
    fs.outputFileSync(prdPath, `### Epic 1: Account\n#### User Story 1: Profile\n**As a** user\n**I want** a profile\n**So that** I can manage details\n\n**Acceptance Criteria:**\n- [ ] AC-ACCOUNT-01-1 Profile can be viewed\n- [x] AC-ACCOUNT-01-2 Profile can be edited\n\n### Epic 2: Recovery\n`);

    const result = runCli(['/breakdown-task', 'docs/features/account-prd.md', 'account'], dir);
    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    const outputDir = path.join(dir, 'docs', 'production', 'account', 'account', '01-profile');
    for (const name of ['prod.md', 'testing.md']) {
      const content = fs.readFileSync(path.join(outputDir, name), 'utf-8');
      assert.ok(content.includes('- [ ] AC-ACCOUNT-01-1 Profile can be viewed\n- [x] AC-ACCOUNT-01-2 Profile can be edited'), `${name}: ${content}`);
    }
  } finally {
    fs.removeSync(dir);
  }
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