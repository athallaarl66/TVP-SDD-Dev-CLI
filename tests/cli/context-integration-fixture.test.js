const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { CLI_DIR, INDEX, runCli } = require('./helpers');

const fixture = path.join(CLI_DIR, 'tests/fixtures/context-integration');

function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-integration-'));
  fs.copySync(fixture, root);
  fs.moveSync(path.join(root, 'memory-seed.json'), path.join(root, '.sdd/memory/NOTE-001.json'));
  const before = docsHash(root);
  t.after(() => {
    try { assert.equal(docsHash(root), before, 'source documents changed'); }
    finally { fs.removeSync(root); }
  });
  return root;
}

function docsHash(root) {
  const hash = crypto.createHash('sha256');
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else { hash.update(path.relative(root, file)); hash.update(fs.readFileSync(file)); }
    }
  }
  visit(path.join(root, 'docs'));
  return hash.digest('hex');
}

function run(executable, args, cwd, input) {
  return spawnSync(executable, args, { cwd, input, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });
}

function mcp(cli, root) {
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'fixture', version: '1' } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'sdd_context', arguments: { feature: 'pay' } } }
  ];
  const result = run(process.execPath, [cli, 'mcp'], root, requests.map((r) => JSON.stringify(r)).join('\n') + '\n');
  assert.equal(result.status, 0, result.stderr);
  const replies = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
  assert.equal(replies.length, 2);
  assert.equal(replies[0].result.protocolVersion, '2024-11-05');
  assert.equal(replies[1].result.isError, undefined);
  return JSON.parse(replies[1].result.content[0].text);
}

test('integration fixture: context gate and ignore boundary', (t) => {
  const root = project(t);
  let result = run('git', ['init', '-q'], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(run('git', ['check-ignore', '-q', '.sdd/memory/NOTE-001.json'], root).status, 0);
  assert.equal(run('git', ['check-ignore', '-q', '.sdd/manifest.json'], root).status, 1);
  assert.equal(run('git', ['add', '.sdd/manifest.json', '.sdd/memory'], root).status, 1, 'Git must refuse ignored memory');
  assert.equal(run('git', ['add', '.sdd/manifest.json'], root).status, 0);
  assert.match(run('git', ['ls-files', '.sdd/manifest.json'], root).stdout, /\.sdd\/manifest\.json/);
  assert.equal(run('git', ['ls-files', '.sdd/memory'], root).stdout, '');
  result = runCli(['/context', 'check'], root);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  result = runCli(['/coverage'], root);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const manifestPath = path.join(root, '.sdd/manifest.json');
  const original = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(original);
  manifest.documents.find((doc) => doc.sources.length).sources[0].hash = 'changed';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.notEqual(runCli(['/context', 'check'], root).status, 0, 'stale source must block');
  fs.writeFileSync(manifestPath, '{');
  assert.notEqual(runCli(['/context', 'check'], root).status, 0, 'malformed manifest must block');
  manifest.version = 999;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.notEqual(runCli(['/context', 'check'], root).status, 0, 'unsupported manifest must block');
  fs.removeSync(manifestPath);
  assert.notEqual(runCli(['/context', 'check'], root).status, 0, 'missing manifest must block');
});

test('integration fixture: MCP context and CLI recall use same nested story and local memory', (t) => {
  const root = project(t);
  const context = mcp(INDEX, root);
  assert.match(context.text, /docs\/production\/pay\/checkout\/01-pay\/prod\.md/);
  assert.match(context.text, /AC-PAY-01-1/);
  assert.match(context.text, /Use idempotent payment confirmation/);
  const recall = runCli(['/remember', 'recall', '--feature', 'pay', '--query', 'idempotent'], root);
  assert.equal(recall.status, 0, recall.stderr + recall.stdout);
  assert.deepEqual(JSON.parse(recall.stdout).map((entry) => entry.id), ['NOTE-001']);
});

test('integration fixture: packed CLI checks and serves project context', (t) => {
  const root = project(t);
  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-integration-pack-'));
  t.after(() => {
    const deps = path.join(packDir, 'package/node_modules');
    if (fs.existsSync(deps) && fs.lstatSync(deps).isSymbolicLink()) fs.unlinkSync(deps);
    fs.removeSync(packDir);
  });
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const pack = process.platform === 'win32'
    ? run(process.execPath, [npmCli, 'pack', '--pack-destination', packDir, '--json'], CLI_DIR)
    : run('npm', ['pack', '--pack-destination', packDir, '--json'], CLI_DIR);
  assert.equal(pack.status, 0, pack.stderr);
  const tarball = path.join(packDir, JSON.parse(pack.stdout)[0].filename);
  let untar = run('tar', ['--force-local', '-xzf', tarball, '-C', packDir], packDir);
  if (untar.status !== 0) untar = run('tar', ['-xzf', tarball, '-C', packDir], packDir);
  assert.equal(untar.status, 0, untar.stderr);
  const deps = path.join(packDir, 'package/node_modules');
  try { fs.symlinkSync(path.join(CLI_DIR, 'node_modules'), deps, 'junction'); }
  catch { fs.copySync(path.join(CLI_DIR, 'node_modules'), deps); }
  const cli = path.join(packDir, 'package/index.js');
  const gate = run(process.execPath, [cli, '/context', 'check'], root);
  assert.equal(gate.status, 0, gate.stderr + gate.stdout);
  assert.match(mcp(cli, root).text, /Use idempotent payment confirmation/);
  const recall = run(process.execPath, [cli, '/remember', 'recall', '--feature', 'pay'], root);
  assert.equal(recall.status, 0, recall.stderr + recall.stdout);
  assert.deepEqual(JSON.parse(recall.stdout).map((entry) => entry.id), ['NOTE-001']);
});
