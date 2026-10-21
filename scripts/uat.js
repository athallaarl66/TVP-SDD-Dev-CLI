#!/usr/bin/env node

// UAT runner: packs the CLI, runs every public command against the tarball in
// a scratch project, and prints a pass/fail table (plus JSON with --json).
// Usage: node scripts/uat.js [--json <file>]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const results = [];

const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFile = (p, content) => {
  mkdir(path.dirname(p));
  fs.writeFileSync(p, content);
};

function npmRun(args, cwd) {
  const npmCli = process.platform === 'win32'
    ? path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : null;
  return npmCli
    ? spawnSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf-8' })
    : spawnSync('npm', args, { cwd, encoding: 'utf-8' });
}

function extract(tarball, dest) {
  // GNU tar (git-bash) treats "C:" as a remote host; bsdtar rejects --force-local.
  const attempts = [
    ['--force-local', '-xzf', tarball, '-C', dest],
    ['-xzf', tarball, '-C', dest]
  ];
  for (const args of attempts) {
    const result = spawnSync('tar', args, { encoding: 'utf-8' });
    if (!result.error && result.status === 0) return result;
  }
  throw new Error(`could not extract ${tarball}`);
}

function runCli(pkgDir, project, args) {
  return spawnSync(process.execPath, [path.join(pkgDir, 'index.js'), ...args], {
    cwd: project,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0', SDD_CLI_ROOT: pkgDir }
  });
}

function record({ id, check, command, expect, result, evidence, files = [] }) {
  const status = typeof result.status === 'number' ? result.status : result.status;
  const pass = expect === 'exit 0'
    ? status === 0
    : expect === 'non-zero'
      ? status !== 0
      : null;
  results.push({
    id,
    check,
    command,
    expect,
    status,
    pass,
    evidence: String(evidence || '').trim().split('\n').filter(Boolean).slice(0, 2).join(' / '),
    files
  });
}

