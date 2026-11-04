const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, validateFeatureName, writeGeneratedFile } = require('../utils/file');
const { readConfig, writeConfig } = require('../utils/config');

const SCENARIO_TYPES = ['prod', 'tech', 'design', 'testing'];
// Matches {feature}-{no}-{slug}-{type}.md, e.g. user-auth-02-register-prod.md
const SCENARIO_FILE_RE = /^(.+)-(\d{2})-([a-z0-9-]+?)-(prod|tech|design|testing)\.md$/i;

async function listFiles(dir, files = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) await listFiles(fullPath, files);
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

// Find legacy flat or Epic-nested scenario files. A number must resolve to one
// identity; ambiguity is reported rather than mixing files across stories.
async function findScenario(featureName, num) {
  const paths = getPaths();
  const productionDir = paths.DOCS_PRODUCTION_DIR;
  const featureDirs = featureName
    ? [path.join(productionDir, featureName)]
    : (await fs.readdir(productionDir, { withFileTypes: true }).catch(() => []))
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(productionDir, entry.name));
  const matches = [];

  for (const featureDir of featureDirs) {
    const feature = path.basename(featureDir);
    const grouped = new Map();
    for (const fullPath of await listFiles(featureDir)) {
      const relative = path.relative(featureDir, fullPath);
      const parts = relative.split(path.sep);
      const file = parts[parts.length - 1];
      let identity;
      let slug;
      let type;
      let storyDir;

      if (parts.length === 1) {
        const legacy = file.match(SCENARIO_FILE_RE);
        if (!legacy || legacy[1] !== feature || legacy[2] !== num) continue;
        identity = `flat:${legacy[3]}`;
        slug = legacy[3];
        type = legacy[4].toLowerCase();
        storyDir = featureDir;
      } else if (parts.length === 3 && SCENARIO_TYPES.includes(path.basename(file, '.md').toLowerCase()) && file.toLowerCase().endsWith('.md')) {
        const story = parts[1].match(/^(\d{2})-(.+)$/);
        if (!story || story[1] !== num) continue;
        identity = `nested:${parts[0]}/${parts[1]}`;
        slug = story[2];
        type = path.basename(file, '.md').toLowerCase();
        storyDir = path.dirname(fullPath);
      } else {
        continue;
      }

      if (!grouped.has(identity)) grouped.set(identity, { feature, slug, files: {}, storyDir, epic: parts.length === 3 ? parts[0] : null });
      grouped.get(identity).files[type] = relative;
    }
    for (const candidate of grouped.values()) {
      if (candidate.files.prod) matches.push(candidate);
    }
  }
  if (matches.length > 1) return { ambiguous: true, candidates: matches };
  return matches[0] || null;
}

// List available scenario numbers for a feature (or all features when none given).
async function listScenarioNumbers(featureName) {
  const paths = getPaths();
  const productionDir = paths.DOCS_PRODUCTION_DIR;
  const featureDirs = featureName
    ? [path.join(productionDir, featureName)]
    : (await fs.readdir(productionDir, { withFileTypes: true }).catch(() => []))
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(productionDir, entry.name));
  const numbers = new Set();
  for (const featureDir of featureDirs) {
    for (const fullPath of await listFiles(featureDir)) {
      const relative = path.relative(featureDir, fullPath);
      const parts = relative.split(path.sep);
      const legacy = parts.length === 1 && path.basename(fullPath).match(SCENARIO_FILE_RE);
      const nested = parts.length === 3 && /^(\d{2})-.+$/.test(parts[1]) && SCENARIO_TYPES.includes(path.basename(fullPath, '.md').toLowerCase());
      if (legacy) numbers.add(legacy[2]);
      else if (nested) numbers.add(parts[1].slice(0, 2));
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

async function buildBrief(paths, scenario, num) {
  const featureDir = path.join(paths.DOCS_PRODUCTION_DIR, scenario.feature);
  const list = [];
  for (const type of SCENARIO_TYPES) {
    const relative = scenario.files[type];
    if (!relative) continue;
    const abs = path.join(featureDir, relative);
    list.push(`- [ ] Fill & implement: \`${path.relative(paths.PROJECT_DIR, abs)}\` — ${type}`);
  }
  const userStory = scenario.files.prod
    ? await readUserStory(path.join(featureDir, scenario.files.prod))
    : 'Not specified.';
  return [
    `# Implementation Brief: ${scenario.feature} — Scenario ${num}`,
    scenario.epic ? `Epic: ${scenario.epic}` : null,
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
    .description('Generate implementation brief from a nested or legacy flat story; reject ambiguous matches')
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
        if (scenario?.ambiguous) {
          console.error(chalk.red(`Error: scenario ${num} is ambiguous across multiple breakdown stories:`));
          scenario.candidates.forEach(candidate => console.error(chalk.yellow(`  - ${candidate.epic || 'legacy'} / ${candidate.slug}`)));
          console.error(chalk.yellow('Select or rename stories so this feature-wide number identifies one story.'));
          process.exit(1);
        }
        if (!scenario) {
          const available = await listScenarioNumbers(featureName);
          console.error(chalk.red(`Error: no breakdown files found for scenario ${num}${featureName ? ` of feature "${featureName}"` : ''}.`));
          console.error(chalk.yellow(`Available scenarios: ${available.join(', ') || 'none'}`));
          console.error(chalk.yellow(`Run 'sdd-gen /breakdown-task <prd-file> <featureName>' first to generate breakdown files`));
          process.exit(1);
        }

        const briefContent = await buildBrief(paths, scenario, num);
        const briefPath = path.join(
          scenario.storyDir,
          scenario.epic ? 'implement.md' : `${scenario.feature}-${num}-${scenario.slug}-implement.md`
        );
        const replaced = await writeGeneratedFile(briefPath, briefContent, {
          rootDir: scenario.storyDir,
          force: Boolean(opts.force),
          label: 'Implementation brief'
        });
        writeConfig({ lastFeature: scenario.feature }, paths.PROJECT_DIR);
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
