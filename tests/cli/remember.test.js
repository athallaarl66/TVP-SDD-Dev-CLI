const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli, tmpProject } = require('./helpers');

test('remember lifecycle, filters, history, and automatic IDs', (t) => {
  const root = tmpProject();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'source.md'), 'source');
  const run = (...args) => {
    const result = runCli(['/remember', ...args], root);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const adr = run('add', '--kind', 'ADR', '--content', 'Alpha database', '--feature', 'shop', '--tag', 'db', '--ref', 'source.md');
  const req = run('add', '--kind', 'REQ', '--content', 'Alpha requirement', '--feature', 'shop', '--tag', 'db');
  assert.equal(adr.id, 'ADR-001');
  assert.equal(req.id, 'REQ-001');
  assert.equal(adr.status, 'draft');
  assert.equal(run('confirm', adr.id).status, 'confirmed');
  const replacement = run('supersede', adr.id, '--content', 'Beta database');
  assert.equal(replacement.old.status, 'superseded');
  assert.equal(replacement.replacement.id, 'ADR-002');
  assert.equal(replacement.replacement.status, 'draft');
  assert.deepEqual(run('history', 'ADR-002').map((entry) => entry.id), ['ADR-001', 'ADR-002']);
  assert.ok(fs.existsSync(path.join(root, '.sdd', 'memory', 'ADR-001.json')));
  assert.deepEqual(run('recall').map((entry) => entry.id), ['ADR-001', 'ADR-002', 'REQ-001']);
  assert.deepEqual(run('recall', '--query', 'alpha', '--feature', 'shop', '--tag', 'db').map((entry) => entry.id), ['ADR-001', 'REQ-001']);
  assert.deepEqual(run('recall', '--kind', 'ADR', '--status', 'draft').map((entry) => entry.id), ['ADR-002']);
  assert.deepEqual(run('recall'), run('recall'));
  const bypass = runCli(['/remember', 'add', '--kind', 'ADR', '--content', 'bad', '--id', 'ADR-100'], root);
  assert.notEqual(bypass.status, 0);
  assert.equal(fs.readdirSync(path.join(root, '.sdd', 'memory')).length, 3);
  assert.notEqual(runCli(['/remember', 'history', 'ADR-999'], root).status, 0);
});
