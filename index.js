#!/usr/bin/env node

const { Command } = require('commander');
const { getCliVersion, CLI_ROOT_DIR } = require('./lib/utils/version');

const program = new Command();

program
  .version(getCliVersion(), '-v, --version')
  .option('-y, --yes', 'run non-interactively, using defaults instead of prompts');

// Passed to command modules; parsed option values (incl. `yes`) are read lazily
// at action time since they are only populated after program.parse().
const getOpts = () => program.opts();

// Import command modules
const { registerPrdCommand } = require('./lib/commands/prd');
const { registerBreakdownCommand } = require('./lib/commands/breakdown');
const { registerTechnicalCommand } = require('./lib/commands/technical');
const { registerQATestScriptCommand } = require('./lib/commands/qa-test-script');
const { registerQATestRunCommand } = require('./lib/commands/qa-test-run');
const { registerQAReportCommand } = require('./lib/commands/qa-report');
const { registerInstallCommand } = require('./lib/commands/install');
const { registerInitCommand } = require('./lib/commands/init');
const { registerDesignSystemCommand } = require('./lib/commands/design-system');
const { registerFeatureDesignCommand } = require('./lib/commands/feature-design');
const { registerImplementCodeCommand } = require('./lib/commands/implement-code');

// Register all commands
registerPrdCommand(program, getOpts);
registerBreakdownCommand(program, getOpts);
registerTechnicalCommand(program, getOpts);
registerQATestScriptCommand(program, getOpts);
registerQATestRunCommand(program, getOpts);
registerQAReportCommand(program, getOpts);
registerInstallCommand(program, getOpts);
registerInitCommand(program, getOpts);
registerDesignSystemCommand(program, getOpts);
registerFeatureDesignCommand(program, getOpts);
registerImplementCodeCommand(program, getOpts);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}