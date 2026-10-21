#!/usr/bin/env node

// Release helper: verify release preconditions, then bump version in
// package.json, README, and CHANGELOG together.
// Usage: node scripts/release.js <patch|minor|major> [--skip-verify] [--dry-run]

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const SEGMENTS = { patch: 2, minor: 1, major: 0 };

// Documents a public release must carry. Missing evidence blocks the release
// before any file is touched.
const REQUIRED_FILES = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'SECURITY.md',
  'docs/prd.md',
  'docs/technical-design.md',
  'docs/uat-plan.md',
  'docs/uat-report.md',
  'docs/test-report.md',
  'docs/release-checklist.md'
];

function bumpVersion(version, segment) {
  const idx = SEGMENTS[segment];
  if (idx === undefined) {
    throw new Error(`Invalid segment "${segment}". Use patch, minor, or major.`);
  }
  const parts = (version || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[idx] += 1;
  for (let i = idx + 1; i < 3; i++) parts[i] = 0;
  return parts.slice(0, 3).join('.');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Update `**version**`/`**last updated**` and insert a new first row at the
// top of the `## version history` table (right after the separator line).
function updateReadme(readme, version, date) {
  let out = readme
    .replace(/\*\*version\*\* · `[^`]+`/, `**version** · \`${version}\``)
    .replace(/\*\*last updated\*\* · `[^`]+`/, `**last updated** · \`${date}\``);
  const header = out.indexOf('## version history');
  if (header === -1) return out;
  const sepStart = out.indexOf('|---------|', header);
  if (sepStart === -1) return out;
  const eol = out.includes('\r\n') ? '\r\n' : '\n';
  const rowEnd = out.indexOf('\n', sepStart);
  if (rowEnd === -1) return out;
  const newRow = `| ${version} | ${date} | Release ${version} |`;
  return out.slice(0, rowEnd + 1) + newRow + eol + out.slice(rowEnd + 1);
}

// Prepend a `## [<version>] - <date>` entry after the title line, using a
// consistent `title\n\nentry\n\nrest` layout each run.
function updateChangelog(changelog, version, date) {
  const eol = changelog.includes('\r\n') ? '\r\n' : '\n';
  const titleEnd = changelog.indexOf(eol);
  const entry = `## [${version}] - ${date}${eol}${eol}### Changed${eol}- Release ${version} managed via \`npm run release:*\`.${eol}${eol}`;
  if (titleEnd === -1) return entry + changelog;
  const title = changelog.slice(0, titleEnd);
  let rest = changelog.slice(titleEnd + eol.length).replace(/^\r?\n+/, '');
  return title + eol + eol + entry + rest;
}

function gitIsClean(root) {
  // Only judge cleanliness for this checkout, never a parent repo that git
  // would discover by walking up from a temp directory.
  if (!fs.existsSync(path.join(root, '.git'))) return null;
  const result = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf-8' });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim() === '';
}

function runTests(root) {
  const npmCli = process.platform === 'win32'
    ? path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : null;
  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, 'test'], { cwd: root, encoding: 'utf-8' })
    : spawnSync('npm', ['test'], { cwd: root, encoding: 'utf-8' });
  return result.status === 0;
}

// Collect every blocking problem. Nothing is written when the list is non-empty.
function checkPreconditions(root = ROOT, { skipVerify = false, skipGit = false } = {}) {
  const problems = [];

  for (const rel of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, rel))) problems.push(`missing required file: ${rel}`);
  }

  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (!Array.isArray(pkg.files) || pkg.files.length === 0) {
        problems.push('package.json has no "files" allowlist');
      }
      if (pkg.license !== 'MIT') problems.push(`package.json license is "${pkg.license}", expected MIT`);
      if (!pkg.repository) problems.push('package.json has no repository field');
    } catch (error) {
      problems.push(`package.json is not readable JSON: ${error.message}`);
    }
  }

  if (!skipGit) {
    const clean = gitIsClean(root);
    if (clean === false) problems.push('git working tree is not clean');
  }

  if (!skipVerify) {
    if (!runTests(root)) problems.push('test suite failed (run npm test, or pass --skip-verify)');
  }

  return problems;
}

function release(segment, root = ROOT, options = {}) {
  const pkgPath = path.join(root, 'package.json');
  const readmePath = path.join(root, 'README.md');
  const changelogPath = path.join(root, 'CHANGELOG.md');

  // Preconditions first: a failed gate must not change a single file.
  const problems = checkPreconditions(root, options);
  if (problems.length > 0) {
    throw new Error(`Release blocked:\n- ${problems.join('\n- ')}`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const version = bumpVersion(pkg.version, segment);
  const date = today();

  if (options.dryRun) {
    console.log(`Dry run: would release ${version} (no files written)`);
    return version;
  }

  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync(readmePath, updateReadme(fs.readFileSync(readmePath, 'utf-8'), version, date));
  fs.writeFileSync(changelogPath, updateChangelog(fs.readFileSync(changelogPath, 'utf-8'), version, date));

  console.log(`Released ${version}. Files updated: package.json, README.md, CHANGELOG.md`);
  return version;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const segment = args.find((a) => !a.startsWith('--'));
  const options = {
    skipVerify: args.includes('--skip-verify'),
    skipGit: args.includes('--skip-git'),
    dryRun: args.includes('--dry-run')
  };
  if (!segment) {
    console.error('Usage: node scripts/release.js <patch|minor|major> [--skip-verify] [--skip-git] [--dry-run]');
    process.exit(1);
  }
  try {
    release(segment, ROOT, options);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  release,
  checkPreconditions,
  bumpVersion,
  updateReadme,
  updateChangelog,
  today,
  REQUIRED_FILES
};
