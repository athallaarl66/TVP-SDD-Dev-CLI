const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { CliError, assertInside } = require('./utils/file');

const MANIFEST_VERSION = 1;
const MANIFEST_RELATIVE_PATH = '.sdd/manifest.json';
const SUPPORTED_KINDS = new Set(['prd', 'technical', 'feature-design', 'qa-testing', 'production']);

class ManifestError extends CliError {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'ManifestError';
  }
}

function manifestPath(projectDir) {
  return path.join(projectDir, MANIFEST_RELATIVE_PATH);
}

function normalizeRelative(projectDir, filePath) {
  const absolute = path.resolve(projectDir, filePath);
  assertInside(projectDir, absolute);
  return path.relative(projectDir, absolute).split(path.sep).join('/');
}

function toAbsolute(projectDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath) {
    throw new ManifestError('invalid-path', 'Manifest path must be a non-empty repository-relative path.');
  }
  if (path.isAbsolute(relativePath)) {
    throw new ManifestError('invalid-path', `Manifest path must be relative: ${relativePath}`);
  }
  const absolute = path.resolve(projectDir, relativePath);
  try {
    assertInside(projectDir, absolute);
  } catch (error) {
    throw new ManifestError('invalid-path', error.message);
  }
  return absolute;
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashFile(filePath) {
  return hashContent(fs.readFileSync(filePath));
}

function stableRecord(record) {
  const sources = [...(record.sources || [])]
    .map((source) => ({ path: source.path, hash: source.hash, mtimeMs: source.mtimeMs }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return {
    kind: record.kind,
    feature: record.feature,
    path: record.path,
    sourcePatterns: [...(record.sourcePatterns || sources.map((source) => source.path))].sort(),
    sources,
    generatedHash: record.generatedHash,
    generatedAt: record.generatedAt
  };
}

function normalizeManifest(projectDir, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManifestError('malformed', 'Manifest must be a JSON object.');
  }
  if (value.version !== MANIFEST_VERSION) {
    throw new ManifestError('unsupported-version', `Unsupported manifest version: ${value.version}.`);
  }
  if (!Array.isArray(value.documents)) {
    throw new ManifestError('malformed', 'Manifest documents must be an array.');
  }
  const documents = value.documents.map((record) => {
    if (!record || typeof record !== 'object' || !SUPPORTED_KINDS.has(record.kind) || typeof record.feature !== 'string') {
      throw new ManifestError('malformed', 'Manifest document has an invalid kind or feature.');
    }
    const normalized = stableRecord(record);
    normalized.path = normalizeRelative(projectDir, toAbsolute(projectDir, normalized.path));
    normalized.sources = normalized.sources.map((source) => {
      if (!source || typeof source.hash !== 'string') throw new ManifestError('malformed', 'Manifest source has no hash.');
      return { ...source, path: normalizeRelative(projectDir, toAbsolute(projectDir, source.path)) };
    });
    if (typeof normalized.generatedHash !== 'string' || typeof normalized.generatedAt !== 'string') {
      throw new ManifestError('malformed', 'Manifest document has no generated hash or baseline.');
    }
    return normalized;
  }).sort((a, b) => `${a.feature}\0${a.kind}\0${a.path}`.localeCompare(`${b.feature}\0${b.kind}\0${b.path}`));
  return { version: MANIFEST_VERSION, documents };
}

async function readManifest(projectDir, { required = true } = {}) {
  const filePath = manifestPath(projectDir);
  let raw;
  try {
    raw = await fsp.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' && !required) return { version: MANIFEST_VERSION, documents: [] };
    if (error.code === 'ENOENT') throw new ManifestError('missing', `Manifest is missing: ${MANIFEST_RELATIVE_PATH}`);
    throw error;
  }
  try {
    return normalizeManifest(projectDir, JSON.parse(raw));
  } catch (error) {
    if (error instanceof ManifestError) throw error;
    throw new ManifestError('malformed', `Manifest is malformed: ${error.message}`);
  }
}

async function writeManifest(projectDir, manifest) {
  const normalized = normalizeManifest(projectDir, manifest);
  const filePath = manifestPath(projectDir);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temporary, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  await fsp.rename(temporary, filePath);
  return normalized;
}

async function describeSources(projectDir, sourcePaths = []) {
  const unique = [...new Set(sourcePaths.map((filePath) => normalizeRelative(projectDir, filePath)))].sort();
  const sources = [];
  for (const relativePath of unique) {
    const absolute = toAbsolute(projectDir, relativePath);
    const stat = await fsp.stat(absolute);
    if (!stat.isFile()) throw new ManifestError('invalid-source', `Manifest source is not a file: ${relativePath}`);
    sources.push({ path: relativePath, hash: hashFile(absolute), mtimeMs: stat.mtimeMs });
  }
  return sources;
}

async function recordDocument(projectDir, { kind, feature, filePath, sourcePaths = [] }) {
  if (!SUPPORTED_KINDS.has(kind)) throw new ManifestError('invalid-kind', `Unsupported manifest document kind: ${kind}`);
  const absolute = toAbsolute(projectDir, normalizeRelative(projectDir, filePath));
  const stat = await fsp.stat(absolute);
  if (!stat.isFile()) throw new ManifestError('invalid-document', `Manifest document is not a file: ${filePath}`);
  const record = stableRecord({
    kind,
    feature,
    path: normalizeRelative(projectDir, absolute),
    sources: await describeSources(projectDir, sourcePaths),
    generatedHash: hashFile(absolute),
    generatedAt: new Date().toISOString()
  });
  const manifest = await readManifest(projectDir, { required: false });
  manifest.documents = manifest.documents.filter((item) => item.path !== record.path);
  manifest.documents.push(record);
  await writeManifest(projectDir, manifest);
  return record;
}

function supportedDocumentPaths(projectDir) {
  const docsDir = path.join(projectDir, 'docs');
  if (!fs.existsSync(docsDir)) return [];
  const found = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        const relativePath = normalizeRelative(projectDir, filePath);
        if (
          /^docs\/features\/[^/]+-(?:prd|technical|design)\.md$/i.test(relativePath) ||
          /^docs\/production\/[^/]+\/[^/]+\/\d{2}-.+\/(?:prod|tech|design|testing)\.md$/i.test(relativePath)
        ) found.push(relativePath);
      }
    }
  };
  visit(docsDir);
  return found.sort();
}

