const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { coverage } = require('./coverage');
const { inspectManifest, ManifestError } = require('./manifest');
const { validateFeatureName, assertInside } = require('./utils/file');

function formatStatus(status) {
  const facts = [];
  if (status.edited) facts.push('edited');
  if (status.stale) facts.push(`stale (${status.changedSources.join(', ')})`);
  facts.push(...status.invalid);
  return facts.length ? facts.join('; ') : 'fresh';
}

async function checkContext(projectDir) {
  try {
    const result = await inspectManifest(projectDir);
    const rows = result.tracked.map((status) => ({ path: status.path, status: formatStatus(status), ...status }));
    for (const path of result.untracked) rows.push({ path, status: 'untracked', untracked: true });
    rows.sort((a, b) => a.path.localeCompare(b.path));
    const invalid = rows.some((row) => row.stale || row.invalid?.length || row.untracked);
    return { ok: !invalid, rows, manifest: result.manifest };
  } catch (error) {
    if (error instanceof ManifestError) return { ok: false, rows: [{ path: '.sdd/manifest.json', status: error.code }], error };
    throw error;
  }
}

function section(title, body) {
  return { title, body: body.trim(), text: `## ${title}\n\n${body.trim()}\n` };
}

async function buildContext(projectDir, feature, { budget = 24000, terse = false } = {}) {
  feature = validateFeatureName(feature);
  const checked = await checkContext(projectDir);
  const documents = checked.manifest?.documents.filter((record) => record.feature === feature) || [];
  if (!documents.length) throw new Error(`No tracked documents for feature: ${feature}`);
  const sections = [];
  const report = coverage(projectDir, feature);
  const uncovered = report.missing.map((item) => `- ${item.id} — ${item.document}:${item.line}`).join('\n') || 'None';
  sections.push(section('Acceptance criteria', `Feature: ${feature}\nCoverage: ${report.covered.length}/${report.total} (${report.percent.toFixed(1)}%)\nUncovered criteria:\n${uncovered}`));
  sections.push(section('Feature', `Feature: ${feature}`));
  for (const record of documents.sort((a, b) => a.path.localeCompare(b.path))) {
    const filePath = path.join(projectDir, record.path);
    if (!fs.existsSync(filePath)) continue;
    const body = await fsp.readFile(filePath, 'utf8');
    sections.push(section(`${record.kind}: ${record.path}`, terse ? body.replace(/\n{3,}/g, '\n\n') : body));
  }
  const included = [];
  const omitted = [];
  let length = 0;
  for (const current of sections) {
    if (length + current.text.length > budget) omitted.push(current.title);
    else {
      included.push(current.text);
      length += current.text.length;
    }
  }
  const metadata = { feature, omittedSections: omitted, contextState: checked.rows };
  return { text: `${included.join('\n')}\n## Context Metadata\n\n${JSON.stringify(metadata, null, 2)}\n`, metadata, checked };
}

async function writeContext(projectDir, feature, options) {
  const result = await buildContext(projectDir, feature, options);
  const output = path.join(projectDir, 'docs', 'context', `${feature}.md`);
  assertInside(path.join(projectDir, 'docs', 'context'), output);
  await fsp.mkdir(path.dirname(output), { recursive: true });
  await fsp.writeFile(output, result.text, 'utf8');
  return { ...result, output };
}

module.exports = { checkContext, buildContext, writeContext, formatStatus };
