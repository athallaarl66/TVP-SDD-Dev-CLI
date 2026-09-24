const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths } = require('../utils/file');
const { readConfig, writeConfig } = require('../utils/config');

const SCENARIO_TYPES = ['prod', 'tech', 'design', 'testing'];
// Matches {feature}-{no}-{slug}-{type}.md, e.g. user-auth-02-register-prod.md
const SCENARIO_FILE_RE = /^(.+)-(\d{2})-([a-z0-9-]+?)-(prod|tech|design|testing)\.md$/i;

// Find scenario files under docs/production/. Returns
// { feature, slug, files: {type: filename} } or null when not found.
async function findScenario(featureName, num) {
  const paths = getPaths();
  const productionDir = paths.DOCS_PRODUCTION_DIR;
  const dirs = featureName
    ? [path.join(productionDir, featureName)]
    : (await fs.readdir(productionDir).catch(() => [])).map((d) => path.join(productionDir, d));

  for (const dir of dirs) {
    const files = await fs.readdir(dir).catch(() => []);
    if (files.length === 0) continue;
    const name = path.basename(dir);
    const map = {};
    let slug = null;
    for (const file of files) {
      const m = file.match(SCENARIO_FILE_RE);
      if (m && m[1] === name && m[2] === num) {
        map[m[4] === 'prod' ? 'prod' : m[4]] = file;
        if (!slug) slug = m[3];
      }
    }
    if (map.prod) return { feature: name, slug, files: map };
  }
  return null;
}

// List available scenario numbers for a feature (or all features when none given).
async function listScenarioNumbers(featureName) {
  const paths = getPaths();
  const productionDir = paths.DOCS_PRODUCTION_DIR;
  const numbers = new Set();
  const dirs = featureName
    ? [path.join(productionDir, featureName)]
    : (await fs.readdir(productionDir).catch(() => [])).map((d) => path.join(productionDir, d));
  for (const dir of dirs) {
    const files = await fs.readdir(dir).catch(() => []);
    for (const f of files) {
      const m = f.match(SCENARIO_FILE_RE);
      if (m) numbers.add(m[2]);
    }
  }
  return [...numbers].sort();
}

async function buildBrief(paths, scenarioFeature, num, slug, files) {
  const outputDir = path.join(paths.DOCS_PRODUCTION_DIR, scenarioFeature);
  const list = [];
  for (const type of SCENARIO_TYPES) {
    const fileName = files[type];
    if (!fileName) continue;
    const abs = path.join(outputDir, fileName);
    list.push(`- [ ] Fill & implement: \`${path.relative(paths.PROJECT_DIR, abs)}\` — ${type}`);
  }
  return [
    `# Implementation Brief: ${scenarioFeature} — Scenario ${num}`,
    '',
    `Implement the user story below, guided by the tech/design/testing files for scenario \`${num}\`.`,
    '',
    '## Source Breakdown Files',
    ...list,
    '',
    '## User Story',
    '```',
    '',
    '```',
    '',
    '## Task',
    '- Verify every acceptance criterion in the `-prod.md` file.',
    '- Follow API, database, and permission specs in `-tech.md`.',
    '- Match design guidance in `-design.md`.',
    '- Confirm behavior against test cases in `-testing.md`.',
    ''
  ].join('\n');
}

function registerImplementCodeCommand(program, getOpts) {
  program
    .command('/implement-code <scenarioNumber> [featureName]')
    .alias('/sdd-implement-code')
    .description('Generate implementation brief for a numbered user story scenario from breakdown files')
    .action(async (scenarioNumber, featureName) => {
      try {
        const opts = getOpts();
        const paths = getPaths();
        const num = String(scenarioNumber).padStart(2, '0');

        if (!featureName) {
          const config = readConfig(paths.PROJECT_DIR);
          featureName = config.lastFeature || null;
        }

        const scenario = await findScenario(featureName, num);
        if (!scenario) {
          const available = await listScenarioNumbers(featureName);
          console.error(chalk.red(`Error: no breakdown files found for scenario ${num}${featureName ? ` of feature "${featureName}"` : ''}.`));
          console.error(chalk.yellow(`Available scenarios: ${available.join(', ') || 'none'}`));
          console.error(chalk.yellow(`Run 'sdd-gen /breakdown-task <prd-file> <featureName>' first to generate breakdown files`));
          process.exit(1);
        }

        writeConfig({ lastFeature: scenario.feature }, paths.PROJECT_DIR);

        const briefContent = await buildBrief(paths, scenario.feature, num, scenario.slug, scenario.files);
        const briefPath = path.join(paths.DOCS_PRODUCTION_DIR, scenario.feature, `${scenario.feature}-${num}-${scenario.slug}-implement.md`);
        await fs.writeFile(briefPath, briefContent, 'utf-8');
        console.log(chalk.green(`✅ Implementation brief created: ${briefPath}`));

      } catch (error) {
        console.error(chalk.red('Error generating implementation brief:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerImplementCodeCommand, findScenario, listScenarioNumbers, buildBrief, SCENARIO_FILE_RE };