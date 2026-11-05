const fs = require('fs/promises');
const path = require('path');
const { CliError, assertInside, assertResolvedInside } = require('./utils/file');

const KINDS = new Set(['ADR', 'REQ', 'NOTE']);
const ID = /^(ADR|REQ|NOTE)-(\d{3,})$/;

function memoryDir(root) { return path.join(path.resolve(root), '.sdd', 'memory'); }

async function target(root, id) {
  if (typeof id !== 'string' || !ID.test(id)) throw new CliError('Invalid memory ID.');
  const dir = memoryDir(root);
  const file = path.join(dir, `${id}.json`);
  assertInside(root, file);
  await assertResolvedInside(root, dir);
  await assertResolvedInside(dir, file);
  return file;
}

async function references(root, refs) {
  if (!Array.isArray(refs)) throw new CliError('Memory refs must be an array.');
  const result = [];
  for (const ref of refs) {
    if (typeof ref !== 'string' || !ref || path.isAbsolute(ref) || path.win32.isAbsolute(ref) || ref.split(/[\\/]/).includes('..')) {
      throw new CliError(`Invalid memory reference: ${ref}`);
    }
    const file = path.resolve(root, ref);
    assertInside(root, file);
    await assertResolvedInside(root, file);
    const stat = await fs.stat(file);
    if (!stat.isFile()) throw new CliError(`Memory reference is not a file: ${ref}`);
    result.push(path.relative(root, file).split(path.sep).join('/'));
  }
  return [...new Set(result)].sort();
}

async function read(root, id) {
  const file = await target(root, id);
  const entry = JSON.parse(await fs.readFile(file, 'utf8'));
  if (!entry || entry.id !== id || !KINDS.has(entry.kind) || !['draft', 'confirmed', 'superseded'].includes(entry.status) || !Array.isArray(entry.refs) || !Number.isFinite(entry.baseline)) {
    throw new CliError(`Invalid memory entry: ${id}`);
  }
  if (entry.status === 'confirmed') {
    for (const ref of entry.refs) {
      try {
        await references(root, [ref]);
        if ((await fs.stat(path.resolve(root, ref))).mtimeMs > entry.baseline) return { ...entry, status: 'stale' };
      } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return { ...entry, status: 'stale' };
        throw error;
      }
    }
  }
  return entry;
}

async function list(root) {
  const dir = memoryDir(root);
  await assertResolvedInside(root, dir);
  let names;
  try { names = await fs.readdir(dir); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const entries = [];
  for (const name of names.sort()) {
    const match = name.match(/^((?:ADR|REQ|NOTE)-\d{3,})\.json$/);
    if (match) entries.push(await read(root, match[1]));
  }
  return entries;
}

async function add(root, input) {
  if (!input || typeof input !== 'object' || Object.hasOwn(input, 'id')) throw new CliError('Memory IDs are allocated automatically.');
  const { kind, content, feature = '', tags = [], refs = [] } = input;
  if (!KINDS.has(kind) || typeof content !== 'string' || !content.trim() || typeof feature !== 'string' || !Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    throw new CliError('Invalid memory entry.');
  }
  const checkedRefs = await references(root, refs);
  const dir = memoryDir(root);
  await assertResolvedInside(root, dir);
  await fs.mkdir(dir, { recursive: true });
  await assertResolvedInside(root, dir);
  const names = await fs.readdir(dir);
  let next = names.reduce((max, name) => {
    const match = name.match(/^(ADR|REQ|NOTE)-(\d{3,})\.json$/);
    return match && match[1] === kind ? Math.max(max, Number(match[2])) : max;
  }, 0) + 1;
  while (Number.isSafeInteger(next)) {
    const id = `${kind}-${String(next++).padStart(3, '0')}`;
    const entry = { id, kind, content, feature, tags: [...tags], refs: checkedRefs, status: 'draft', baseline: Date.now() };
    const file = await target(root, id);
    try { await fs.writeFile(file, `${JSON.stringify(entry, null, 2)}\n`, { flag: 'wx' }); return entry; }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  throw new CliError('Memory ID sequence exhausted.');
}

async function update(root, entry) {
  const file = await target(root, entry.id);
  // Refuse symbolic links even when they resolve within the memory directory.
  if ((await fs.lstat(file)).isSymbolicLink()) throw new CliError('Memory entry cannot be a symbolic link.');
  await fs.writeFile(file, `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}

async function confirm(root, id) {
  const entry = await read(root, id);
  if (entry.status !== 'draft') throw new CliError('Only draft memory can be confirmed.');
  await references(root, entry.refs);
  return update(root, { ...entry, status: 'confirmed', baseline: Date.now() });
}

async function supersede(root, id, input) {
  const old = await read(root, id);
  if (old.status === 'superseded') throw new CliError('Memory is already superseded.');
  if (!input || typeof input !== 'object' || Object.hasOwn(input, 'id') || Object.hasOwn(input, 'kind')) throw new CliError('Replacement ID and kind are allocated automatically.');
  const replacement = await add(root, { feature: old.feature, tags: old.tags, refs: old.refs, ...input, kind: old.kind });
  await update(root, { ...old, status: 'superseded', supersededBy: replacement.id });
  return { old: await read(root, id), replacement };
}

async function recall(root, { kind, feature, status, tags = [], query = '' } = {}) {
  if (typeof query !== 'string' || !Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string') || [kind, feature, status].some((value) => value !== undefined && typeof value !== 'string')) {
    throw new CliError('Invalid memory filters.');
  }
  const words = query.toLowerCase().match(/[\p{L}\p{N}_-]+/gu) || [];
  return (await list(root)).filter((entry) => {
    const text = [entry.id, entry.kind, entry.content, entry.feature, ...entry.tags].join(' ').toLowerCase();
    return (!kind || entry.kind === kind) && (!feature || entry.feature === feature)
      && (!status || entry.status === status) && tags.every((tag) => entry.tags.includes(tag))
      && words.every((word) => text.includes(word));
  }).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

module.exports = { add, confirm, supersede, read, list, recall };
