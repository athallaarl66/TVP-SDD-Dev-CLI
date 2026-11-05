#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');
const { buildContext, checkContext } = require('../context');
const { coverage } = require('../coverage');
const { findScenario, listScenarioNumbers } = require('../commands/implement-code');
const { manifestPath } = require('../manifest');
const { CliError, validateFeatureName, assertResolvedInside } = require('../utils/file');

const MAX_LINE = 1024 * 1024;
const PROTOCOL_VERSION = '2024-11-05';
const TOOLS = [
  ['sdd_context', 'Build tracked context for a feature.', { feature: { type: 'string' }, budget: { type: 'integer', minimum: 1 }, terse: { type: 'boolean' } }],
  ['sdd_stale', 'Inspect tracked document freshness.', {}],
  ['sdd_coverage', 'Report acceptance-criteria coverage.', { feature: { type: 'string' } }],
  ['sdd_scenarios', 'Discover generated implementation scenarios.', { feature: { type: 'string' }, scenario: { type: 'string', pattern: '^\\d{1,2}$' } }]
].map(([name, description, properties]) => ({ name, description, inputSchema: { type: 'object', properties, additionalProperties: false } }));

class RpcError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

function response(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function errorResponse(id, error) {
  const body = { code: error.code, message: error.message };
  if (error.data !== undefined) body.data = error.data;
  return { jsonrpc: '2.0', id, error: body };
}

function paramsObject(params) {
  if (params === undefined) return {};
  if (!params || typeof params !== 'object' || Array.isArray(params)) throw new RpcError(-32602, 'Invalid params');
  return params;
}

function only(params, allowed) {
  for (const key of Object.keys(params)) if (!allowed.has(key)) throw new RpcError(-32602, `Invalid params: unexpected ${key}`);
  return params;
}

function textResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function toolError(error) {
  return { content: [{ type: 'text', text: error.message }], isError: true };
}

async function safeRead(projectDir, filePath) {
  await assertResolvedInside(projectDir, filePath);
  return fsp.readFile(filePath, 'utf8');
}

function featureFromPrdUri(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new RpcError(-32602, 'Invalid resource URI');
  }
  if (parsed.protocol !== 'sdd:' || parsed.hostname !== 'feature') throw new RpcError(-32602, `Unknown resource: ${uri}`);
  const match = parsed.pathname.match(/^\/([^/]+)\/prd$/);
  if (!match || parsed.search || parsed.hash) throw new RpcError(-32602, `Unknown resource: ${uri}`);
  try {
    return validateFeatureName(decodeURIComponent(match[1]));
  } catch (error) {
    throw new RpcError(-32602, error.message);
  }
}

class McpServer {
  constructor(projectDir = process.cwd(), { write = (line) => process.stdout.write(line), diagnostic = (line) => process.stderr.write(line) } = {}) {
    this.projectDir = path.resolve(projectDir);
    this.write = write;
    this.diagnostic = diagnostic;
  }

  send(message) {
    this.write(`${JSON.stringify(message)}\n`);
  }

  log(message) {
    this.diagnostic(`mcp: ${message}\n`);
  }

  async handle(message) {
    const hasId = Object.prototype.hasOwnProperty.call(message || {}, 'id');
    const id = hasId && (typeof message.id === 'string' || typeof message.id === 'number' || message.id === null) ? message.id : null;
    if (!message || typeof message !== 'object' || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string' || (hasId && id === null && message.id !== null)) {
      this.send(errorResponse(null, new RpcError(-32600, 'Invalid Request')));
      return;
    }
    try {
      const result = await this.dispatch(message.method, message.params);
      if (hasId) this.send(response(id, result));
    } catch (error) {
      const rpc = error instanceof RpcError ? error : new RpcError(-32603, 'Internal error');
      if (!(error instanceof RpcError)) this.log(error.message);
      if (hasId) this.send(errorResponse(id, rpc));
    }
  }

