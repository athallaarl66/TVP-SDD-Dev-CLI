const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { tmpProject } = require('./helpers');

const CONFIG = require('../../lib/utils/config');

test('config: read/write round-trip with whitelist enforcement', () => {
  const dir = tmpProject();
  assert.deepStrictEqual(CONFIG.readConfig(dir), {});

  assert.ok(CONFIG.writeConfig({ lastFeature: 'user-auth', testFramework: 'jest' }, dir));
  assert.deepStrictEqual(CONFIG.readConfig(dir), { lastFeature: 'user-auth', testFramework: 'jest' });

  // Non-whitelisted field must not persist.
  assert.ok(CONFIG.writeConfig({ injected: 'evil' }, dir));
  assert.deepStrictEqual(CONFIG.readConfig(dir), { lastFeature: 'user-auth', testFramework: 'jest' });
  fs.removeSync(dir);
});

test('config: read returns {} for missing/invalid file', () => {
  const dir = tmpProject();
  assert.deepStrictEqual(CONFIG.readConfig(dir), {});
  fs.outputFileSync(path.join(dir, 'sdd.config.json'), 'not json{{{');
  assert.deepStrictEqual(CONFIG.readConfig(dir), {});
  fs.removeSync(dir);
});

test('config: write failure is non-fatal and returns false', () => {
  const dir = path.join(os.tmpdir(), 'sdd-readonly-' + Date.now());
  fs.ensureDirSync(dir);
  // Make the config path unwritable by pointing at a directory in its place.
  fs.ensureDirSync(path.join(dir, 'sdd.config.json'));
  const result = CONFIG.writeConfig({ lastFeature: 'x' }, dir);
  assert.strictEqual(result, false);
  fs.removeSync(dir);
});