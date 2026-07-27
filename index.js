#!/usr/bin/env node

const { Command } = require('commander');

const program = new Command();

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

// Register all commands
registerPrdCommand(program);
registerBreakdownCommand(program);
registerTechnicalCommand(program);
registerQATestScriptCommand(program);
registerQATestRunCommand(program);
registerQAReportCommand(program);
registerInstallCommand(program);
registerInitCommand(program);
registerDesignSystemCommand(program);
registerFeatureDesignCommand(program);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
