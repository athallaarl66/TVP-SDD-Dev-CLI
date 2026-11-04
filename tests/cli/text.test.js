const test = require('node:test');
const assert = require('node:assert/strict');
const { pascalCase } = require('../../lib/utils/text');

test('pascalCase converts slug, spaces, and underscores to identifiers', () => {
  assert.equal(pascalCase('user-authentication'), 'UserAuthentication');
  assert.equal(pascalCase('user authentication'), 'UserAuthentication');
  assert.equal(pascalCase('user_authentication'), 'UserAuthentication');
});
