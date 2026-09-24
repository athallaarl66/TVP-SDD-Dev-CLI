#!/usr/bin/env node

// Release helper: bump version in package.json, README, and CHANGELOG together.
// Usage: node scripts/release.js <patch|minor|major>

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const README_PATH = path.join(ROOT, 'README.md');
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md');

const SEGMENTS = { patch: 2, minor: 1, major: 0 };

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

function release(segment, root = ROOT) {
  const pkgPath = path.join(root, 'package.json');
  const readmePath = path.join(root, 'README.md');
  const changelogPath = path.join(root, 'CHANGELOG.md');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const version = bumpVersion(pkg.version, segment);
  const date = today();

  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync(readmePath, updateReadme(fs.readFileSync(readmePath, 'utf-8'), version, date));
  fs.writeFileSync(changelogPath, updateChangelog(fs.readFileSync(changelogPath, 'utf-8'), version, date));

  console.log(`Released ${version}. Files updated: package.json, README.md, CHANGELOG.md`);
  return version;
}

if (require.main === module) {
  const segment = process.argv[2];
  if (!segment) {
    console.error('Usage: node scripts/release.js <patch|minor|major>');
    process.exit(1);
  }
  try {
    release(segment);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { release, bumpVersion, updateReadme, updateChangelog, today };