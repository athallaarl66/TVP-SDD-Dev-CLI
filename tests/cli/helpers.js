const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const CLI_DIR = path.resolve(__dirname, '..', '..');
const INDEX = path.join(CLI_DIR, 'index.js');

function runCli(args, cwd) {
  return spawnSync(process.execPath, [INDEX, ...args], {
    cwd: cwd || CLI_DIR,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' }
  });
}

function runNode(script, cwd) {
  return spawnSync(process.execPath, ['-e', script], {
    cwd: cwd || CLI_DIR,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' }
  });
}

function tmpProject() {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'sdd-test-'));
  return dir;
}

module.exports = { CLI_DIR, INDEX, runCli, runNode, tmpProject };