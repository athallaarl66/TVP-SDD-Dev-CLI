const { getPaths } = require('../utils/file');

function collect(value, previous) { return [...previous, value]; }

function registerRememberCommand(program) {
  return program.command('/remember <action> [id]')
    .description('Add, confirm, supersede, recall, or inspect local memory')
    .option('--kind <kind>', 'memory kind: ADR, REQ, or NOTE')
    .option('--content <text>', 'memory content')
    .option('--feature <feature>', 'feature filter or association')
    .option('--tag <tag>', 'tag filter or association (repeatable)', collect, [])
    .option('--ref <path>', 'project-relative reference (repeatable)', collect, [])
    .option('--status <status>', 'recall status filter')
    .option('--query <text>', 'lexical recall query')
    .action(async (action, id, options) => {
      try {
        const memory = require('../memory');
        const root = getPaths().PROJECT_DIR;
        let result;
        if (action === 'add' || action === 'supersede') {
          if ((action === 'add' && id) || (action === 'supersede' && !id)) throw new Error('Use /remember add or /remember supersede <id>.');
          const input = { content: options.content };
          if (action === 'add') input.kind = options.kind;
          else if (options.kind) throw new Error('Replacement kind is allocated automatically.');
          if (options.feature !== undefined) input.feature = options.feature;
          if (options.tag.length) input.tags = options.tag;
          if (options.ref.length) input.refs = options.ref;
          result = action === 'add' ? await memory.add(root, input) : await memory.supersede(root, id, input);
        } else if (action === 'confirm') {
          if (!id) throw new Error('Use /remember confirm <id>.');
          result = await memory.confirm(root, id);
        } else if (action === 'recall') {
          if (id) throw new Error('Use /remember recall with filters.');
          result = await memory.recall(root, { kind: options.kind, feature: options.feature, status: options.status, tags: options.tag, query: options.query });
        } else if (action === 'history') {
          if (!id) throw new Error('Use /remember history <id>.');
          const entries = await memory.list(root);
          if (!entries.some((entry) => entry.id === id)) throw new Error(`Memory not found: ${id}`);
          const chain = new Set([id]);
          let size;
          do {
            size = chain.size;
            for (const entry of entries) {
              if (entry.supersededBy && (chain.has(entry.id) || chain.has(entry.supersededBy))) {
                chain.add(entry.id); chain.add(entry.supersededBy);
              }
            }
          } while (chain.size !== size);
          result = entries.filter((entry) => chain.has(entry.id)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        } else throw new Error('Use /remember add, confirm, supersede, recall, or history.');
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(`Error handling memory: ${error.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerRememberCommand };
