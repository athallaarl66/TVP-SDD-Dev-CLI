const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { recordDocument } = require('../../lib/manifest');

const repo = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(path.join(repo, '.github/workflows/ci.yml'), 'utf8');
const job = workflow.match(/^  context-gate:\r?\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/m);
assert.ok(job, 'context-gate job missing');
const commands = [...job[1].matchAll(/^      - name: (Check context|Report acceptance coverage)\r?\n        run: (.+)\r?$/gm)].map((m) => m[2]);
assert.equal(commands.length, 2, 'expected context and coverage workflow steps');

function run(root, command) {
  const result = spawnSync('bash', ['-e', '-c', command], {
    cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_WORKSPACE: repo.replace(/\\/g, '/') }
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, null, result.stderr);
  return result;
}

test('context-gate executes workflow commands against fresh and invalid fixtures', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-workflow-'));
  try {
    const source = path.join(root, 'source.md');
    const doc = path.join(root, 'docs/features/pay-prd.md');
    fs.mkdirSync(path.dirname(doc), { recursive: true });
    fs.writeFileSync(source, 'source\n');
    fs.writeFileSync(doc, '# PRD\n- [ ] AC-PAY-01-1 Payment works\n');
    await recordDocument(root, { kind: 'prd', feature: 'pay', filePath: doc, sourcePaths: [source] });
    const manifest = path.join(root, '.sdd/manifest.json');
    const valid = fs.readFileSync(manifest, 'utf8');
    const fresh = run(root, commands[0]);
    assert.equal(fresh.status, 0, fresh.stdout + fresh.stderr);
    const coverage = run(root, commands[1]);
    assert.equal(coverage.status, 0, coverage.stdout + coverage.stderr);
    assert.match(coverage.stdout, /0\/1 \(0\.0%\)/);
    assert.notEqual(run(root, commands[1].replace('--min 0', '--min 1')).status, 0);

    fs.writeFileSync(source, 'changed\n');
    assert.notEqual(run(root, commands[0]).status, 0, 'stale source must block');
    fs.writeFileSync(source, 'source\n');
    fs.unlinkSync(doc);
    assert.notEqual(run(root, commands[0]).status, 0, 'missing document must block');
    fs.writeFileSync(doc, '# PRD\n- [ ] AC-PAY-01-1 Payment works\n');
    fs.writeFileSync(manifest, '{');
    assert.notEqual(run(root, commands[0]).status, 0, 'malformed manifest must block');
    const unsupported = JSON.parse(valid);
    unsupported.version = 999;
    fs.writeFileSync(manifest, JSON.stringify(unsupported));
    assert.notEqual(run(root, commands[0]).status, 0, 'unsupported manifest must block');
    fs.unlinkSync(manifest);
    assert.notEqual(run(root, commands[0]).status, 0, 'missing manifest must block');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
