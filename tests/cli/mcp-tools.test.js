const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { McpServer, TOOLS } = require('../../lib/mcp');
const { coverage } = require('../../lib/coverage');

test('MCP exposes valid tool schemas and delegates shared tools to core modules', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mcp-tools-'));
  try {
    const story = path.join(root, 'docs/production/pay/payments/01-check');
    fs.outputFileSync(path.join(story, 'prod.md'), '## User Story\n\nA purchase story.\n');
    fs.outputFileSync(path.join(story, 'tech.md'), '# Tech\n');
    fs.outputFileSync(path.join(story, 'design.md'), '# Design\n');
    fs.outputFileSync(path.join(story, 'testing.md'), '- [ ] AC-PAY-01-1 Payment works\n');
    fs.outputFileSync(path.join(root, 'tests/pay.test.js'), "assert('AC-PAY-01-1')\n");
    const { recordDocument } = require('../../lib/manifest');
    for (const name of ['prod.md', 'tech.md', 'design.md', 'testing.md']) {
      await recordDocument(root, {
        kind: 'production', feature: 'pay', filePath: path.join(story, name)
      });
    }
    const server = new McpServer(root, { write() {}, diagnostic() {} });
    assert.ok(TOOLS.every((tool) => tool.name && tool.description && tool.inputSchema.type === 'object'));
    const coverageResult = await server.callTool({ name: 'sdd_coverage', arguments: { feature: 'pay' } });
    assert.deepEqual(JSON.parse(coverageResult.content[0].text), coverage(root, 'pay'));
    const scenarios = await server.callTool({ name: 'sdd_scenarios', arguments: { feature: 'pay' } });
    assert.deepEqual(JSON.parse(scenarios.content[0].text).scenarios, ['01']);
    const context = await server.callTool({ name: 'sdd_context', arguments: { feature: 'pay' } });
    assert.match(context.content[0].text, /AC-PAY-01-1/);
    const stale = await server.callTool({ name: 'sdd_stale', arguments: {} });
    assert.equal(JSON.parse(stale.content[0].text).ok, true);
  } finally {
    fs.removeSync(root);
  }
});

test('MCP dispatch exposes lifecycle, tool discovery, resources, templates, and resource reads', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mcp-dispatch-'));
  try {
    fs.outputFileSync(path.join(root, 'docs/features/pay-prd.md'), '# PRD\n');
    const server = new McpServer(root, { write() {}, diagnostic() {} });
    const initialized = await server.dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(initialized.protocolVersion, '2024-11-05');
    assert.deepEqual(await server.dispatch('notifications/initialized'), {});
    assert.deepEqual(await server.dispatch('ping'), {});
    assert.ok((await server.dispatch('tools/list')).tools.length);
    assert.deepEqual(await server.dispatch('resources/list'), { resources: [{ uri: 'sdd://coverage', name: 'Acceptance coverage', mimeType: 'application/json' }] });
    assert.equal((await server.dispatch('resources/templates/list')).resourceTemplates[0].uriTemplate, 'sdd://feature/{name}/prd');
    const read = await server.dispatch('resources/read', { uri: 'sdd://feature/pay/prd' });
    assert.match(read.contents[0].text, /# PRD/);
    await assert.rejects(server.dispatch('resources/read', { uri: 'sdd://feature/unknown/prd' }), { code: -32602 });
  } finally {
    fs.removeSync(root);
  }
});

test('MCP rejects resource symlinks that resolve outside project root', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mcp-symlink-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mcp-outside-'));
  try {
    fs.outputFileSync(path.join(outside, 'secret.md'), 'secret');
    fs.ensureDirSync(path.join(root, 'docs/features'));
    try {
      fs.symlinkSync(path.join(outside, 'secret.md'), path.join(root, 'docs/features/pay-prd.md'));
    } catch (error) {
      if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return;
      throw error;
    }
    const server = new McpServer(root, { write() {}, diagnostic() {} });
    await assert.rejects(server.dispatch('resources/read', { uri: 'sdd://feature/pay/prd' }));
  } finally {
    fs.removeSync(root);
    fs.removeSync(outside);
  }
});

test('MCP resource list separates concrete resources from feature PRD template', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mcp-resource-'));
  try {
    fs.outputFileSync(path.join(root, '.sdd/manifest.json'), JSON.stringify({ version: 1, documents: [] }));
    const server = new McpServer(root, { write() {}, diagnostic() {} });
    const resources = await server.listResources({});
    const templates = await server.listTemplates({});
    assert.ok(resources.resources.some((resource) => resource.uri === 'sdd://manifest'));
    assert.ok(!resources.resources.some((resource) => resource.uri.includes('{name}')));
    assert.equal(templates.resourceTemplates[0].uriTemplate, 'sdd://feature/{name}/prd');
  } finally {
    fs.removeSync(root);
  }
});
