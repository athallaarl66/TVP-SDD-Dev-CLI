const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runNode, CLI_DIR } = require('./helpers');

test('qa-test-run: protects existing package scripts byte-for-byte unless forced', async () => {
  const { upsertQARunScript } = require('../../lib/commands/qa-test-run');
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sdd-script-'));
  const packagePath = path.join(dir, 'package.json');
  const original = '{\n  "name": "fixture",\n  "scripts": { "qa-run:checkout": "custom command" },\n  "private": true\n}\n';
  fs.writeFileSync(packagePath, original);

  await assert.rejects(upsertQARunScript(packagePath, 'qa-run:checkout', 'npx jest tests/checkout.test.ts'), /already exists/);
  assert.strictEqual(fs.readFileSync(packagePath, 'utf8'), original);

  assert.strictEqual(await upsertQARunScript(packagePath, 'qa-run:checkout', 'npx jest tests/checkout.test.ts', { force: true }), 'replaced');
  const forced = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  assert.strictEqual(forced.scripts['qa-run:checkout'], 'npx jest tests/checkout.test.ts');
  assert.strictEqual(forced.private, true);

  const afterForce = fs.readFileSync(packagePath, 'utf8');
  assert.strictEqual(await upsertQARunScript(packagePath, 'qa-run:checkout', 'npx jest tests/checkout.test.ts'), 'unchanged');
  assert.strictEqual(fs.readFileSync(packagePath, 'utf8'), afterForce);
  fs.removeSync(dir);
});

test('qa-test-run: CLI refuses conflicting script before test execution', () => {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sdd-runner-'));
  const packagePath = path.join(dir, 'package.json');
  const original = '{\n  "name": "fixture",\n  "scripts": { "qa-run:checkout": "custom command" }\n}\n';
  fs.writeFileSync(packagePath, original);
  fs.outputFileSync(path.join(dir, 'tests', 'checkout.test.ts'), 'throw new Error("must not run");\n');
  const { runCli } = require('./helpers');

  const result = runCli(['--yes', '/qa-test-run', 'checkout'], dir);
  assert.strictEqual(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /already exists with a different command/);
  assert.doesNotMatch(result.stdout + result.stderr, /must not run/);
  assert.strictEqual(fs.readFileSync(packagePath, 'utf8'), original);
  fs.removeSync(dir);
});

test('qa-test-run: runCommand propagates non-zero exit code from the underlying command', () => {
  const script = `
    const { runCommand } = require('./lib/commands/qa-test-run');
    runCommand({ command: process.execPath, args: ['-e', 'process.exit(3)'] }, process.cwd(), 'mock');
    console.log('EXITCODE=' + (process.exitCode || 0));
  `;
  const { status, stdout } = runNode(script);
  assert.ok(status === 3 || /EXITCODE=3/.test(stdout), `status=${status} stdout=${stdout}`);
});

test('qa-test-run: native executable on PATH receives arguments unchanged', () => {
  const script = `
    const { runCommand } = require('./lib/commands/qa-test-run');
    runCommand({ command: 'python', args: ['-c', 'import sys; print("ARG:" + sys.argv[1])', 'value with spaces'] }, process.cwd(), 'python');
  `;
  const { status, stdout, stderr } = runNode(script);
  assert.strictEqual(status, 0, `${stdout}\n${stderr}`);
  assert.match(stdout, /ARG:value with spaces/);
});

test('qa-test-run: runCommand refuses shell command strings', () => {
  const script = `
    const { runCommand } = require('./lib/commands/qa-test-run');
    try {
      runCommand('node -e "process.exit(0)"', process.cwd(), 'mock');
      console.log('NO_ERROR');
    } catch (error) {
      console.log('REJECTED:' + error.name);
    }
  `;
  const { status, stdout } = runNode(script);
  assert.strictEqual(status, 0, stdout);
  assert.match(stdout, /REJECTED:TypeError/);
});

test('qa-test-run: metacharacters in an argument are passed as data, not executed', () => {
  const marker = `sdd-pwned-${Date.now()}`;
  const script = `
    const { runCommand } = require('./lib/commands/qa-test-run');
    runCommand({
      command: process.execPath,
      args: ['-e', 'console.log("ARG:" + process.argv[1])', 'x; touch ${marker}'],
    }, process.cwd(), 'mock');
  `;
  const { status, stdout } = runNode(script);
  assert.strictEqual(status, 0, stdout);
  assert.match(stdout, new RegExp(`ARG:x; touch ${marker}`));
  assert.strictEqual(fs.pathExistsSync(path.join(CLI_DIR, marker)), false, 'shell injection executed');
});