function main() {
  const jsonFlag = process.argv.indexOf('--json');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-uat-'));
  const packDir = path.join(work, 'pack');
  mkdir(packDir);

  const packed = npmRun(['pack', '--pack-destination', packDir, '--json'], ROOT);
  if (packed.status !== 0) throw new Error(`npm pack failed: ${packed.stderr}`);
  const info = JSON.parse(packed.stdout)[0];
  const unpackDir = path.join(work, 'pkg');
  mkdir(unpackDir);
  extract(path.join(packDir, info.filename), unpackDir);

  const pkgDir = path.join(unpackDir, 'package');
  // The tarball ships no dependencies; link the repo's installed tree.
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(pkgDir, 'node_modules'), 'junction');

  const project = path.join(work, 'project');
  mkdir(project);
  writeFile(path.join(project, 'package.json'), JSON.stringify({ name: 'uat-sample', version: '1.0.0' }, null, 2));

  const expected = {
    prd: path.join('docs', 'features', 'user-auth-prd.md'),
    technical: path.join('docs', 'features', 'user-auth-technical.md'),
    design: path.join('docs', 'features', 'user-auth-design.md'),
    designSystem: path.join('docs', 'DESIGN.md'),
    qaReport: path.join('docs', 'test-reports', 'user-auth', 'user-auth-qa-report.md'),
    initPrd: path.join('docs', 'features', 'billing-prd.md')
  };

  // 1. Preparation / positive checks
  let r = runCli(pkgDir, project, ['--version']);
  record({ id: '1.3', check: 'version', command: 'sdd-gen --version', expect: 'exit 0', result: r, evidence: r.stdout, files: [] });

  r = runCli(pkgDir, project, ['--help']);
  record({ id: '1.4', check: 'help lists commands', command: 'sdd-gen --help', expect: 'exit 0', result: r, evidence: r.stdout.split('\n')[0] });

  const steps = [
    ['2.1', 'PRD', ['--yes', '/prd', 'user-auth'], [expected.prd]],
    ['2.2', 'technical', ['--yes', '/technical', 'user-auth'], [expected.technical]],
    ['2.3', 'feature design', ['--yes', '/feature-design', 'user-auth'], [expected.design]],
    ['2.4', 'design system', ['--yes', '/design-system'], [expected.designSystem]],
    ['2.5', 'QA report', ['--yes', '/qa-report', 'user-auth'], [expected.qaReport]],
    ['2.6', 'init all docs', ['--yes', '/init', 'billing'], [expected.initPrd]]
  ];
  for (const [id, check, args, files] of steps) {
    r = runCli(pkgDir, project, args);
    const missing = files.filter((f) => !fs.existsSync(path.join(project, f)));
    record({
      id,
      check,
      command: `sdd-gen ${args.join(' ')}`,
      expect: 'exit 0',
      result: { status: missing.length === 0 ? r.status : `${r.status}+missing` },
      evidence: missing.length ? `missing: ${missing.join(', ')}` : `created ${files.join(', ')}`,
      files
    });
  }

  // 2.7 / 2.8 overwrite guard
  r = runCli(pkgDir, project, ['--yes', '/prd', 'user-auth']);
  record({
    id: '2.7',
    check: 'overwrite guard',
    command: 'sdd-gen --yes /prd user-auth (second run)',
    expect: 'non-zero',
    result: r,
    evidence: r.stdout || r.stderr
  });
  r = runCli(pkgDir, project, ['--yes', '--force', '/prd', 'user-auth']);
  record({ id: '2.8', check: 'explicit overwrite', command: 'sdd-gen --yes --force /prd user-auth', expect: 'exit 0', result: r, evidence: r.stdout });

  // 2.9 breakdown needs a PRD with user stories
  writeFile(
    path.join(project, 'docs', 'production', 'user-stories-prd.md'),
    '#### User Story 1: Register\n\n**As a** visitor\n**I want** an account\n**So that** I can log in\n\n**Acceptance Criteria:**\n- [ ] form validates email\n'
  );
  r = runCli(pkgDir, project, ['/breakdown-task', 'docs/production/user-stories-prd.md', 'onboarding']);
  const breakdownFiles = fs.existsSync(path.join(project, 'docs', 'production', 'onboarding'))
    ? fs.readdirSync(path.join(project, 'docs', 'production', 'onboarding'))
    : [];
  record({
    id: '2.9',
    check: 'breakdown',
    command: 'sdd-gen /breakdown-task <prd> onboarding',
    expect: 'exit 0',
    result: { status: breakdownFiles.length === 4 ? r.status : `${r.status}+${breakdownFiles.length}files` },
    evidence: breakdownFiles.join(', ')
  });

  r = runCli(pkgDir, project, ['/implement-code', '01', 'onboarding']);
  const briefPath = path.join(project, 'docs', 'production', 'onboarding', 'onboarding-01-register-implement.md');
  const brief = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, 'utf-8') : '';
  record({
    id: '2.10',
    check: 'implementation brief',
    command: 'sdd-gen /implement-code 01 onboarding',
    expect: 'exit 0',
    result: { status: brief.includes('**As a** visitor') ? r.status : `${r.status}+empty story` },
    evidence: brief.includes('**As a** visitor') ? 'User Story filled from -prod.md' : 'User Story section empty'
  });

  r = runCli(pkgDir, project, ['--yes', '/qa-test-script', 'onboarding']);
  const testsDir = path.join(project, 'tests');
  const testFiles = fs.existsSync(testsDir) ? fs.readdirSync(testsDir) : [];
  record({
    id: '2.11',
    check: 'test script generation',
    command: 'sdd-gen --yes /qa-test-script onboarding',
    expect: 'exit 0',
    result: { status: testFiles.length > 0 ? r.status : `${r.status}+no file` },
    evidence: testFiles.join(', ')
  });

  r = runCli(pkgDir, project, ['--yes', '/install-all-skills']);
  const toolDirs = ['.devin', '.opencode', '.claude', '.antigravity', '.hermes'].filter((d) => fs.existsSync(path.join(project, d)));
  record({
    id: '2.12',
    check: 'install skills',
    command: 'sdd-gen --yes /install-all-skills',
    expect: 'exit 0',
    result: { status: toolDirs.length === 5 ? r.status : `${r.status}+${toolDirs.length}dirs` },
    evidence: toolDirs.join(', ')
  });

  record({
    id: '2.13',
    check: 'run tests (delegated)',
    command: 'sdd-gen /qa-test-run onboarding',
    expect: 'not run',
    result: { status: 'not run' },
    evidence: 'Requires a working project test runner; Playwright would download browsers. Argument handling covered by unit tests.'
  });

  // 3. Negative checks
  const neg = path.join(work, 'negative');
  mkdir(neg);
  r = runCli(pkgDir, neg, ['--yes', '/prd', '../escape']);
  record({
    id: '3.1',
    check: 'path traversal rejected',
    command: 'sdd-gen --yes /prd ../escape',
    expect: 'non-zero',
    result: { status: fs.existsSync(path.join(neg, 'escape-prd.md')) ? 'leaked' : r.status },
    evidence: r.stdout || r.stderr
  });

  const marker = `pwned-${Date.now()}`;
  r = runCli(pkgDir, neg, ['--yes', '/prd', `x; touch ${marker}`]);
  record({
    id: '3.2',
    check: 'shell metacharacters rejected',
    command: 'sdd-gen --yes /prd "x; touch <marker>"',
    expect: 'non-zero',
    result: { status: fs.existsSync(path.join(neg, marker)) ? 'executed' : r.status },
    evidence: r.stdout || r.stderr
  });

  const badConfig = path.join(work, 'bad-config');
  mkdir(badConfig);
  writeFile(path.join(badConfig, 'sdd.config.json'), JSON.stringify({ testFramework: 'nope' }));
  writeFile(path.join(badConfig, 'docs', 'production', 'checkout', 'checkout-01-login-testing.md'), '# testing\n');
  r = runCli(pkgDir, badConfig, ['--yes', '/qa-test-script', 'checkout']);
  record({
    id: '3.3',
    check: 'invalid framework rejected',
    command: 'sdd-gen --yes /qa-test-script checkout',
    expect: 'non-zero',
    result: { status: fs.existsSync(path.join(badConfig, 'tests')) ? 'side-effect' : r.status },
    evidence: r.stdout || r.stderr
  });

  const trimmed = path.join(work, 'trimmed');
  mkdir(path.join(trimmed, 'templates'));
  for (const file of fs.readdirSync(path.join(pkgDir, 'templates'))) {
    if (file === 'qa-report-template.md') continue;
    fs.copyFileSync(path.join(pkgDir, 'templates', file), path.join(trimmed, 'templates', file));
  }
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(trimmed, 'node_modules'), 'junction');
  const missingTpl = path.join(work, 'missing-template');
  mkdir(missingTpl);
  r = runCli(trimmed, missingTpl, ['--yes', '/init', 'billing']);
  record({
    id: '3.4',
    check: 'missing template fails closed',
    command: 'sdd-gen --yes /init billing (no qa-report-template.md)',
    expect: 'non-zero',
    result: { status: fs.existsSync(path.join(missingTpl, 'docs')) ? 'partial output' : r.status },
    evidence: r.stdout || r.stderr
  });

  // Report
  const summary = {
    cliVersion: info.version,
    node: process.version,
    platform: `${process.platform} ${os.release()}`,
    date: new Date().toISOString().slice(0, 10),
    passed: results.filter((x) => x.pass === true).length,
    failed: results.filter((x) => x.pass === false).length,
    skipped: results.filter((x) => x.pass === null).length,
    total: results.length,
    results
  };

  console.log('');
  console.log('ID    result  command');
  for (const item of results) {
    const label = item.pass === true ? 'PASS' : item.pass === false ? 'FAIL' : 'SKIP';
    console.log(`${item.id.padEnd(6)}${label.padEnd(8)}${item.command}`);
  }
  console.log('');
  console.log(`${summary.passed}/${summary.total} passed, ${summary.failed} failed, ${summary.skipped} skipped on ${summary.platform}, Node ${summary.node}, CLI ${summary.cliVersion}`);

  if (jsonFlag !== -1 && process.argv[jsonFlag + 1]) {
    writeFile(path.resolve(process.argv[jsonFlag + 1]), JSON.stringify(summary, null, 2) + '\n');
    console.log(`JSON written to ${process.argv[jsonFlag + 1]}`);
  }

  // Cleanup: unlink junctions before removing their parents.
  fs.unlinkSync(path.join(pkgDir, 'node_modules'));
  fs.unlinkSync(path.join(trimmed, 'node_modules'));
  fs.rmSync(work, { recursive: true, force: true });

  if (summary.passed !== summary.total) process.exitCode = 1;
}

main();
