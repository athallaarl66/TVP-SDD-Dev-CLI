const { test } = require('node:test');
const assert = require('node:assert');
const { runNode } = require('./helpers');

test('qa-test-run: runCommand propagates non-zero exit code from the underlying command', () => {
  const script = `
    const { runCommand } = require('./lib/commands/qa-test-run');
    runCommand('node -e "process.exit(3)"', process.cwd(), 'mock');
    console.log('EXITCODE=' + (process.exitCode || 0));
  `;
  const { status, stdout } = runNode(script);
  assert.ok(status === 3 || /EXITCODE=3/.test(stdout), `status=${status} stdout=${stdout}`);
});