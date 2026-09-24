const path = require('path');

const CLI_ROOT_DIR = path.resolve(__dirname, '..', '..');

function getCliVersion(cliDir = CLI_ROOT_DIR) {
  try {
    const pkg = require(path.join(cliDir, 'package.json'));
    return pkg.version || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

module.exports = { getCliVersion, CLI_ROOT_DIR };