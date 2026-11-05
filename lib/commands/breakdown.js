const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories, parseUserStories, validateFeatureName, writeGeneratedFile } = require('../utils/file');
const { isTTY, promptInput, offerNextSteps, doneStep } = require('../utils/prompt');
const { writeConfig } = require('../utils/config');
const { recordDocument } = require('../manifest');

// Extract feature name from PRD path.
// Handles both flat layout (docs/features/<feature>-prd.md) and folder layout (docs/features/<feature>/prd.md)
function extractFeatureName(prdFile) {
  const ext = path.extname(prdFile);
  const base = path.basename(prdFile, ext);
  if (/^prd$/i.test(base)) {
    return path.basename(path.dirname(prdFile));
  }
  return base.replace(/-prd$/i, '');
}

function registerBreakdownCommand(program, getOpts) {
  program
    .command('/breakdown-task <prdFile> [featureName]')
    .alias('/sdd-breakdown-task')
    .description('Parse PRD and generate four Epic-nested story documents (legacy flat breakdowns remain readable)')
    .action(async (prdFile, featureName) => {
      try {
        const opts = getOpts();
        const paths = getPaths();
        
        // Resolve PRD file path
        const prdPath = path.resolve(paths.PROJECT_DIR, prdFile);
        
        // Check if PRD file exists
        if (!(await fs.pathExists(prdPath))) {
          console.error(chalk.red(`Error: PRD file not found: ${prdFile}`));
          console.error(chalk.yellow(`Run 'sdd-gen /prd <featureName>' first to generate the PRD document`));
          process.exit(1);
        }
        
        // Read PRD content
        const prdContent = await fs.readFile(prdPath, 'utf-8');
        const prdRelativePath = path.relative(paths.PROJECT_DIR, prdPath);
        const sourcePaths = prdRelativePath === '..' || prdRelativePath.startsWith(`..${path.sep}`) || path.isAbsolute(prdRelativePath)
          ? []
          : [prdRelativePath];
        
        // Extract feature name from PRD if not provided
        if (!featureName) {
          featureName = extractFeatureName(prdPath);
          if (opts.yes || !isTTY()) {
            console.log(chalk.yellow(`No feature name provided, using extracted name: ${featureName}`));
          } else {
            featureName = await promptInput('Feature name', featureName, undefined, opts.yes);
          }
        }
        // Validate before any config or filesystem side effect.
        featureName = validateFeatureName(featureName);

        // Parse user stories from PRD
        const userStories = parseUserStories(prdContent);
        
        if (userStories.length === 0) {
          console.error(chalk.yellow('Warning: No user stories found in PRD'));
          console.log(chalk.yellow('Make sure your PRD has a "User Stories" section with user story format'));
          console.log(chalk.yellow('Expected format:'));
          console.log(chalk.gray('  #### User Story 1: CV Upload'));
          console.log(chalk.gray('  **As a** Recruiter'));
          console.log(chalk.gray('  **I want** to upload CV'));
          console.log(chalk.gray('  **So that** I can process candidates'));
          console.log(chalk.gray('  **Acceptance Criteria:**'));
          console.log(chalk.gray('  - [ ] Criteria 1'));
          console.log(chalk.yellow('Continuing without generating breakdown files...'));
          return;
        }

        const unassignedStories = userStories.filter(story => !story.epicTitle);
        if (unassignedStories.length > 0) {
          console.error(chalk.red(`Error: ${unassignedStories.length} user story/stories are not assigned to an Epic.`));
          console.error(chalk.yellow('Assign every story beneath a "### Epic <n>: <title>" heading. Nothing was written.'));
          process.exit(1);
        }
        // Validate that user stories have required fields
        const invalidStories = userStories.filter(story => !story.asA || !story.iWant || !story.soThat);
        if (invalidStories.length > 0) {
          console.warn(chalk.yellow(`Warning: ${invalidStories.length} user story/stories missing required fields (As a, I want, So that)`));
          console.warn(chalk.yellow('These stories will still be processed but may have incomplete information'));
        }
        
        // Preflight all story destinations before config or output writes.
        const outputDir = path.join(paths.DOCS_PRODUCTION_DIR, featureName);
        const documentTypes = ['prod', 'tech', 'design', 'testing'];
        const templateContents = {};
        for (const type of documentTypes) {
          const templatePath = path.join(paths.TEMPLATES_DIR, `${type}-template.md`);
          if (!(await fs.pathExists(templatePath))) {
            console.error(chalk.red(`Error: required template not found: ${templatePath}. No documentation was generated.`));
            process.exit(1);
          }
          templateContents[type] = await fs.readFile(templatePath, 'utf-8');
        }
        const plannedFiles = [];
        userStories.forEach((story, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          const storyDir = path.join(outputDir, story.epicSlug, `${num}-${story.slug}`);
          for (const type of documentTypes) plannedFiles.push(path.join(storyDir, `${type}.md`));
        });
        const plannedPaths = new Set();
        const collisions = [];
        for (const filePath of plannedFiles) {
          const target = path.resolve(filePath).toLowerCase();
          if (plannedPaths.has(target)) collisions.push(filePath);
          plannedPaths.add(target);
        }
        if (collisions.length > 0) {
          console.error(chalk.red('Error: breakdown paths collide after slug normalization:'));
          collisions.forEach((name) => console.error(chalk.yellow(`  - ${name}`)));
          console.error(chalk.yellow('Nothing was written.'));
          process.exit(1);
        }
        const existing = [];
        for (const filePath of plannedFiles) {
          if (!opts.force && await fs.pathExists(filePath)) existing.push(filePath);
        }
        if (existing.length > 0) {
          console.error(chalk.red(`Error: ${existing.length} breakdown file(s) already exist:`));
          existing.forEach((filePath) => console.error(chalk.yellow(`  - ${path.relative(outputDir, filePath)}`)));
          console.error(chalk.yellow('Nothing was written. Re-run with --force to overwrite them.'));
          process.exit(1);
        }

        const generatedFiles = [];
        const plannedDocuments = [];
        userStories.forEach((story, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          const storyDir = path.join(outputDir, story.epicSlug, `${num}-${story.slug}`);
          const replacements = {
            '<Feature>': featureName,
            '<StoryId>': num,
            '<StoryTitle>': story.title,
            '<StorySlug>': story.slug,
            '<AsA>': story.asA,
            '<IWant>': story.iWant,
            '<SoThat>': story.soThat
          };
          for (const type of documentTypes) {
            let content = Object.entries(replacements).reduce(
              (result, [token, value]) => result.replace(new RegExp(token, 'g'), value),
              templateContents[type]
            );
            if (type === 'prod' || type === 'testing') {
              const criteriaText = story.acceptanceCriteria.length
                ? story.acceptanceCriteria.map(c => `- [${c.checked ? 'x' : ' '}] ${c.text}`).join(String.fromCharCode(10))
                : '- [ ] TBD';
              content = content.replace(/<AcceptanceCriteria>/g, criteriaText);
            }
            plannedDocuments.push({
              filePath: path.join(storyDir, `${type}.md`),
              content,
              story: story.title,
              num,
              type
            });
          }
        });

        writeConfig({ lastFeature: featureName }, paths.PROJECT_DIR);
        console.log(chalk.bold.cyan(`\\n🚀 Breaking down PRD for: ${featureName}\\n`));
        console.log(chalk.yellow(`Found ${userStories.length} user stories\\n`));
        for (const document of plannedDocuments) {
          await writeGeneratedFile(document.filePath, document.content, {
            rootDir: outputDir,
            force: Boolean(opts.force),
            label: 'Breakdown file'
          });
          await recordDocument(paths.PROJECT_DIR, {
            kind: 'production', feature: featureName, filePath: document.filePath, sourcePaths
          });
          const relativePath = path.relative(outputDir, document.filePath);
          console.log(chalk.green(`  ✅ Created: ${relativePath}`));
          generatedFiles.push({ story: document.story, file: relativePath });
        }
        
        console.log(chalk.bold.cyan(`\n📝 Breakdown complete! Files generated in: ${outputDir}\n`));
        
        // Show nested story-to-file mapping
        console.log(chalk.bold.yellow(`📊 Story → File Mapping:\n`));
        generatedFiles.forEach(({ story, file }) => {
          console.log(chalk.white(story));
          console.log(chalk.gray(`   → ${file}`));
        });
        console.log('');
        
        console.log(chalk.yellow(`Next steps:\n`));
        console.log(chalk.yellow(`1. Fill in the generated breakdown files with scenario-specific details`));
        console.log(chalk.yellow(`2. Implement scenarios via the sdd-implement-code skill (or run: sdd-gen /qa-test-script ${featureName})\n`));

        await offerNextSteps([
          {
            label: '▶️ Implement scenario (via sdd-implement-code skill)',
            value: 'implement',
            usage: `Invoke /implement-code with feature "${featureName}" and a scenario number (e.g. 01) after filling in the breakdown files.`
          },
          {
            label: '🎨 Generate Feature Design',
            value: 'feature-design',
            args: ['/feature-design', featureName]
          },
          {
            label: '🧪 Generate QA Test Script',
            value: 'qa-test-script',
            args: ['/qa-test-script', featureName]
          },
          doneStep()
        ], opts.yes);
        
      } catch (error) {
        console.error(chalk.red('Error generating breakdown files:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerBreakdownCommand };
