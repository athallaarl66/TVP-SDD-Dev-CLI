const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { recordDocument } = require('../../lib/manifest');
const { buildContext, checkContext, writeContext } = require('../../lib/context');
const { runCli } = require('./helpers');
const memory = require('../../lib/memory');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-context-'));
  return { root, cleanup: () => fs.removeSync(root) };
}

test('context discovers nested production records deterministically and prioritizes uncovered criteria', async () => {
  const data = fixture();
  try {
    const prd = path.join(data.root, 'docs/features/pay-prd.md');
    const prod = path.join(data.root, 'docs/production/pay/payments/01-check/prod.md');
    const testing = path.join(data.root, 'docs/production/pay/payments/01-check/testing.md');
    fs.outputFileSync(prd, '# PRD\n');
    fs.outputFileSync(prod, '# Story\n');
    fs.outputFileSync(testing, '- [ ] AC-PAY-01-1 Payment works\n');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: prd });
    await recordDocument(data.root, { kind: 'production', feature: 'pay', filePath: testing, sourcePaths: [prd] });
    await recordDocument(data.root, { kind: 'production', feature: 'pay', filePath: prod, sourcePaths: [prd] });
    const first = await buildContext(data.root, 'pay');
    const second = await buildContext(data.root, 'pay');
    assert.equal(first.text, second.text);
    assert.ok(first.text.indexOf('## Acceptance criteria') < first.text.indexOf('## production:'));
    assert.ok(first.text.includes('AC-PAY-01-1'));
    assert.ok(first.text.includes('docs/production/pay/payments/01-check/prod.md'));
  } finally {
    data.cleanup();
  }
});

test('context check fails stale/missing/untracked state but reports edits independently', async () => {
  const data = fixture();
  try {
    const source = path.join(data.root, 'docs/features/source.md');
    const doc = path.join(data.root, 'docs/features/pay-prd.md');
    fs.outputFileSync(source, 'source\n');
    fs.outputFileSync(doc, 'doc\n');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: doc, sourcePaths: [source] });
    fs.outputFileSync(source, 'changed\n');
    fs.outputFileSync(doc, 'edited\n');
    const cli = runCli(['/context', 'check'], data.root);
    assert.equal(cli.status, 1);
    assert.match(cli.stdout, /stale/);
    const result = await checkContext(data.root);
    assert.equal(result.ok, false);
    assert.equal(result.rows[0].edited, true);
    assert.equal(result.rows[0].stale, true);
    fs.outputFileSync(path.join(data.root, 'docs/features/other-design.md'), 'untracked\n');
    assert.ok((await checkContext(data.root)).rows.some((row) => row.status === 'untracked'));
  } finally {
    data.cleanup();
  }
});

test('context build rejects invalid feature and unknown selection without source writes', async () => {
  const data = fixture();
  try {
    await assert.rejects(writeContext(data.root, '../escape'), /Invalid feature name/);
    await assert.rejects(writeContext(data.root, 'missing'), /No tracked documents/);
    assert.equal(fs.existsSync(path.join(data.root, 'docs/context')), false);
    const sourcePath = path.join(data.root, 'docs/features/pay-prd.md');
    fs.outputFileSync(sourcePath, 'content\n');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: sourcePath });
    const sourceBefore = fs.readFileSync(sourcePath, 'utf8');
    const generated = runCli(['/context', 'build', 'pay'], data.root);
    assert.equal(generated.status, 0, generated.stderr || generated.stdout);
    assert.ok(fs.existsSync(path.join(data.root, 'docs/context/pay.md')));
    assert.equal(fs.readFileSync(sourcePath, 'utf8'), sourceBefore);
  } finally {
    data.cleanup();
  }
});

test('context includes only current relevant confirmed memory in stable order', async () => {
  const data = fixture();
  try {
    const doc = path.join(data.root, 'docs/features/pay-prd.md');
    fs.outputFileSync(doc, '# PRD\n');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: doc });
    const add = (content, options = {}) => memory.add(data.root, { kind: 'NOTE', content, ...options });
    const project = await add('Project-wide decision');
    const feature = await add('Pay decision', { feature: 'pay' });
    const other = await add('Other feature decision', { feature: 'other' });
    await add('Draft decision', { feature: 'pay' });
    const obsolete = await add('Superseded decision', { feature: 'pay' });
    const ref = path.join(data.root, 'reference.md');
    fs.writeFileSync(ref, 'reference');
    const stale = await add('Stale decision', { feature: 'pay', refs: ['reference.md'] });
    for (const entry of [project, feature, other, obsolete, stale]) await memory.confirm(data.root, entry.id);
    await memory.supersede(data.root, obsolete.id, { content: 'Replacement draft' });
    fs.utimesSync(ref, new Date(Date.now() + 10000), new Date(Date.now() + 10000));
    const first = await buildContext(data.root, 'pay', { terse: true });
    assert.equal(first.text, (await buildContext(data.root, 'pay', { terse: true })).text);
    assert.match(first.text, /Project-wide decision/);
    assert.match(first.text, /Pay decision/);
    assert.ok(first.text.indexOf(project.id) < first.text.indexOf(feature.id));
    for (const excluded of ['Other feature decision', 'Draft decision', 'Superseded decision', 'Stale decision', 'Replacement draft']) {
      assert.ok(!first.text.includes(excluded), excluded);
    }
  } finally {
    data.cleanup();
  }
});

test('context omits entire memory section when budget is insufficient', async () => {
  const data = fixture();
  try {
    const doc = path.join(data.root, 'docs/features/pay-prd.md');
    fs.outputFileSync(doc, '# PRD\n');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: doc });
    const entry = await memory.add(data.root, { kind: 'ADR', content: 'Memory content '.repeat(100), feature: 'pay' });
    await memory.confirm(data.root, entry.id);
    const result = await buildContext(data.root, 'pay', { budget: 300, terse: true });
    assert.ok(result.metadata.omittedSections.includes('Memory'));
    assert.doesNotMatch(result.text, /Memory content|## Memory/);
    assert.match(result.text, /"Memory"/);
  } finally {
    data.cleanup();
  }
});

test('context budget omits whole sections and returns deterministic omission metadata', async () => {
  const data = fixture();
  try {
    const doc = path.join(data.root, 'docs/features/pay-prd.md');
    fs.outputFileSync(doc, `${'Long content with AC-PAY-01-1. '.repeat(20)}\n`);
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: doc });
    const result = await buildContext(data.root, 'pay', { budget: 90, terse: true });
    assert.ok(result.metadata.omittedSections.length > 0);
    assert.match(result.text, /"omittedSections"/);
    assert.ok(!result.text.includes('Long content with AC-PAY-01-1. '.repeat(2)));
  } finally {
    data.cleanup();
  }
});
