const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCli } = require('./helpers');
const { collectIds, collectMentions, coverage } = require('../../lib/coverage');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-coverage-'));
  const write = (file, content) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    return target;
  };
  return { root, write, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('collectIds finds criteria in nested Epic/story documents with source locations', () => {
  const data = fixture();
  try {
    data.write('docs/production/billing/checkout/01-pay/testing.md', '- [ ] AC-BILLING-01-1 Payment is accepted\n');
    const [criterion] = collectIds(path.join(data.root, 'docs'));
    assert.deepEqual(criterion, {
      id: 'AC-BILLING-01-1',
      document: 'production/billing/checkout/01-pay/testing.md',
      line: 1,
      text: 'AC-BILLING-01-1 Payment is accepted',
      checked: false
    });
    assert.equal(coverage(data.root).missing[0].text, 'AC-BILLING-01-1 Payment is accepted');
    assert.equal(coverage(data.root).missing[0].checked, false);
  } finally {
    data.cleanup();
  }
});

test('nested criterion is covered by an executable test reference', () => {
  const data = fixture();
  try {
    data.write('docs/production/billing/checkout/01-pay/testing.md', '- [ ] AC-BILLING-01-1 Payment is accepted\n');
    data.write('tests/checkout/payment.test.js', "test('payment', () => expect('AC-BILLING-01-1').toBeTruthy());\n");
    const report = coverage(data.root);
    assert.equal(report.total, 1);
    assert.equal(report.covered.length, 1);
    assert.equal(report.covered[0].document, 'docs/production/billing/checkout/01-pay/testing.md');
    assert.equal(report.covered[0].file, 'tests/checkout/payment.test.js');
    assert.equal(report.covered[0].testLine, 1);
    assert.equal(report.covered[0].text, 'AC-BILLING-01-1 Payment is accepted');
    assert.equal(report.covered[0].checked, false);
    assert.equal(report.percent, 100);
  } finally {
    data.cleanup();
  }
});

test('comment-only references are referenced-only and do not count as coverage', () => {
  const data = fixture();
  try {
    data.write('docs/production/billing/checkout/01-pay/testing.md', '- [ ] AC-BILLING-01-1 Payment is accepted\n');
    data.write('tests/checkout/payment.test.js', '// AC-BILLING-01-1 TODO\n');
    const report = coverage(data.root);
    assert.equal(report.referencedOnly.length, 1);
    assert.equal(report.percent, 0);
    assert.equal(report.covered.length, 0);
  } finally {
    data.cleanup();
  }
});

test('missing criteria retain nested originating document and line', () => {
  const data = fixture();
  try {
    data.write('docs/production/billing/checkout/01-pay/testing.md', '\n- [x] AC-BILLING-01-2 Refund is supported\n');
    const report = coverage(data.root);
    assert.deepEqual(report.missing, [{
      id: 'AC-BILLING-01-2',
      document: 'docs/production/billing/checkout/01-pay/testing.md',
      line: 2,
      text: 'AC-BILLING-01-2 Refund is supported',
      checked: true
    }]);
  } finally {
    data.cleanup();
  }
});

test('collectMentions discovers nested test files and preserves code/comment classification', () => {
  const data = fixture();
  try {
    data.write('tests/epic/story/payment_test.go', '// AC-BILLING-01-1 note\nfunc TestPayment() { check("AC-BILLING-01-2") }\n');
    const mentions = collectMentions(path.join(data.root, 'tests'));
    assert.deepEqual(mentions.map(({ id, file, line, comment }) => ({ id, file, line, comment })), [
      { id: 'AC-BILLING-01-1', file: 'epic/story/payment_test.go', line: 1, comment: true },
      { id: 'AC-BILLING-01-2', file: 'epic/story/payment_test.go', line: 2, comment: false }
    ]);
  } finally {
    data.cleanup();
  }
});

test('generated PRD criteria remain linked through nested breakdown into coverage', () => {
  const project = fixture();
  try {
    const generated = runCli(['--yes', '/prd', 'sample'], project.root);
    assert.equal(generated.status, 0, generated.stderr || generated.stdout);
    const breakdown = runCli(['/breakdown-task', 'docs/features/sample-prd.md', 'sample'], project.root);
    assert.equal(breakdown.status, 0, breakdown.stderr || breakdown.stdout);
    const storyFile = path.join(project.root, 'docs/production/sample/epic-title/01-story-title/testing.md');
    assert.ok(fs.readFileSync(storyFile, 'utf8').includes('AC-SAMPLE-1-1'));
    fs.rmSync(path.join(project.root, 'docs/features/sample-prd.md'));
    const report = coverage(project.root);
    assert.equal(report.total, 6);
    assert.equal(report.missing.length, 6);
    assert.ok(report.missing.every((item) => item.document.startsWith('docs/production/sample/')));
    assert.ok(report.missing.every((item) => item.text.includes(item.id)));
  } finally {
    project.cleanup();
  }
});

test('/coverage CLI JSON includes nested criterion references and honors --min', () => {
  const project = fixture();
  try {
    project.write('docs/production/billing/checkout/01-pay/testing.md', '- [ ] AC-BILLING-01-1 Payment is accepted\n- [ ] AC-BILLING-01-2 Refund is supported\n');
    project.write('tests/checkout/payment.test.js', "assert('AC-BILLING-01-1');\n");
    const result = runCli(['/coverage', '--json'], project.root);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(report).sort(), ['covered', 'missing', 'percent', 'referencedOnly', 'total']);
    assert.equal(report.total, 2);
    assert.equal(report.percent, 50);
    assert.equal(report.covered[0].document, 'docs/production/billing/checkout/01-pay/testing.md');
    const belowThreshold = runCli(['/coverage', '--min', '80'], project.root);
    assert.equal(belowThreshold.status, 1);
    const reportOnly = runCli(['/coverage'], project.root);
    assert.equal(reportOnly.status, 0);
    const invalidThreshold = runCli(['/coverage', '--min', '-1'], project.root);
    assert.equal(invalidThreshold.status, 1);
  } finally {
    project.cleanup();
  }
});

