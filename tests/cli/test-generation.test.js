const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { generatePlaywrightScript, generateUnitTestScript, identifier } = require('../../lib/utils/template');
const { runCli, tmpProject } = require('./helpers');

// Hostile specification text: quotes, comment terminators, PHP closing tag.
const HOSTILE_SPEC = [
  '# Test Specification for user-auth',
  '',
  "## TC01: quotes ' and \" inside",
  '*/ end the block comment early',
  '<?php echo "escaped"; ?>',
  '*/',
  'line with backslash \\ and `backtick`'
].join('\n');

const FRAMEWORKS = ['jest', 'phpunit', 'xunit', 'nunit', 'junit', 'pytest', 'gotest'];

function generate(framework, feature = 'user-auth', spec = HOSTILE_SPEC) {
  return framework === 'playwright'
    ? generatePlaywrightScript(feature, spec)
    : generateUnitTestScript(feature, spec, framework);
}

const FALSE_PASS_ASSERTIONS = [
  'expect(true).toBe(true)',
  'assert True',
  'Assert.True(true)',
  'assertTrue(true)',
  'Assert.That(true, Is.True)',
  'if !true'
];

test('generated sources carry every spec line as a line comment', () => {
  for (const framework of [...FRAMEWORKS, 'playwright']) {
    const source = generate(framework);
    // PHP neutralises its closing tag inside comments, so expectations differ.
    const marker = framework === 'pytest' ? '#' : '//';
    const expected = (line) => (framework === 'phpunit' ? line.replace(/\?>/g, '? >') : line);
    for (const line of HOSTILE_SPEC.split('\n')) {
      if (line.trim() === '') continue;
      assert.ok(
        source.includes(`${marker} ${expected(line)}`),
        `${framework}: spec line not emitted as a comment: ${JSON.stringify(line)}`
      );
    }
    // No raw block comment wrapper remains around specification text.
    assert.ok(!/^\/\*$/m.test(source), `${framework}: block comment wrapper still present`);
  }
});

test('PHP output never contains a closing tag', () => {
  const source = generate('phpunit');
  assert.strictEqual(source.includes('?>'), false, 'PHP closing tag would end PHP mode');
  assert.ok(source.includes('<?php'), 'PHP opening tag expected');
});

test('placeholder tests are skipped or disabled, never silently passing', () => {
  const markers = {
    jest: 'test.skip(',
    playwright: 'test.skip(',
    phpunit: 'markTestSkipped(',
    xunit: '[Fact(Skip =',
    nunit: '[Ignore(',
    junit: '@Disabled(',
    pytest: 'pytest.skip(',
    gotest: 't.Skip('
  };
  for (const [framework, marker] of Object.entries(markers)) {
    const source = generate(framework);
    assert.ok(source.includes(marker), `${framework}: missing skip marker ${marker}`);
    for (const stale of FALSE_PASS_ASSERTIONS) {
      assert.ok(!source.includes(stale), `${framework}: still contains false-pass assertion ${stale}`);
    }
    assert.ok(source.includes('AUTO-GENERATED PLACEHOLDER'), `${framework}: missing placeholder warning`);
  }
});

test('unknown framework is rejected instead of falling back to jest', () => {
  assert.throws(() => generateUnitTestScript('user-auth', 'x', 'mocha'), /Unsupported test framework/);
});

test('identifiers are stripped to safe characters', () => {
  assert.strictEqual(identifier('user-auth'), 'UserAuth');
  assert.strictEqual(identifier('a"; drop table --'), 'ADropTable');
});

test('generated Jest source parses as JavaScript', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gen-'));
  const file = path.join(dir, 'user-auth.test.mjs');
  fs.writeFileSync(file, generate('jest'));
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf-8' });
  fs.removeSync(dir);
  if (result.error) {
    t.skip(`node --check unavailable: ${result.error.message}`);
    return;
  }
  assert.strictEqual(result.status, 0, result.stderr);
});

test('generated pytest source parses as Python', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gen-'));
  const file = path.join(dir, 'test_user_auth.py');
  fs.writeFileSync(file, generate('pytest'));
  const python = process.env.PYTHON || 'python';
  const result = spawnSync(
    python,
    ['-c', 'import ast,sys; ast.parse(open(sys.argv[1]).read())', file],
    { encoding: 'utf-8' }
  );
  fs.removeSync(dir);
  if (result.error || result.status === 9009) {
    t.skip('python not available');
    return;
  }
  assert.strictEqual(result.status, 0, result.stderr);
});

