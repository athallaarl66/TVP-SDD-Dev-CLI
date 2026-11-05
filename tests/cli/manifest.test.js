const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const {
  ManifestError, readManifest, writeManifest, recordDocument, inspectManifest
} = require('../../lib/manifest');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-manifest-'));
  return { root, cleanup: () => fs.removeSync(root) };
}

test('manifest round-trip is deterministic, versioned, and hashes documents and sources', async () => {
  const data = fixture();
  try {
    fs.outputFileSync(path.join(data.root, 'docs/features/pay-prd.md'), '# PRD\n');
    fs.outputFileSync(path.join(data.root, 'docs/features/pay-source.md'), '# Source\n');
    await recordDocument(data.root, {
      kind: 'prd', feature: 'pay', filePath: 'docs/features/pay-prd.md', sourcePaths: ['docs/features/pay-source.md']
    });
    const first = await readManifest(data.root);
    await writeManifest(data.root, { documents: [...first.documents].reverse(), version: 1 });
    const second = await readManifest(data.root);
    assert.deepEqual(second, first);
    assert.match(second.documents[0].generatedHash, /^[a-f0-9]{64}$/);
    assert.match(second.documents[0].sources[0].hash, /^[a-f0-9]{64}$/);
  } finally {
    data.cleanup();
  }
});

test('manifest distinguishes missing, malformed, unsupported version, and escaping paths', async () => {
  const data = fixture();
  try {
    await assert.rejects(readManifest(data.root), (error) => error instanceof ManifestError && error.code === 'missing');
    fs.outputFileSync(path.join(data.root, '.sdd/manifest.json'), '{');
    await assert.rejects(readManifest(data.root), (error) => error.code === 'malformed');
    fs.outputFileSync(path.join(data.root, '.sdd/manifest.json'), JSON.stringify({ version: 2, documents: [] }));
    await assert.rejects(readManifest(data.root), (error) => error.code === 'unsupported-version');
    await assert.rejects(writeManifest(data.root, {
      version: 1,
      documents: [{ kind: 'prd', feature: 'x', path: '../outside', sources: [], generatedHash: 'x', generatedAt: 'now' }]
    }), /outside/);
  } finally {
    data.cleanup();
  }
});

test('manifest inspection reports edit and source staleness as independent facts', async () => {
  const data = fixture();
  try {
    const document = path.join(data.root, 'docs/features/pay-prd.md');
    const source = path.join(data.root, 'docs/features/source.md');
    fs.outputFileSync(document, '# generated\n');
    fs.outputFileSync(source, '# source\n');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: document, sourcePaths: [source] });
    const initial = await inspectManifest(data.root);
    assert.equal(initial.tracked[0].stale, false);
    assert.equal(initial.tracked[0].edited, false);
    fs.outputFileSync(source, '# changed source\n');
    fs.outputFileSync(document, '# hand edited\n');
    const changed = await inspectManifest(data.root);
    assert.equal(changed.tracked[0].stale, true);
    assert.equal(changed.tracked[0].edited, true);
  } finally {
    data.cleanup();
  }
});

test('freshness handles clone timestamps, independent edits, missing and untracked documents without Git', async () => {
  const data = fixture();
  try {
    const document = path.join(data.root, 'docs/features/pay-prd.md');
    const source = path.join(data.root, 'docs/features/source.md');
    fs.outputFileSync(document, 'generated');
    fs.outputFileSync(source, 'source');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: document, sourcePaths: [source] });
    const future = new Date(Date.now() + 60000);
    fs.utimesSync(source, future, future);
    let state = (await inspectManifest(data.root)).tracked[0];
    assert.equal(state.stale, false);
    fs.writeFileSync(document, 'edited');
    state = (await inspectManifest(data.root)).tracked[0];
    assert.equal(state.edited, true);
    assert.equal(state.stale, false);
    fs.writeFileSync(source, 'changed');
    fs.utimesSync(source, new Date(0), new Date(0));
    state = (await inspectManifest(data.root)).tracked[0];
    assert.equal(state.stale, true);
    assert.equal(state.edited, true);
    assert.deepEqual(state.changedSources, ['docs/features/source.md']);
    fs.removeSync(document);
    fs.outputFileSync(path.join(data.root, 'docs/features/other-design.md'), 'untracked');
    const result = await inspectManifest(data.root);
    assert.ok(result.tracked[0].invalid.includes('missing-document'));
    assert.deepEqual(result.untracked, ['docs/features/other-design.md']);
  } finally { data.cleanup(); }
});

test('empty source patterns are invalid while documents with no source patterns remain valid', async () => {
  const data = fixture();
  try {
    fs.outputFileSync(path.join(data.root, 'docs/features/pay-prd.md'), 'generated');
    await recordDocument(data.root, { kind: 'prd', feature: 'pay', filePath: 'docs/features/pay-prd.md' });
    let result = await inspectManifest(data.root);
    assert.deepEqual(result.tracked[0].invalid, []);
    const manifest = await readManifest(data.root);
    manifest.documents[0].sourcePatterns = ['docs/missing/*.md'];
    await writeManifest(data.root, manifest);
    result = await inspectManifest(data.root);
    assert.ok(result.tracked[0].invalid.includes('empty-source-pattern:docs/missing/*.md'));
    fs.outputFileSync(path.join(data.root, 'docs/missing/input.md'), 'new source');
    result = await inspectManifest(data.root);
    assert.deepEqual(result.tracked[0].invalid, []);
    assert.equal(result.tracked[0].stale, true);
    assert.deepEqual(result.tracked[0].changedSources, ['docs/missing/input.md']);
  } finally { data.cleanup(); }
});
