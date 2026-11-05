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
