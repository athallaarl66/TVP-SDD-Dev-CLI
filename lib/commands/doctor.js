const fs = require('fs');
const path = require('path');
const { coverage } = require('../coverage');
const { checkContext } = require('../context');
const { getPaths } = require('../utils/file');

const SERVER_NAME = 'io.github.athallaarl66/tvp-sdd-dev-cli';
const CLIENT_CONFIGS = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json'];

function packageInfo(cliDir) {
  return JSON.parse(fs.readFileSync(path.join(cliDir, 'package.json'), 'utf8'));
}

function nodeSupported(version, range) {
  const match = String(version).match(/v?(\d+)\.(\d+)\.(\d+)/);
  const required = String(range).match(/>=\s*(\d+)\.(\d+)\.(\d+)/);
  if (!match || !required) return false;
  const actual = match.slice(1).map(Number);
  const minimum = required.slice(1).map(Number);
  for (let index = 0; index < actual.length; index += 1) {
    if (actual[index] !== minimum[index]) return actual[index] > minimum[index];
  }
  return true;
}

function mcpSnippet() {
  return JSON.stringify({
    mcpServers: {
      'sdd-gen': { command: 'sdd-gen', args: ['mcp'] }
    }
  }, null, 2);
}

function clientConfig(projectDir) {
  for (const relativePath of CLIENT_CONFIGS) {
    const filePath = path.join(projectDir, relativePath);
    if (!fs.existsSync(filePath)) continue;
    try {
      const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (value?.mcpServers && typeof value.mcpServers === 'object') return { path: relativePath, configured: true };
      return { path: relativePath, configured: false };
    } catch {
      return { path: relativePath, configured: false, malformed: true };
    }
  }
  return null;
}

async function diagnose(projectDir = process.cwd(), { cliDir = getPaths().CLI_DIR, nodeVersion = process.version } = {}) {
  const pkg = packageInfo(cliDir);
  const checks = [];
  const add = (name, status, detail, remedy) => checks.push({ name, status, detail, remedy });

  if (nodeSupported(nodeVersion, pkg.engines.node)) {
    add('node', 'pass', `Node ${nodeVersion} satisfies ${pkg.engines.node}.`);
  } else {
    add('node', 'fail', `Node ${nodeVersion} does not satisfy ${pkg.engines.node}.`, `Install or select Node.js ${pkg.engines.node}; use your system's supported Node version manager or installer.`);
  }

  const docsDir = path.join(projectDir, 'docs');
  if (fs.existsSync(docsDir)) {
    add('docs', 'pass', 'docs/ is available.');
  } else {
    add('docs', 'fail', 'docs/ is missing.', 'Create project documentation with sdd-gen /init <feature> or the needed generator command.');
  }

  const context = await checkContext(projectDir);
  if (context.error?.code === 'missing') {
    add('manifest', 'warn', 'Tracked context manifest is missing.', 'Create tracked context with sdd-gen /context build <feature> after generating supported documents.');
  } else if (!context.ok) {
    add('manifest', 'fail', `Tracked context is invalid: ${context.rows.map((row) => `${row.path} (${row.status})`).join(', ')}.`, 'Repair stale or invalid tracked documents, then run sdd-gen /context check.');
  } else {
    add('manifest', 'pass', `Tracked context is valid (${context.rows.length} document${context.rows.length === 1 ? '' : 's'}).`);
  }

  const report = coverage(projectDir);
  if (report.total) {
    add('coverage', 'pass', `Acceptance coverage is available: ${report.covered.length}/${report.total} (${report.percent.toFixed(1)}%).`);
  } else {
    add('coverage', 'warn', 'No acceptance-criteria IDs are available.', 'Add acceptance criteria to project documents, or run sdd-gen /coverage --backfill for supported legacy PRDs.');
  }

  const metadataPath = path.join(cliDir, 'server.json');
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (pkg.mcpName === metadata.name && metadata.version === pkg.version) {
      add('package', 'pass', `Package MCP name matches ${metadata.name}.`);
    } else {
      add('package', 'fail', 'Package MCP metadata does not match server metadata.', 'Reinstall a package release whose package.json mcpName and server.json name/version agree.');
    }
  } catch {
    add('package', 'fail', 'Package MCP metadata is unavailable.', 'Reinstall the package; its shipped server.json and package.json are required for MCP setup.');
  }

  const client = clientConfig(projectDir);
  if (client?.configured) {
    add('mcp-client', 'pass', `MCP client configuration found in ${client.path}.`);
  } else {
    const detail = client?.malformed ? `${client.path} is not valid JSON.` : 'No supported MCP client configuration found.';
    add('mcp-client', 'warn', detail, `Paste this into your MCP client configuration (for example .mcp.json):\n${mcpSnippet()}`);
  }

  return { ok: checks.every((check) => check.status !== 'fail'), checks };
}

function formatDoctorReport(result) {
  return result.checks.map((check) => {
    const remedy = check.remedy ? `\n  remedy: ${check.remedy.replace(/\n/g, '\n  ')}` : '';
    return `${check.name}: ${check.status} — ${check.detail}${remedy}`;
  }).join('\n');
}

function registerDoctorCommand(program) {
  return program
    .command('/doctor')
    .description('Report read-only local setup diagnostics')
    .action(async () => {
      try {
        const result = await diagnose(process.cwd());
        console.log(formatDoctorReport(result));
        if (!result.ok) process.exitCode = 1;
      } catch (error) {
        console.error(`Error running doctor: ${error.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { CLIENT_CONFIGS, SERVER_NAME, diagnose, formatDoctorReport, mcpSnippet, nodeSupported, registerDoctorCommand };