test('qa-test-script writes a skipped placeholder from a hostile testing file', () => {
  const dir = tmpProject();
  fs.outputFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'jsapp' }));
  fs.outputFileSync(
    path.join(dir, 'docs', 'production', 'user-auth', 'user-auth-01-login-testing.md'),
    HOSTILE_SPEC
  );

  const { status, stdout } = runCli(['--yes', '/qa-test-script', 'user-auth'], dir);
  assert.strictEqual(status, 0, stdout);

  const generated = fs.readFileSync(path.join(dir, 'tests', 'user-auth.test.ts'), 'utf-8');
  assert.ok(generated.includes('test.skip('), 'placeholder must be skipped');
  assert.ok(generated.includes('// */ end the block comment early'));

  const checkPath = path.join(dir, 'generated-check.mjs');
  fs.writeFileSync(checkPath, generated);
  const check = spawnSync(process.execPath, ['--check', checkPath], { encoding: 'utf-8' });
  assert.strictEqual(check.status, 0, check.stderr);
  fs.removeSync(dir);
});

test('implement-code keeps scenario files from another feature out of the brief', () => {
  const dir = tmpProject();
  const seed = (feature, slug, story) => {
    const base = path.join(dir, 'docs', 'production', feature);
    fs.outputFileSync(path.join(base, `${feature}-01-${slug}-prod.md`), `## User Story\n\n**As a** ${story}\n\n---\n\n## Acceptance Criteria\n\n- [ ] x\n`);
    fs.outputFileSync(path.join(base, `${feature}-01-${slug}-tech.md`), '# tech\n');
    fs.outputFileSync(path.join(base, `${feature}-01-${slug}-design.md`), '# design\n');
    fs.outputFileSync(path.join(base, `${feature}-01-${slug}-testing.md`), '# testing\n');
  };
  seed('user-auth', 'register', 'recruiter');
  seed('billing', 'invoice', 'accountant');

  const { status, stdout } = runCli(['/implement-code', '01', 'user-auth'], dir);
  assert.strictEqual(status, 0, stdout);

  const brief = fs.readFileSync(
    path.join(dir, 'docs', 'production', 'user-auth', 'user-auth-01-register-implement.md'),
    'utf-8'
  );
  assert.ok(brief.includes('user-auth-01-register-prod.md'));
  assert.ok(!brief.includes('billing'), 'brief leaked another feature');
  assert.ok(brief.includes('**As a** recruiter'), 'User Story section is empty');
  fs.removeSync(dir);
});

test('implement-code resolves a slug that shares its number with another slug', () => {
  const dir = tmpProject();
  const base = path.join(dir, 'docs', 'production', 'user-auth');
  // Same feature, same scenario number, two slugs: only the prod-bearing slug counts.
  fs.outputFileSync(path.join(base, 'user-auth-01-zzz-prod.md'), '## User Story\n\n**As a** ghost\n');
  fs.outputFileSync(path.join(base, 'user-auth-01-register-prod.md'), '## User Story\n\n**As a** recruiter\n');
  fs.outputFileSync(path.join(base, 'user-auth-01-register-tech.md'), '# tech\n');

  const { status, stdout } = runCli(['/implement-code', '01', 'user-auth'], dir);
  assert.strictEqual(status, 0, stdout);

  const files = fs.readdirSync(base);
  const briefName = files.find((f) => f.endsWith('-implement.md'));
  assert.strictEqual(briefName, 'user-auth-01-register-implement.md');
  const brief = fs.readFileSync(path.join(base, briefName), 'utf-8');
  assert.ok(brief.includes('recruiter'));
  assert.ok(!brief.includes('ghost'));
  fs.removeSync(dir);
});

test('shell metacharacters in a feature name are rejected, not executed', () => {
  const dir = tmpProject();
  const marker = `sdd-pwned-${Date.now()}`;
  fs.outputFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'jsapp' }));

  const { status, stdout, stderr } = runCli(['--yes', '/qa-test-script', `x; touch ${marker}`], dir);
  assert.strictEqual(status, 1, stdout);
  assert.match(stdout + stderr, /Invalid feature name/);
  assert.strictEqual(fs.pathExistsSync(path.join(dir, marker)), false, 'metacharacters executed');
  fs.removeSync(dir);
});
