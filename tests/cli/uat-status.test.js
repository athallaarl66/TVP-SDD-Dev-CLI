const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('UAT negative checks fail on side effects and process errors', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../scripts/uat.js'), 'utf8');
  const record = source.slice(source.indexOf('function record('), source.indexOf('\nfunction main()'));
  const context = { results: [] };
  vm.runInNewContext(record, context);
  for (const status of ['leaked', 'side-effect', null, 0, 1]) {
    context.record({ expect: 'non-zero', result: { status } });
  }
  assert.deepEqual(Array.from(context.results, (r) => r.pass), [false, false, false, false, true]);
});
