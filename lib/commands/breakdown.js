const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories, parseUserStories } = require('../utils/file');
const { isTTY, promptInput, offerNextSteps, doneStep } = require('../utils/prompt');
const { writeConfig } = require('../utils/config');

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
    .description('Parse PRD and generate scenario-level documentation (prod, testing, design, tech)')
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
        
        // Extract feature name from PRD if not provided
        if (!featureName) {
          featureName = extractFeatureName(prdPath);
          if (opts.yes || !isTTY()) {
            console.log(chalk.yellow(`No feature name provided, using extracted name: ${featureName}`));
          } else {
            featureName = await promptInput('Feature name', featureName, undefined, opts.yes);
          }
        }
        writeConfig({ lastFeature: featureName }, paths.PROJECT_DIR);
        
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
        
        // Validate that user stories have required fields
        const invalidStories = userStories.filter(story => !story.asA || !story.iWant || !story.soThat);
        if (invalidStories.length > 0) {
          console.warn(chalk.yellow(`Warning: ${invalidStories.length} user story/stories missing required fields (As a, I want, So that)`));
          console.warn(chalk.yellow('These stories will still be processed but may have incomplete information'));
        }
        
        // Create output directory in docs/production/
        const outputDir = path.join(paths.DOCS_PRODUCTION_DIR, featureName);
        await fs.ensureDir(outputDir);
        
        console.log(chalk.bold.cyan(`\n🚀 Breaking down PRD for: ${featureName}\n`));
        console.log(chalk.yellow(`Found ${userStories.length} user stories\n`));
        
        // Generate files for each user acceptance
        const generatedFiles = [];
        
        for (let i = 0; i < userStories.length; i++) {
          const story = userStories[i];
          // Sequence number follows PRD user-story order
          const num = String(i + 1).padStart(2, '0');
          
          console.log(chalk.cyan(`Processing user story ${num}: ${story.title}`));
          
          // Generate prod.md
          const prodTemplatePath = path.join(paths.TEMPLATES_DIR, 'prod-template.md');
          if (await fs.pathExists(prodTemplatePath)) {
            const prodTemplate = await fs.readFile(prodTemplatePath, 'utf-8');
            let prodContent = prodTemplate
              .replace(/<Feature>/g, featureName)
              .replace(/<StoryId>/g, num)
              .replace(/<StoryTitle>/g, story.title)
              .replace(/<StorySlug>/g, story.slug)
              .replace(/<AsA>/g, story.asA)
              .replace(/<IWant>/g, story.iWant)
              .replace(/<SoThat>/g, story.soThat);
            
            // Add acceptance criteria
            if (story.acceptanceCriteria.length > 0) {
              const criteriaText = story.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n');
              prodContent = prodContent.replace(/<AcceptanceCriteria>/g, criteriaText);
            } else {
              prodContent = prodContent.replace(/<AcceptanceCriteria>/g, '- [ ] TBD');
            }
            
            const fileName = `${featureName}-${num}-${story.slug}-prod.md`;
            const prodPath = path.join(outputDir, fileName);
            await fs.writeFile(prodPath, prodContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${fileName}`));
            generatedFiles.push({ story: story.title, file: fileName });
          }
          
          // Generate tech.md
          const techTemplatePath = path.join(paths.TEMPLATES_DIR, 'tech-template.md');
          if (await fs.pathExists(techTemplatePath)) {
            const techTemplate = await fs.readFile(techTemplatePath, 'utf-8');
            let techContent = techTemplate
              .replace(/<Feature>/g, featureName)
              .replace(/<StoryId>/g, num)
              .replace(/<StoryTitle>/g, story.title)
              .replace(/<StorySlug>/g, story.slug)
              .replace(/<AsA>/g, story.asA)
              .replace(/<IWant>/g, story.iWant)
              .replace(/<SoThat>/g, story.soThat);
            
            const fileName = `${featureName}-${num}-${story.slug}-tech.md`;
            const techPath = path.join(outputDir, fileName);
            await fs.writeFile(techPath, techContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${fileName}`));
            generatedFiles.push({ story: story.title, file: fileName });
          }
          
          // Generate design.md
          const designTemplatePath = path.join(paths.TEMPLATES_DIR, 'design-template.md');
          if (await fs.pathExists(designTemplatePath)) {
            const designTemplate = await fs.readFile(designTemplatePath, 'utf-8');
            let designContent = designTemplate
              .replace(/<Feature>/g, featureName)
              .replace(/<StoryId>/g, num)
              .replace(/<StoryTitle>/g, story.title)
              .replace(/<StorySlug>/g, story.slug)
              .replace(/<AsA>/g, story.asA)
              .replace(/<IWant>/g, story.iWant)
              .replace(/<SoThat>/g, story.soThat);
            
            const fileName = `${featureName}-${num}-${story.slug}-design.md`;
            const designPath = path.join(outputDir, fileName);
            await fs.writeFile(designPath, designContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${fileName}`));
            generatedFiles.push({ story: story.title, file: fileName });
          }
          
          // Generate testing.md
          const testingTemplatePath = path.join(paths.TEMPLATES_DIR, 'testing-template.md');
          if (await fs.pathExists(testingTemplatePath)) {
            const testingTemplate = await fs.readFile(testingTemplatePath, 'utf-8');
            let testingContent = testingTemplate
              .replace(/<Feature>/g, featureName)
              .replace(/<StoryId>/g, num)
              .replace(/<StoryTitle>/g, story.title)
              .replace(/<StorySlug>/g, story.slug)
              .replace(/<AsA>/g, story.asA)
              .replace(/<IWant>/g, story.iWant)
              .replace(/<SoThat>/g, story.soThat);
            
            if (story.acceptanceCriteria.length > 0) {
              const criteriaText = story.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n');
              testingContent = testingContent.replace(/<AcceptanceCriteria>/g, criteriaText);
            } else {
              testingContent = testingContent.replace(/<AcceptanceCriteria>/g, '- [ ] TBD');
            }
            
            const fileName = `${featureName}-${num}-${story.slug}-testing.md`;
            const testingPath = path.join(outputDir, fileName);
            await fs.writeFile(testingPath, testingContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${fileName}`));
            generatedFiles.push({ story: story.title, file: fileName });
          }
        }
        
        console.log(chalk.bold.cyan(`\n📝 Breakdown complete! Files generated in: ${outputDir}\n`));
        
        // Show summary mapping
        console.log(chalk.bold.yellow(`📊 Story → File Mapping:\n`));
        userStories.forEach((story, idx) => {
          const num = String(idx + 1).padStart(2, '0');
          console.log(chalk.white(`${idx + 1}. ${story.title}`));
          console.log(chalk.gray(`   → ${featureName}-${num}-${story.slug}-prod.md`));
          console.log(chalk.gray(`   → ${featureName}-${num}-${story.slug}-tech.md`));
          console.log(chalk.gray(`   → ${featureName}-${num}-${story.slug}-design.md`));
          console.log(chalk.gray(`   → ${featureName}-${num}-${story.slug}-testing.md`));
          console.log('');
        });
        
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
            cmd: `sdd-gen /feature-design ${featureName}`
          },
          {
            label: '🧪 Generate QA Test Script',
            value: 'qa-test-script',
            cmd: `sdd-gen /qa-test-script ${featureName}`
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
