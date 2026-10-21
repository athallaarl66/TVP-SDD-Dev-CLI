const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, validateFeatureName, writeGeneratedFile } = require('../utils/file');
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
    // Group by slug so files from a different scenario that reuses the same
    // number are never mixed into one brief.
    const bySlug = {};
    for (const file of files) {
      const m = file.match(SCENARIO_FILE_RE);
      if (!m || m[1] !== name || m[2] !== num) continue;
      const slug = m[3];
      const type = m[4];
      bySlug[slug] = bySlug[slug] || {};
      bySlug[slug][type] = file;
    }
    const slug = Object.keys(bySlug).find((candidate) => bySlug[candidate].prod);
    if (slug) return { feature: name, slug, files: bySlug[slug] };
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

const USER_STORY_HEADING = '## User Story';
const NEXT_SECTION_RE = /\n---|\n#{2,} /;

// Pull the "User Story" section out of the -prod.md breakdown file. The
// section runs until the next horizontal rule or heading.
async function readUserStory(prodPath) {
  try {
    const content = await fs.readFile(prodPath, 'utf-8');
    const normalized = content.replace(/\r\n?/g, '\n');
    const start = normalized.indexOf(USER_STORY_HEADING);
    if (start === -1) {
      return normalized.trim() || 'Not specified in the -prod.md file.';
    }
    const rest = normalized.slice(start + USER_STORY_HEADING.length);
    const stop = rest.search(NEXT_SECTION_RE);
    const story = (stop === -1 ? rest : rest.slice(0, stop)).trim();
    return story || 'Not specified in the -prod.md file.';
  } catch (error) {
    return `Could not read ${path.basename(prodPath)}: ${error.message}`;
  }
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
  const userStory = files.prod
    ? await readUserStory(path.join(outputDir, files.prod))
    : 'Not specified.';
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
    userStory,
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
        } else {
          featureName = validateFeatureName(featureName);
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
        const replaced = await writeGeneratedFile(briefPath, briefContent, {
          rootDir: path.join(paths.DOCS_PRODUCTION_DIR, scenario.feature),
          force: Boolean(opts.force),
          label: 'Implementation brief'
        });
        console.log(chalk.green(`✅ Implementation brief ${replaced ? 'replaced' : 'created'}: ${briefPath}`));

      } catch (error) {
        console.error(chalk.red('Error generating implementation brief:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = {
  registerImplementCodeCommand,
  findScenario,
  listScenarioNumbers,
  buildBrief,
  readUserStory,
  SCENARIO_FILE_RE
};
