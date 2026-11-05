const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const memory = require('../../lib/memory');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-memory-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('allocates independent IDs and rejects user IDs', async (t) => {
  const root = fixture(t);
  for (const kind of ['ADR', 'REQ', 'NOTE']) {
    assert.equal((await memory.add(root, { kind, content: kind })).id, `${kind}-001`);
  }
  assert.equal((await memory.add(root, { kind: 'ADR', content: 'next' })).id, 'ADR-002');
  await assert.rejects(memory.add(root, { kind: 'ADR', content: 'x', id: 'ADR-999' }), /automatically/);
  await assert.rejects(memory.read(root, '../ADR-001'), /Invalid memory ID/);
});

test('lifecycle preserves entries and exposes no deletion', async (t) => {
  const root = fixture(t);
  const old = await memory.add(root, { kind: 'ADR', content: 'old' });
  assert.equal(old.status, 'draft');
  assert.equal((await memory.confirm(root, old.id)).status, 'confirmed');
  const { replacement } = await memory.supersede(root, old.id, { content: 'new' });
  assert.equal(replacement.id, 'ADR-002');
  assert.equal(replacement.status, 'draft');
  assert.equal((await memory.read(root, old.id)).supersededBy, replacement.id);
  assert.equal((await memory.read(root, old.id)).status, 'superseded');
  assert.equal((await memory.list(root)).length, 2);
  assert.equal(fs.readdirSync(path.join(root, '.sdd/memory')).length, 2);
  assert.equal(memory.delete, undefined);
  await assert.rejects(memory.confirm(root, old.id), /draft/);
  await assert.rejects(memory.supersede(root, replacement.id, { id: 'ADR-900', content: 'x' }), /automatically/);
});

test('references are separate from memory target and determine staleness', async (t) => {
  const root = fixture(t);
  const ref = path.join(root, 'source.md');
  fs.writeFileSync(ref, 'source');
  for (const invalid of ['../outside', 'a/../source.md', ref, 'missing.md', 'C:\\outside']) {
    await assert.rejects(memory.add(root, { kind: 'NOTE', content: 'x', refs: [invalid] }));
  }
  const draft = await memory.add(root, { kind: 'NOTE', content: 'x', refs: ['source.md'] });
  await memory.confirm(root, draft.id);
  assert.equal((await memory.read(root, draft.id)).status, 'confirmed');
  const future = new Date(Date.now() + 60000);
  fs.utimesSync(ref, future, future);
  assert.equal((await memory.read(root, draft.id)).status, 'stale');
  fs.unlinkSync(ref);
  assert.equal((await memory.read(root, draft.id)).status, 'stale');
});

test('rejects escaping reference and memory directory links', async (t) => {
  const root = fixture(t);
  const outside = fixture(t);
  fs.writeFileSync(path.join(outside, 'secret.md'), 'secret');
  try { fs.symlinkSync(outside, path.join(root, 'link'), 'junction'); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) return t.skip(`symlinks unavailable: ${error.code}`); throw error; }
  await assert.rejects(memory.add(root, { kind: 'ADR', content: 'x', refs: ['link/secret.md'] }), /outside/);
  fs.mkdirSync(path.join(root, '.sdd'));
  fs.symlinkSync(outside, path.join(root, '.sdd', 'memory'), 'junction');
  await assert.rejects(memory.add(root, { kind: 'ADR', content: 'x' }), /outside/);
  assert.deepEqual(fs.readdirSync(outside), ['secret.md']);
});
