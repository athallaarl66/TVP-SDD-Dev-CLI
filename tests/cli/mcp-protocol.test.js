const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { INDEX } = require('./helpers');

const SERVER = path.join(__dirname, '..', '..', 'lib', 'mcp', 'index.js');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mcp-'));
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function runServer(root, chunks, cli = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, cli ? [INDEX, 'mcp'] : [SERVER], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (status) => resolve({ status, stdout, stderr }));
    for (const chunk of chunks) child.stdin.write(chunk);
    child.stdin.end();
  });
}

function messages(stdout) {
  const lines = stdout.trim().split('\n').filter(Boolean);
  assert.ok(lines.every((line) => !line.includes('\r') && line === JSON.stringify(JSON.parse(line))), 'responses are compact one-line JSON');
  return lines.map(JSON.parse);
}

test('MCP stdio buffers partial CRLF input, ignores notifications, and keeps diagnostics on stderr', async () => {
  const data = fixture();
  try {
    const result = await runServer(data.root, [
      '{"jsonrpc":"2.0","id":1,"method":"ini',
      'tialize","params":{"protocolVersion":"2024-11-05"}}\r\n',
      '{not json}\n',
      '{"jsonrpc":"2.0","method":"notifications/initialized"}\n',
      '{"jsonrpc":"2.0","id":2,"method":"ping"}\n'
    ]);
    assert.equal(result.status, 0, result.stderr);
    const response = messages(result.stdout);
    assert.equal(response.length, 3);
    assert.equal(response[0].id, 1);
    assert.equal(response[0].result.protocolVersion, '2024-11-05');
    assert.equal(response[1].error.code, -32700);
    assert.equal(response[2].id, 2);
    assert.deepEqual(response[2].result, {});
    assert.match(result.stderr, /parse error/i);
  } finally {
    data.cleanup();
  }
});

test('sdd-gen mcp starts over stdio and exits cleanly when stdin closes', async () => {
  const data = fixture();
  try {
    const result = await runServer(data.root, ['{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}\n'], true);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(messages(result.stdout)[0].result.protocolVersion, '2024-11-05');
  } finally {
    data.cleanup();
  }
});

test('MCP dispatch handles invalid requests, params, methods, and keeps processing', async () => {
  const data = fixture();
  try {
    const result = await runServer(data.root, [
      '{"jsonrpc":"2.0","id":1,"method":"missing"}\n',
      '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"sdd_coverage","arguments":{"feature":"../outside"}}}\n',
      '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"file:///outside"}}\n',
      '{"jsonrpc":"2.0","id":4,"method":"ping"}\n',
      '[]\n'
    ]);
    assert.equal(result.status, 0, result.stderr);
    const response = messages(result.stdout);
    assert.deepEqual(response.map((item) => item.id), [1, 2, 3, 4, null]);
    assert.deepEqual(response.map((item) => item.error?.code || 0), [-32601, -32602, -32602, 0, -32600]);
    assert.deepEqual(response[3].result, {});
  } finally {
    data.cleanup();
  }
});