  async dispatch(method, rawParams) {
    const params = paramsObject(rawParams);
    if (method === 'initialize') {
      only(params, new Set(['protocolVersion', 'capabilities', 'clientInfo']));
      if (params.protocolVersion !== PROTOCOL_VERSION) throw new RpcError(-32602, `Unsupported protocol version: ${params.protocolVersion}`);
      return { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'sdd-gen', version: '0.0.0' } };
    }
    if (method === 'notifications/initialized') return {};
    if (method === 'ping') return {};
    if (method === 'tools/list') return { tools: TOOLS };
    if (method === 'tools/call') return this.callTool(params);
    if (method === 'resources/list') return this.listResources(params);
    if (method === 'resources/templates/list') return this.listTemplates(params);
    if (method === 'resources/read') return this.readResource(params);
    throw new RpcError(-32601, 'Method not found');
  }

  async callTool(params) {
    only(params, new Set(['name', 'arguments']));
    if (typeof params.name !== 'string') throw new RpcError(-32602, 'Invalid params: tool name is required');
    const args = paramsObject(params.arguments);
    try {
      if (params.name === 'sdd_context') {
        only(args, new Set(['feature', 'budget', 'terse']));
        const feature = validateFeatureName(args.feature);
        if (args.budget !== undefined && (!Number.isInteger(args.budget) || args.budget < 1)) throw new RpcError(-32602, 'Invalid params: budget must be a positive integer');
        if (args.terse !== undefined && typeof args.terse !== 'boolean') throw new RpcError(-32602, 'Invalid params: terse must be boolean');
        return textResult(await buildContext(this.projectDir, feature, { budget: args.budget, terse: args.terse }));
      }
      if (params.name === 'sdd_stale') {
        only(args, new Set());
        return textResult(await checkContext(this.projectDir));
      }
      if (params.name === 'sdd_coverage') {
        only(args, new Set(['feature']));
        if (args.feature !== undefined) {
          try { validateFeatureName(args.feature); } catch (error) { throw new RpcError(-32602, error.message); }
        }
        const feature = args.feature === undefined ? undefined : validateFeatureName(args.feature);
        return textResult(coverage(this.projectDir, feature));
      }
      if (params.name === 'sdd_scenarios') {
        only(args, new Set(['feature', 'scenario']));
        const feature = validateFeatureName(args.feature);
        if (args.scenario === undefined) return textResult({ feature, scenarios: await listScenarioNumbers(feature, this.projectDir) });
        if (typeof args.scenario !== 'string' || !/^\d{1,2}$/.test(args.scenario)) throw new RpcError(-32602, 'Invalid params: scenario must be one or two digits');
        return textResult(await findScenario(feature, args.scenario.padStart(2, '0')));
      }
      throw new RpcError(-32602, `Unknown tool: ${params.name}`);
    } catch (error) {
      if (error instanceof RpcError) throw error;
      return toolError(error);
    }
  }

  async listResources(params) {
    only(params, new Set());
    const resources = [{ uri: 'sdd://coverage', name: 'Acceptance coverage', mimeType: 'application/json' }];
    if (fs.existsSync(manifestPath(this.projectDir))) resources.unshift({ uri: 'sdd://manifest', name: 'Context manifest', mimeType: 'application/json' });
    return { resources };
  }

  async listTemplates(params) {
    only(params, new Set());
    return { resourceTemplates: [{ uriTemplate: 'sdd://feature/{name}/prd', name: 'Feature PRD', description: 'Tracked feature PRD.', mimeType: 'text/markdown' }] };
  }

  async readResource(params) {
    only(params, new Set(['uri']));
    if (typeof params.uri !== 'string') throw new RpcError(-32602, 'Invalid params: uri is required');
    if (params.uri === 'sdd://manifest') {
      const filePath = manifestPath(this.projectDir);
      if (!fs.existsSync(filePath)) throw new RpcError(-32602, 'Unknown resource: sdd://manifest');
      return { contents: [{ uri: params.uri, mimeType: 'application/json', text: await safeRead(this.projectDir, filePath) }] };
    }
    if (params.uri === 'sdd://coverage') return { contents: [{ uri: params.uri, mimeType: 'application/json', text: JSON.stringify(coverage(this.projectDir), null, 2) }] };
    const feature = featureFromPrdUri(params.uri);
    const filePath = path.join(this.projectDir, 'docs', 'features', `${feature}-prd.md`);
    if (!fs.existsSync(filePath)) throw new RpcError(-32602, `Unknown resource: ${params.uri}`);
    return { contents: [{ uri: params.uri, mimeType: 'text/markdown', text: await safeRead(this.projectDir, filePath) }] };
  }
}

function start(projectDir = process.cwd(), input = process.stdin) {
  const server = new McpServer(projectDir);
  let pending = '';
  let queue = Promise.resolve();
  input.setEncoding('utf8');
  const parseError = (message) => {
    queue = queue.then(() => {
      server.log(message);
      server.send(errorResponse(null, new RpcError(-32700, 'Parse error')));
    });
  };
  input.on('data', (chunk) => {
    pending += chunk;
    if (pending.length > MAX_LINE && !pending.includes('\n')) {
      parseError('input line exceeds limit');
      pending = '';
      return;
    }
    const lines = pending.split('\n');
    pending = lines.pop();
    for (let line of lines) {
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.trim()) continue;
      if (line.length > MAX_LINE) {
        parseError('input line exceeds limit');
        continue;
      }
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        parseError('parse error');
        continue;
      }
      queue = queue.then(() => server.handle(message)).catch((error) => server.log(error.message));
    }
  });
  input.on('end', () => {
    if (pending.trim()) {
      server.log('unterminated input');
      server.send(errorResponse(null, new RpcError(-32700, 'Parse error')));
    }
  });
  return server;
}

if (require.main === module) start();

module.exports = { McpServer, RpcError, start, TOOLS, PROTOCOL_VERSION };
