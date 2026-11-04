const { pascalCase } = require('./utils/text');

const ID_PATTERN = /\bAC-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+-\d+\b/;
const CRITERIA_LINE = /^(\s*-\s*\[([ xX])\]\s*)(.*)$/;

function addAcceptanceCriteriaIds(content, featureName, previousContent = '') {
  const preserved = new Map();
  let storyNumber = null;
  let criterionNumber = 0;
  let inCriteria = false;
  const collect = (line) => {
    const story = line.match(/^####\s+User\s+Story\s+(\d+)\b/i);
    if (story) {
      storyNumber = Number(story[1]);
      criterionNumber = 0;
      inCriteria = false;
      return;
    }
    if (/^#{1,4}\s/.test(line)) inCriteria = false;
    if (/\*\*Acceptance Criteria:?\*\*:?/i.test(line)) {
      inCriteria = true;
      return;
    }
    if (!inCriteria) return;
    const criterion = line.match(CRITERIA_LINE);
    if (!criterion) {
      if (line.trim()) inCriteria = false;
      return;
    }
    criterionNumber += 1;
    const id = criterion[3].match(ID_PATTERN)?.[0];
    if (id) preserved.set(`${storyNumber}:${criterionNumber}`, id);
  };
  previousContent.split(/\r?\n/).forEach(collect);

  const featureId = pascalCase(featureName).toUpperCase();
  storyNumber = null;
  criterionNumber = 0;
  inCriteria = false;
  return content.split(/(\r?\n)/).map((line) => {
    const story = line.match(/^####\s+User\s+Story\s+(\d+)\b/i);
    if (story) {
      storyNumber = Number(story[1]);
      criterionNumber = 0;
      inCriteria = false;
      return line;
    }
    if (/^#{1,4}\s/.test(line)) inCriteria = false;
    if (/\*\*Acceptance Criteria:?\*\*:?/i.test(line)) {
      inCriteria = true;
      return line;
    }
    if (!inCriteria) return line;
    const criterion = line.match(CRITERIA_LINE);
    if (!criterion) {
      if (line.trim()) inCriteria = false;
      return line;
    }
    criterionNumber += 1;
    const existingId = criterion[3].match(ID_PATTERN)?.[0];
    if (existingId) return line;
    const text = criterion[3].replace(ID_PATTERN, '').replace(/AC-<FEATURE>-<STORY>-<N>/gi, '').trim();
    const id = preserved.get(`${storyNumber}:${criterionNumber}`)
      || `AC-${featureId}-${storyNumber}-${criterionNumber}`;
    return `${criterion[1]}${id}${text ? ` ${text}` : ''}`;
  }).join('');
}

module.exports = { addAcceptanceCriteriaIds };
