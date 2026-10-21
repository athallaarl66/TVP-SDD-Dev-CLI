const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { CLI_DIR } = require('./helpers');

const DOCS = path.join(CLI_DIR, 'docs');
const PRD = path.join(DOCS, 'prd.md');
const TECHNICAL = path.join(DOCS, 'technical-design.md');

function mermaidBlocks(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const blocks = [];
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = re.exec(content)) !== null) blocks.push(match[1]);
  return { content, blocks };
}

// Commands registered in lib/commands/*.js, e.g. "/breakdown-task <prdFile>...".
function registeredCommands() {
  const dir = path.join(CLI_DIR, 'lib', 'commands');
  const commands = new Set();
  for (const file of fs.readdirSync(dir)) {
    const source = fs.readFileSync(path.join(dir, file), 'utf-8');
    const re = /\.command\('(\/[a-z-]+)/g;
    let match;
    while ((match = re.exec(source)) !== null) commands.add(match[1]);
  }
  return [...commands].sort();
}

test('docs: required release documents exist', () => {
  const required = [
    'prd.md',
    'technical-design.md',
    'uat-plan.md',
    'test-report/uat-report.md',
    'test-report/test-report.md',
    'release-checklist.md'
  ];
  for (const file of required) {
    assert.ok(fs.pathExistsSync(path.join(DOCS, file)), `missing docs/${file}`);
  }
  assert.ok(fs.pathExistsSync(path.join(CLI_DIR, 'SECURITY.md')), 'missing SECURITY.md');
});

test('docs: every mermaid block is well formed', () => {
  const allowed = ['flowchart', 'sequenceDiagram', 'erDiagram'];
  for (const file of [PRD, TECHNICAL]) {
    const { content, blocks } = mermaidBlocks(file);
    // No unclosed fence: count of "```" lines must be even.
    const fences = content.split('\n').filter((line) => line.trim().startsWith('```')).length;
    assert.strictEqual(fences % 2, 0, `${path.basename(file)}: unbalanced code fence`);
    assert.ok(blocks.length > 0, `${path.basename(file)}: no mermaid diagram`);
    for (const block of blocks) {
      const first = block.trim().split('\n')[0].trim();
      assert.ok(
        allowed.some((keyword) => first === keyword || first.startsWith(`${keyword} `)),
        `${path.basename(file)}: unexpected mermaid diagram type "${first}"`
      );
      assert.ok(block.trim().length > 0, `${path.basename(file)}: empty mermaid block`);
    }
  }
});

test('docs: technical design carries architecture, sequence, and data-model diagrams', () => {
  const { blocks } = mermaidBlocks(TECHNICAL);
  const types = blocks.map((b) => b.trim().split('\n')[0].trim().split(' ')[0]);
  assert.ok(types.includes('flowchart'), 'missing flowchart');
  assert.ok(types.includes('sequenceDiagram'), 'missing sequence diagram');
  assert.ok(types.includes('erDiagram'), 'missing data-model diagram');
});

test('docs: PRD command table matches registered commands', () => {
  const { content } = mermaidBlocks(PRD);
  for (const command of registeredCommands()) {
    assert.ok(
      content.includes(`\`${command}\``),
      `docs/prd.md does not document registered command ${command}`
    );
  }
  // Every command mentioned in the PRD table must exist in the CLI.
  const mentioned = new Set([...content.matchAll(/^\| `(\/[a-z-]+)`/gm)].map((m) => m[1]));
  for (const command of mentioned) {
    assert.ok(registeredCommands().includes(command), `docs/prd.md documents unknown command ${command}`);
  }
});

test('docs: technical design references real source files', () => {
  const { content } = mermaidBlocks(TECHNICAL);
  const referenced = new Set(
    [...content.matchAll(/`(lib\/[A-Za-z0-9/._-]+\.js|scripts\/[A-Za-z0-9/._-]+\.js|tests\/cli\/[A-Za-z0-9/._-]+\.js|package\.json|SECURITY\.md)`/g)]
      .map((m) => m[1])
  );
  assert.ok(referenced.size >= 4, 'technical design should reference concrete files');
  for (const rel of referenced) {
    assert.ok(fs.pathExistsSync(path.join(CLI_DIR, rel)), `docs/technical-design.md references missing ${rel}`);
  }
});
