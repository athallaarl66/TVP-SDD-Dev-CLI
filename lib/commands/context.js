const chalk = require('chalk');
const { getPaths, validateFeatureName } = require('../utils/file');

function registerContextCommand(program) {
  const command = program
    .command('/context <action> [featureName]')
    .description('Check tracked document freshness or build bounded feature context')
    .option('--budget <characters>', 'maximum context characters', '24000')
    .option('--terse', 'reduce structural prose')
    .action(async (action, featureName, options) => {
      const { checkContext, writeContext } = require('../context');
      const paths = getPaths();
      try {
        if (action === 'check') {
          const result = await checkContext(paths.PROJECT_DIR);
          for (const row of result.rows) console.log(`${row.status}: ${row.path}`);
          if (!result.ok) process.exitCode = 1;
          return;
        }
        if (action !== 'build') throw new Error('Use /context check or /context build <feature>.');
        featureName = validateFeatureName(featureName);
        const budget = Number(options.budget);
        if (!Number.isSafeInteger(budget) || budget < 1) throw new Error('--budget must be a positive integer.');
        const result = await writeContext(paths.PROJECT_DIR, featureName, { budget, terse: Boolean(options.terse) });
        console.log(chalk.green(`Context created: ${result.output}`));
        if (result.metadata.omittedSections.length) console.log(`Omitted: ${result.metadata.omittedSections.join(', ')}`);
      } catch (error) {
        console.error(chalk.red(`Error handling context: ${error.message}`));
        process.exitCode = 1;
      }
    });
  return command;
}

module.exports = { registerContextCommand };
