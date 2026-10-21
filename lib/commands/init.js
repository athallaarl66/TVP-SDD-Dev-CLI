const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const {
  getPaths,
  ensureDirectories,
  fillDocTemplate,
  validateFeatureName,
  writeGeneratedFile
} = require('../utils/file');
const { writeConfig } = require('../utils/config');

function registerInitCommand(program, getOpts) {
  program
    .command('/init <featureName>')
    .description('Generate all documentation (PRD, Technical, Spec Test, QA Report) at once')
    .action(async (featureName) => {
      try {
        const opts = getOpts();
        const paths = getPaths();
        featureName = validateFeatureName(featureName);

        const templates = [
          { name: 'PRD', template: 'prd-template.md', outputDir: paths.DOCS_FEATURES_DIR, fileName: `${featureName}-prd.md` },
          { name: 'Technical Design', template: 'technical-template.md', outputDir: paths.DOCS_FEATURES_DIR, fileName: `${featureName}-technical.md` },
          { name: 'Spec Test', template: 'testing-template.md', outputDir: path.join(paths.DOCS_TEST_REPORTS_DIR, featureName), fileName: `${featureName}-spec-test.md` },
          { name: 'QA Report', template: 'qa-report-template.md', outputDir: path.join(paths.DOCS_TEST_REPORTS_DIR, featureName), fileName: `${featureName}-qa-report.md` }
        ];

        // Validate every template before writing anything, so a broken install
        // fails instead of silently producing partial documentation.
        const missing = [];
        for (const doc of templates) {
          if (!(await fs.pathExists(path.join(paths.TEMPLATES_DIR, doc.template)))) {
            missing.push(doc.template);
          }
        }
        if (missing.length > 0) {
          console.error(chalk.red(`❌ Error: missing template(s) in CLI templates directory: ${missing.join(', ')}`));
          console.error(chalk.yellow(`Looked in: ${paths.TEMPLATES_DIR}`));
          console.error(chalk.yellow('No documentation was generated. Reinstall the CLI and retry.'));
          process.exit(1);
        }

        writeConfig({ lastFeature: featureName }, paths.PROJECT_DIR);
        await ensureDirectories(paths);

        console.log(chalk.bold.cyan(`\n🚀 Initializing documentation for: ${featureName}\n`));

        let replacedCount = 0;
        for (const doc of templates) {
          const templateContent = await fs.readFile(path.join(paths.TEMPLATES_DIR, doc.template), 'utf-8');
          const filledContent = await fillDocTemplate(templateContent, featureName, paths.PROJECT_DIR);
          const outputPath = path.join(doc.outputDir, doc.fileName);
          const replaced = await writeGeneratedFile(outputPath, filledContent, {
            rootDir: paths.DOCS_DIR,
            force: Boolean(opts.force),
            label: `${doc.name} document`
          });
          if (replaced) replacedCount++;
          console.log(chalk.green(`✅ ${doc.name} ${replaced ? 'replaced' : 'created'}: ${outputPath}`));
        }

        console.log(chalk.bold.cyan(`\n📝 Documentation initialized! Next steps:\n`));
        if (replacedCount > 0) {
          console.log(chalk.yellow(`   ${replacedCount} existing file(s) were replaced because --force was set.`));
        }
        console.log(chalk.yellow(`1. Fill in the generated documents in docs/features/ and docs/test-reports/ folders`));
        console.log(chalk.yellow(`2. Run: sdd-gen /feature-design ${featureName} to create feature-level design`));
        console.log(chalk.yellow(`3. Run: sdd-gen /qa-test-script ${featureName}`));
        console.log(chalk.yellow(`4. Run: sdd-gen /qa-test-run ${featureName}\n`));

      } catch (error) {
        console.error(chalk.red('Error initializing documentation:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerInitCommand };
