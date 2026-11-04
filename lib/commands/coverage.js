const chalk = require('chalk');
const path = require('path');
const { getPaths, validateFeatureName, writeGeneratedFile } = require('../utils/file');
const { coverage, planBackfill } = require('../coverage');

function registerCoverageCommand(program) {
  program
    .command('/coverage [featureName]')
    .description('Report acceptance-criteria references in nested docs and tests')
    .option('--json', 'print machine-readable coverage JSON')
    .option('--min <percent>', 'fail when coverage is below percentage')
    .option('--backfill', 'add missing acceptance-criteria IDs to PRDs')
    .action(async (featureName, options) => {
      try {
        const paths = getPaths();
        if (featureName) featureName = validateFeatureName(featureName);
        const min = options.min === undefined ? null : Number(options.min);
        if (min !== null && (!Number.isFinite(min) || min < 0 || min > 100)) {
          throw new Error('--min must be a number from 0 to 100.');
        }
        let changed = 0;
        if (options.backfill) {
          const updates = planBackfill(paths.PROJECT_DIR, featureName);
          const rootDir = path.join(paths.PROJECT_DIR, 'docs');
          for (const update of updates) {
            await writeGeneratedFile(update.filePath, update.content, {
              rootDir,
              force: true,
              label: 'Backfilled PRD'
            });
            changed += 1;
          }
        }

        const report = coverage(paths.PROJECT_DIR, featureName);
        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else if (!report.total) {
          console.log(chalk.yellow('No acceptance-criteria IDs found. Run sdd-gen /coverage --backfill to add IDs to existing PRDs.'));
        } else {
          console.log(`Acceptance-criteria coverage: ${report.covered.length}/${report.total} (${report.percent.toFixed(1)}%)`);
          if (options.backfill) console.log(`Backfill updated ${changed} PRD file(s).`);
          for (const item of report.covered) console.log(`  covered: ${item.id} — ${item.file}:${item.testLine}`);
          for (const item of report.referencedOnly) console.log(`  referenced-only: ${item.id} — ${item.document}:${item.line}`);
          for (const item of report.missing) console.log(`  missing: ${item.id} — ${item.document}:${item.line}`);
        }

        if (min !== null && report.percent < min) process.exitCode = 1;
      } catch (error) {
        console.error(chalk.red(`Error checking acceptance-criteria coverage: ${error.message}`));
        process.exitCode = 1;
      }
    });
}

module.exports = { registerCoverageCommand };
