const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Command } = require('commander');
const { CLI_DIR } = require('./helpers');
const { diagnose, formatDoctorReport, registerDoctorCommand } = require('../../lib/commands/doctor');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-doctor-'));
  const write = (relativePath, content) => {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    return target;
  };
  return { root, write, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function tree(root) {
  return fs.readdirSync(root, { recursive: true }).sort().map((entry) => {
    const file = path.join(root, entry);
    return fs.statSync(file).isFile() ? [entry, fs.readFileSync(file, 'utf8')] : [entry, 'directory'];
  });
}

function addHealthyProject(project) {
  const document = project.write('docs/features/billing-prd.md', '- [ ] AC-BILLING-1-1 Payment works\n');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(document)).digest('hex');
  project.write('.sdd/manifest.json', `${JSON.stringify({
    version: 1,
    documents: [{
      kind: 'prd',
      feature: 'billing',
      path: 'docs/features/billing-prd.md',
      sourcePatterns: [],
      sources: [],
      generatedHash: hash,
      generatedAt: '2026-01-01T00:00:00.000Z'
    }]
  }, null, 2)}\n`);
  project.write('.mcp.json', JSON.stringify({ mcpServers: { sdd: { command: 'sdd-gen', args: ['mcp'] } } }));
}

test('doctor reports every incomplete setup condition with actionable remedies without mutation', async () => {
  const project = fixture();
  try {
    const before = tree(project.root);
    const result = await diagnose(project.root, { cliDir: CLI_DIR, nodeVersion: 'v20.0.0' });
    const output = formatDoctorReport(result);

    assert.equal(result.ok, false);
    assert.match(output, /docs: fail/);
    assert.match(output, /sdd-gen \/init <feature>/);
    assert.match(output, /manifest: warn/);
    assert.match(output, /sdd-gen \/context build <feature>/);
    assert.match(output, /coverage: warn/);
    assert.match(output, /sdd-gen \/coverage --backfill/);
    assert.match(output, /mcp-client: warn/);
    assert.match(output, /Paste this into your MCP client configuration/);
    assert.match(output, /"command": "sdd-gen"/);
    assert.deepEqual(tree(project.root), before);
  } finally {
    project.cleanup();
  }
});

test('doctor uses prose instead of an invented Node installation command', async () => {
  const project = fixture();
  try {
    const result = await diagnose(project.root, { cliDir: CLI_DIR, nodeVersion: 'v18.20.0' });
    const node = result.checks.find((check) => check.name === 'node');
    assert.equal(node.status, 'fail');
    assert.match(node.remedy, /Install or select Node.js >=20\.0\.0/);
    assert.doesNotMatch(node.remedy, /npm install.*node/i);
  } finally {
    project.cleanup();
  }
});

test('doctor command reports healthy local setup without mutation', async () => {
  const project = fixture();
  const originalCwd = process.cwd();
  const originalLog = console.log;
  const output = [];
  try {
    addHealthyProject(project);
    const before = tree(project.root);
    process.chdir(project.root);
    console.log = (line) => output.push(String(line));
    const program = new Command();
    program.exitOverride();
    registerDoctorCommand(program, () => ({}));
    await program.parseAsync(['/doctor'], { from: 'user' });

    assert.match(output.join('\n'), /node: pass/);
    assert.match(output.join('\n'), /manifest: pass/);
    assert.match(output.join('\n'), /mcp-client: pass/);
    assert.deepEqual(tree(project.root), before);
  } finally {
    console.log = originalLog;
    process.chdir(originalCwd);
    project.cleanup();
  }
});

test('MCP metadata uses current package schema and package mcpName', () => {
  const metadata = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'server.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package.json'), 'utf8'));
  assert.equal(pkg.mcpName, metadata.name);
  assert.equal(metadata.version, pkg.version);
  assert.equal(Object.hasOwn(metadata, 'version_detail'), false);
  assert.equal(metadata.packages.length, 1);
  assert.deepEqual(metadata.packages[0], {
    registryType: 'npm',
    identifier: pkg.name,
    version: pkg.version,
    transport: { type: 'stdio' }
  });
});
