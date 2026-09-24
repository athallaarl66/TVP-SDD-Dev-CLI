const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const CONFIG_FILENAME = 'sdd.config.json';
const CONFIG_KEYS = ['projectType', 'testFramework', 'lastFeature'];

function getConfigPath(projectDir = process.cwd()) {
  return path.join(projectDir, CONFIG_FILENAME);
}

function readConfig(projectDir = process.cwd()) {
  try {
    const configPath = getConfigPath(projectDir);
    if (!fs.existsSync(configPath)) return {};
    const data = fs.readJsonSync(configPath);
    return data && typeof data === 'object' ? data : {};
  } catch (e) {
    return {};
  }
}

function writeConfig(patch, projectDir = process.cwd()) {
  const current = readConfig(projectDir);
  const next = { ...current };
  for (const key of CONFIG_KEYS) {
    if (Object.prototype.hasOwnProperty.call(patch, key) && patch[key] !== undefined) {
      next[key] = patch[key];
    }
  }
  try {
    fs.writeJsonSync(getConfigPath(projectDir), next, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(chalk.yellow(`⚠️  Warning: could not write config file: ${error.message}`));
    return false;
  }
}

module.exports = { CONFIG_FILENAME, CONFIG_KEYS, getConfigPath, readConfig, writeConfig };