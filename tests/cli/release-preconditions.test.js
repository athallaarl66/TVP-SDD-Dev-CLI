const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { release, checkPreconditions, REQUIRED_FILES } = require('../../scripts/release');

const README = '**version** · `1.5.0`  \n**last updated** · `2026-01-01`\n\n## version history\n\n| Version | Date | Changes |\n|---------|------|---------|\n| 1.5.0 | 2026-01-01 | Release |\n';
const CHANGELOG = '# Changelog\n\n## [1.5.0] - 2026-01-01\n\n### Added\n- thing\n';

function fixtureRoot({ omit = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-release-'));
  const files = {
    'package.json': JSON.stringify(
      {
        name: 'sdd-dev-cli',
        version: '1.5.0',
        license: 'MIT',
        repository: { type: 'git', url: 'git+https://example.invalid/repo.git' },
        files: ['index.js', 'lib/']
      },
      null,
      2
    ),
    'README.md': README,
    'CHANGELOG.md': CHANGELOG,
    LICENSE: 'MIT License\n',
    'SECURITY.md': '# Security\n'
  };
  for (const rel of REQUIRED_FILES) {
    if (rel.startsWith('docs/')) files[rel] = '# doc\n';
  }
  for (const [rel, content] of Object.entries(files)) {
    if (omit.includes(rel)) continue;
    fs.outputFileSync(path.join(root, rel), content);
  }
  return root;
}

test('release: blocks and writes nothing when evidence is missing', () => {
  const root = fixtureRoot({ omit: ['docs/uat-report.md'] });
  const before = fs.readFileSync(path.join(root, 'package.json'), 'utf-8');

  assert.throws(
    () => release('patch', root, { skipVerify: true }),
    /Release blocked:[\s\S]*docs\/uat-report\.md/
  );

  assert.strictEqual(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'), before);
  assert.strictEqual(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf-8'), CHANGELOG);
  fs.removeSync(root);
});

test('release: blocks when SECURITY.md is missing', () => {
  const root = fixtureRoot({ omit: ['SECURITY.md'] });
  const problems = checkPreconditions(root, { skipVerify: true });
  assert.ok(problems.some((p) => p.includes('SECURITY.md')), problems.join('; '));
  fs.removeSync(root);
});

test('release: blocks when package metadata is incomplete', () => {
  const root = fixtureRoot();
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  delete pkg.files;
  delete pkg.repository;
  pkg.license = 'UNLICENSED';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  const problems = checkPreconditions(root, { skipVerify: true });
  assert.ok(problems.some((p) => p.includes('"files" allowlist')));
  assert.ok(problems.some((p) => p.includes('repository')));
  assert.ok(problems.some((p) => p.includes('license')));
  fs.removeSync(root);
});

test('release: bumps version and appends evidence-verified release rows', () => {
  const root = fixtureRoot();
  const version = release('minor', root, { skipVerify: true });

  assert.strictEqual(version, '1.6.0');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
  assert.strictEqual(pkg.version, '1.6.0');
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf-8'), /\*\*version\*\* · `1\.6\.0`/);
  assert.match(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf-8'), /## \[1\.6\.0\]/);
  fs.removeSync(root);
});

test('release: dry run reports the version without touching files', () => {
  const root = fixtureRoot();
  const before = fs.readFileSync(path.join(root, 'package.json'), 'utf-8');
  const version = release('major', root, { skipVerify: true, dryRun: true });

  assert.strictEqual(version, '2.0.0');
  assert.strictEqual(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'), before);
  fs.removeSync(root);
});

test('release: a failing test gate blocks the release', () => {
  const root = fixtureRoot();
  // No test script in the fixture package.json, so npm test cannot pass.
  const problems = checkPreconditions(root, {});
  assert.ok(problems.some((p) => p.includes('test suite failed')), problems.join('; '));
  fs.removeSync(root);
});