test('/coverage --backfill fills partial IDs and leaves complete documents unchanged', () => {
  const project = fixture();
  try {
    const prdPath = project.write('docs/features/billing-prd.md', [
      '### Epic 1: Payments',
      '#### User Story 1: Checkout',
      '**Acceptance Criteria:**',
      '- [ ] AC-BILLING-1-7 Payment accepted',
      '- [x] Receipt generated',
      ''
    ].join('\n'));
    const completePrd = project.write('docs/features/complete-prd.md', [
      '#### User Story 4: Existing',
      '**Acceptance Criteria:**',
      '- [ ] AC-COMPLETE-4-2 Existing criterion',
      ''
    ].join('\n'));
    const completeBefore = fs.readFileSync(completePrd, 'utf8');
    const first = runCli(['/coverage', '--backfill'], project.root);
    assert.equal(first.status, 0, first.stderr);
    const updated = fs.readFileSync(prdPath, 'utf8');
    assert.match(updated, /AC-BILLING-1-7 Payment accepted/);
    assert.match(updated, /AC-BILLING-1-2 Receipt generated/);
    assert.equal(fs.readFileSync(completePrd, 'utf8'), completeBefore);
    const second = runCli(['/coverage', 'billing', '--backfill'], project.root);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(fs.readFileSync(prdPath, 'utf8'), updated);
  } finally {
    project.cleanup();
  }
});

test('empty docs and tests return a stable zero coverage report and CLI hint', () => {
  const data = fixture();
  try {
    assert.deepEqual(coverage(data.root), {
      total: 0,
      covered: [],
      referencedOnly: [],
      missing: [],
      percent: 0
    });
    const result = runCli(['/coverage'], data.root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /No acceptance-criteria IDs found/);
    assert.match(result.stdout, /--backfill/);
  } finally {
    data.cleanup();
  }
});
