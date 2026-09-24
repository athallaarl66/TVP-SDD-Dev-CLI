const { test } = require('node:test');
const assert = require('node:assert');
const { bumpVersion, updateReadme, updateChangelog } = require('../../scripts/release');

test('bumpVersion: patch, minor, major advance the right segment', () => {
  assert.strictEqual(bumpVersion('1.4.0', 'patch'), '1.4.1');
  assert.strictEqual(bumpVersion('1.4.0', 'minor'), '1.5.0');
  assert.strictEqual(bumpVersion('1.4.0', 'major'), '2.0.0');
  assert.strictEqual(bumpVersion('1.4.9', 'patch'), '1.4.10');
  assert.strictEqual(bumpVersion('2.9.9', 'minor'), '2.10.0');
});

test('bumpVersion: rejects unknown segment', () => {
  assert.throws(() => bumpVersion('1.0.0', 'bogus'), /Invalid segment/);
});

test('updateReadme: updates version line and inserts first history row', () => {
  const readme =
    '**version** · `1.4.0`  \n**last updated** · `2026-09-24`\n\n## version history\n\n| Version | Date | Changes |\n|---------|------|---------|\n| 1.4.0 | 2026-09-24 | Interactive CLI |\n';
  const out = updateReadme(readme, '1.5.0', '2026-10-01');
  assert.match(out, /\*\*version\*\* · `1\.5\.0`/);
  assert.match(out, /\*\*last updated\*\* · `2026-10-01`/);
  const firstRow = out.split('\n').find((l) => l.startsWith('| 1.5.0 |'));
  assert.ok(firstRow, 'new row inserted');
  assert.match(out, /^\| 1\.4\.0 \| 2026-09-24 \| Interactive CLI/m, 'existing row intact');
});

test('updateReadme: idempotent across runs (rows accumulate, existing preserved)', () => {
  const readme =
    '## version history\n\n| Version | Date | Changes |\n|---------|------|---------|\n| 1.4.0 | 2026-09-24 | Release |\n';
  const once = updateReadme(updateReadme(readme, '1.4.1', 'd'), '1.4.2', 'd');
  const rows = once.split('\n').filter((l) => /^\| 1\.4\.\d+ \|/.test(l));
  assert.deepStrictEqual(rows, [
    '| 1.4.2 | d | Release 1.4.2 |',
    '| 1.4.1 | d | Release 1.4.1 |',
    '| 1.4.0 | 2026-09-24 | Release |'
  ]);
});

test('updateChangelog: prepends entry, idempotent across runs', () => {
  const changelog = '# Changelog\n\n## [1.4.0] - 2026-09-24\n\n### Added\n- thing\n';
  const once = updateChangelog(changelog, '1.4.1', 'd');
  const twice = updateChangelog(once, '1.4.2', 'd');
  const headings = twice.split('\n').filter((l) => l.startsWith('## ['));
  assert.deepStrictEqual(headings, ['## [1.4.2] - d', '## [1.4.1] - d', '## [1.4.0] - 2026-09-24']);
  assert.match(twice, /# Changelog\n\n## \[1\.4\.2\]/);
});