function pascalCase(value) {
  return String(value).replace(/(^|[-_\s]+)([a-zA-Z0-9])/g, (_, separator, character) => character.toUpperCase());
}

module.exports = { pascalCase };
