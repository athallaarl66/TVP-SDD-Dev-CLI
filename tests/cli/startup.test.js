const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runNode, CLI_DIR } = require('./helpers');

test('version output does not load inquirer or MCP server modules', () => {
  const script = `const M=require('module');const o=M._load;M._load=function(r,...a){if(r==='inquirer'||r.includes('/mcp/')){console.error('unexpected eager load: '+r);process.exit(9)}return o.call(this,r,...a)};process.argv=[process.execPath,${JSON.stringify(path.join(CLI_DIR, 'index.js'))},'--version'];require(${JSON.stringify(path.join(CLI_DIR, 'index.js'))})`;
  const result = runNode(script, CLI_DIR);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^\d+\.\d+\.\d+/);
});

test('ordinary coverage command does not eagerly load interactive, MCP, or memory modules', () => {
  const script = `const M=require('module');const o=M._load;M._load=function(r,...a){if(r==='inquirer'||r.includes('/mcp/')||r==='../memory'){console.error('unexpected eager load: '+r);process.exit(9)}return o.call(this,r,...a)};process.argv=[process.execPath,${JSON.stringify(path.join(CLI_DIR, 'index.js'))},'/coverage'];require(${JSON.stringify(path.join(CLI_DIR, 'index.js'))})`;
  const result = runNode(script, CLI_DIR);
  assert.equal(result.status, 0, result.stderr);
});
