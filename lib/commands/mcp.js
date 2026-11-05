function registerMcpCommand(program) {
  return program
    .command('mcp')
    .description('Start MCP server over stdio')
    .action(() => {
      require('../mcp').start(process.cwd());
    });
}

module.exports = { registerMcpCommand };
