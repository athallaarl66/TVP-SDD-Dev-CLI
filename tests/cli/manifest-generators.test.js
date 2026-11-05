const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('fs-extra');
const { runCli, tmpProject } = require('./helpers');

function manifestDocuments(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.sdd', 'manifest.json'), 'utf8')).documents;
}

test('technical and feature-design generators record feature documents without external template sources', () => {
  const dir = tmpProject();
  try {
    for (const command of ['/technical', '/feature-design']) {
      const result = runCli(['--yes', command, 'checkout'], dir);
      assert.equal(result.status, 0, result.stderr || result.stdout);
    }

    const documents = manifestDocuments(dir);
    assert.deepEqual(documents.map(({ kind, feature, path: filePath, sources }) => ({ kind, feature, path: filePath, sources })), [
      { kind: 'feature-design', feature: 'checkout', path: 'docs/features/checkout-design.md', sources: [] },
      { kind: 'technical', feature: 'checkout', path: 'docs/features/checkout-technical.md', sources: [] }
    ]);
  } finally {
    fs.removeSync(dir);
  }
});

test('breakdown records every Epic-nested production document against repository-relative PRD source', () => {
  const dir = tmpProject();
  try {
    fs.outputFileSync(path.join(dir, 'docs', 'features', 'checkout-prd.md'), `### Epic 1: Payments\n#### User Story 1: Pay\n**As a** shopper\n**I want** to pay\n**So that** I can finish checkout\n`);

    const result = runCli(['/breakdown-task', 'docs/features/checkout-prd.md', 'checkout'], dir);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const documents = manifestDocuments(dir)
      .map(({ kind, feature, path: filePath, sources }) => ({ kind, feature, path: filePath, sources: sources.map(({ path: sourcePath }) => sourcePath) }));
    const expected = [
      { kind: 'production', feature: 'checkout', path: 'docs/production/checkout/payments/01-pay/design.md', sources: ['docs/features/checkout-prd.md'] },
      { kind: 'production', feature: 'checkout', path: 'docs/production/checkout/payments/01-pay/prod.md', sources: ['docs/features/checkout-prd.md'] },
      { kind: 'production', feature: 'checkout', path: 'docs/production/checkout/payments/01-pay/tech.md', sources: ['docs/features/checkout-prd.md'] },
      { kind: 'production', feature: 'checkout', path: 'docs/production/checkout/payments/01-pay/testing.md', sources: ['docs/features/checkout-prd.md'] }
    ];
    assert.deepEqual(documents, expected);

    const qa = runCli(['--yes', '/qa-test-script', 'checkout'], dir);
    assert.equal(qa.status, 0, qa.stderr || qa.stdout);
    assert.ok(fs.existsSync(path.join(dir, 'tests', 'checkout.spec.ts')));
    assert.deepEqual(manifestDocuments(dir).map(({ kind, path: filePath }) => ({ kind, path: filePath })), expected.map(({ kind, path: filePath }) => ({ kind, path: filePath })));
    assert.equal(manifestDocuments(dir).some(({ kind }) => kind === 'qa-testing'), false);
  } finally {
    fs.removeSync(dir);
  }
});

test('breakdown omits source when PRD is outside project', () => {
  const dir = tmpProject();
  const externalDir = tmpProject();
  try {
    const prdPath = path.join(externalDir, 'checkout-prd.md');
    fs.outputFileSync(prdPath, `### Epic 1: Payments\n#### User Story 1: Pay\n**As a** shopper\n**I want** to pay\n**So that** I can finish checkout\n`);

    const result = runCli(['/breakdown-task', prdPath, 'checkout'], dir);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(manifestDocuments(dir).map(({ sources }) => sources), [[], [], [], []]);
  } finally {
    fs.removeSync(dir);
    fs.removeSync(externalDir);
  }
});
