const fs = require('fs');
const path = require('path');
const { pascalCase } = require('./utils/text');
const { addAcceptanceCriteriaIds } = require('./criteria');

const ID_PATTERN = /\bAC-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+-\d+\b/g;
const CRITERION_LINE = /^(\s*-\s*\[([ xX])\]\s*)(.*)$/;
const TEST_EXTENSIONS = new Set([
  '.cjs', '.cs', '.go', '.java', '.js', '.jsx', '.mjs', '.php', '.py', '.rb', '.rs', '.sh', '.sql', '.ts', '.tsx'
]);
const COMMENT_LINE = /^\s*(?:\/\/|#|\/\*|\*|--)/;

function walkFiles(rootDir, accept) {
  if (!fs.existsSync(rootDir)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (entry.isFile() && accept(filePath)) files.push(filePath);
    }
  };
  visit(rootDir);
  return files;
}

function collectIds(docsDir) {
  const ids = [];
  for (const filePath of walkFiles(docsDir, (file) => path.extname(file).toLowerCase() === '.md')) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    lines.forEach((text, index) => {
      const criterion = text.match(CRITERION_LINE);
      if (!criterion) return;
      for (const match of criterion[3].matchAll(ID_PATTERN)) {
        ids.push({
          id: match[0],
          document: path.relative(docsDir, filePath).split(path.sep).join('/'),
          line: index + 1,
          text: criterion[3].trim(),
          checked: criterion[2].toLowerCase() === 'x'
        });
      }
    });
  }
  return ids;
}

function collectMentions(testsDir) {
  const mentions = [];
  for (const filePath of walkFiles(testsDir, (file) => TEST_EXTENSIONS.has(path.extname(file).toLowerCase()))) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    lines.forEach((text, index) => {
      for (const match of text.matchAll(ID_PATTERN)) {
        mentions.push({
          id: match[0],
          file: path.relative(testsDir, filePath).split(path.sep).join('/'),
          line: index + 1,
          comment: COMMENT_LINE.test(text)
        });
      }
    });
  }
  return mentions;
}

function coverage(projectDir = process.cwd(), featureName) {
  const docsDir = path.join(projectDir, 'docs');
  const testsDir = path.join(projectDir, 'tests');
  const prefix = featureName ? `AC-${pascalCase(featureName).toUpperCase()}-` : null;
  const criteria = new Map();
  for (const criterion of collectIds(docsDir)) {
    if (prefix && !criterion.id.startsWith(prefix)) continue;
    if (!criteria.has(criterion.id)) criteria.set(criterion.id, criterion);
  }
  const mentionsById = new Map();
  for (const mention of collectMentions(testsDir)) {
    if (!mentionsById.has(mention.id)) mentionsById.set(mention.id, []);
    mentionsById.get(mention.id).push(mention);
  }

  const covered = [];
  const referencedOnly = [];
  const missing = [];
  for (const [id, criterion] of criteria) {
    const mentions = mentionsById.get(id) || [];
    const entry = {
      id,
      document: `docs/${criterion.document}`,
      line: criterion.line,
      text: criterion.text,
      checked: criterion.checked
    };
    const codeMention = mentions.find((mention) => !mention.comment);
    if (codeMention) covered.push({ ...entry, file: `tests/${codeMention.file}`, testLine: codeMention.line });
    else if (mentions.length) {
      referencedOnly.push({ ...entry, file: `tests/${mentions[0].file}`, testLine: mentions[0].line });
    }
    else missing.push(entry);
  }

  const total = criteria.size;
  return {
    total,
    covered,
    referencedOnly,
    missing,
    percent: total ? (covered.length / total) * 100 : 0
  };
}

function planBackfill(projectDir = process.cwd(), featureName) {
  const docsFeatures = path.join(projectDir, 'docs', 'features');
  const files = walkFiles(docsFeatures, (file) => /-prd\.md$/i.test(file));
  const updates = [];
  for (const filePath of files) {
    const feature = path.basename(filePath).replace(/-prd\.md$/i, '');
    if (featureName && feature.toLowerCase() !== featureName.toLowerCase()) continue;
    const original = fs.readFileSync(filePath, 'utf8');
    const content = addAcceptanceCriteriaIds(original, feature, original);
    if (content !== original) updates.push({ filePath, content });
  }
  return updates;
}

module.exports = { collectIds, collectMentions, coverage, planBackfill, pascalCase };
