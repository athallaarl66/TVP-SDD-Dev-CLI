const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const { runCli, tmpProject } = require('./helpers');

function criteria(content) {
  return [...content.matchAll(/^\s*-\s*\[[ xX]\]\s*(AC-[A-Z0-9]+-\d+-\d+)\s+(.+)$/gm)]
    .map((match) => ({ id: match[1], text: match[2] }));
}

test('/prd assigns sequential criterion IDs per story', () => {
  const project = tmpProject();
  try {
    const result = runCli(['--yes', '/prd', 'sample'], project);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const prd = fs.readFileSync(path.join(project, 'docs/features/sample-prd.md'), 'utf8');
    const found = criteria(prd);
    assert.ok(found.length >= 6);
    assert.deepEqual(found.slice(0, 3).map(({ id }) => id), [
      'AC-SAMPLE-1-1', 'AC-SAMPLE-1-2', 'AC-SAMPLE-1-3'
    ]);
    assert.deepEqual(found.slice(3, 6).map(({ id }) => id), [
      'AC-SAMPLE-2-1', 'AC-SAMPLE-2-2', 'AC-SAMPLE-2-3'
    ]);
  } finally {
    fs.removeSync(project);
  }
});

test('/prd --force preserves existing criterion IDs by story and position', () => {
  const project = tmpProject();
  try {
    assert.equal(runCli(['--yes', '/prd', 'sample'], project).status, 0);
    const prdPath = path.join(project, 'docs/features/sample-prd.md');
    let prd = fs.readFileSync(prdPath, 'utf8');
    const ids = criteria(prd).slice(0, 3).map(({ id }) => id);
    prd = prd.replace(ids[0], 'AC-SAMPLE-TEMP-99-99')
      .replace(ids[1], ids[0])
      .replace(ids[2], ids[1])
      .replace('AC-SAMPLE-TEMP-99-99', ids[2]);
    fs.writeFileSync(prdPath, prd);

    const regenerated = runCli(['--yes', '--force', '/prd', 'sample'], project);
    assert.equal(regenerated.status, 0, regenerated.stderr || regenerated.stdout);
    const output = criteria(fs.readFileSync(prdPath, 'utf8'));
    assert.deepEqual(output.slice(0, 3).map(({ id }) => id), [ids[2], ids[0], ids[1]]);
  } finally {
    fs.removeSync(project);
  }
});