async function inspectManifest(projectDir) {
  const manifest = await readManifest(projectDir);
  const tracked = [];
  for (const record of manifest.documents) {
    const documentPath = toAbsolute(projectDir, record.path);
    const status = { ...record, edited: false, stale: false, invalid: [], changedSources: [] };
    if (!fs.existsSync(documentPath)) status.invalid.push('missing-document');
    else status.edited = hashFile(documentPath) !== record.generatedHash;
    for (const source of record.sources) {
      const sourcePath = toAbsolute(projectDir, source.path);
      if (!fs.existsSync(sourcePath)) {
        status.invalid.push(`missing-source:${source.path}`);
        continue;
      }
      const currentHash = hashFile(sourcePath);
      if (currentHash !== source.hash) {
        status.stale = true;
        status.changedSources.push(source.path);
      }
    }
    tracked.push(status);
  }
  const known = new Set(manifest.documents.map((record) => record.path));
  const untracked = supportedDocumentPaths(projectDir).filter((relativePath) => !known.has(relativePath));
  return { manifest, tracked, untracked };
}

module.exports = {
  MANIFEST_VERSION,
  MANIFEST_RELATIVE_PATH,
  ManifestError,
  manifestPath,
  normalizeRelative,
  toAbsolute,
  hashContent,
  hashFile,
  readManifest,
  writeManifest,
  describeSources,
  recordDocument,
  supportedDocumentPaths,
  inspectManifest
};
