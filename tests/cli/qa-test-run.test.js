const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { runNode, CLI_DIR } = require('./helpers');

test('qa-test-run: runCommand propagates non-zero exit code from the underlying command', () => {
  const script = `
    const { runCommand } = require('./lib/commands/qa-test-run');
    runCommand({ command: process.execPath, args: ['-e', 'process.exit(3)'] }, process.cwd(), 'mock');
    console.log('EXITCODE=' + (process.exitCode || 0));
  `;
  const { status, stdout } = runNode(script);
  assert.ok(status === 3 || /EXITCODE=3/.test(stdout), `status=${status} stdout=${stdout}`);
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
