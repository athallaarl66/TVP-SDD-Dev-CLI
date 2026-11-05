const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('fs-extra');
const { runNode, CLI_DIR, tmpProject } = require('./helpers');

test('interactive /qa-test-script loads inquirer only inside prompt branch', () => {
  const dir = tmpProject();
  try {
    fs.outputFileSync(path.join(dir, 'docs/production/checkout/accounts/01-pay/testing.md'), '# test\n');
    const index = path.join(CLI_DIR, 'index.js');
    const script = `
      const M = require('module');
      const original = M._load;
      M._load = function(request, parent, isMain) {
        if (request === 'inquirer') return { default: { Separator: class Separator {}, prompt: async () => ({ framework: 'jest' }) } };
        return original.call(this, request, parent, isMain);
      };
      process.argv = [process.execPath, ${JSON.stringify(index)}, '/qa-test-script', 'checkout'];
      require(${JSON.stringify(index)});
    `;
    const result = runNode(script, dir);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(path.join(dir, 'tests/checkout.test.ts')));
  } finally {
    fs.removeSync(dir);
  }
});
