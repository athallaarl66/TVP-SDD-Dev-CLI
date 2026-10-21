// Generated test sources. Specification text is never interpolated into
// executable syntax: it is emitted as line comments (which cannot be terminated
// early) and the placeholder body is skipped until a human writes assertions.

// Deterministic identifier from a feature slug (letters/digits only).
function identifier(name) {
  return String(name)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Escape for single-quoted string literals (JS, PHP, Go, Java, C#).
function singleQuoted(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

// Emit content as line comments. Line comments cannot be terminated by any
// character in the content; PHP's closing tag is neutralised because it ends
// PHP mode even inside a comment.
function commentLines(content, { php = false, marker = '//' } = {}) {
  return String(content)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      const safe = php ? line.replace(/\?>/g, '? >') : line;
      return safe.trim() === '' ? marker : `${marker} ${safe}`;
    })
    .join('\n');
}

function header(featureName, label, specTestContent, { php = false, marker = '//' } = {}) {
  const lines = [
    `AUTO-GENERATED PLACEHOLDER (${label}) for ${identifier(featureName) || 'feature'}.`,
    `Source specification: ${featureName}-SPEC_TEST.md`,
    'The test body is intentionally skipped: it contains no acceptance-criteria',
    'assertions yet. Replace the placeholder before trusting a green run.',
    '',
    'Specification excerpt:'
  ];
  return [
    lines.map((line) => (line === '' ? marker : `${marker} ${line}`)).join('\n'),
    commentLines(specTestContent, { php, marker })
  ].join('\n');
}

// Helper function to generate Playwright script from SPEC_TEST content
function generatePlaywrightScript(featureName, specTestContent) {
  const name = singleQuoted(featureName);
  return `import { test, expect } from '@playwright/test';

${header(featureName, 'Playwright', specTestContent)}

test.describe('${name} Tests', () => {
  test.skip('placeholder: implement E2E assertions from ${name}-SPEC_TEST.md', async ({ page }) => {
    // TODO: replace this skipped placeholder with real acceptance-criteria checks.
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
  });
});
`;
}

// Helper function to generate Unit test script from SPEC_TEST content
function generateUnitTestScript(featureName, specTestContent, framework) {
  const name = singleQuoted(featureName);
  const cls = identifier(featureName) || 'Feature';
  const reason = `Generated placeholder: add assertions from ${featureName}-SPEC_TEST.md`;

  const templates = {
    // JavaScript/TypeScript (Jest/Vitest)
    jest: `${header(featureName, 'Jest', specTestContent)}

describe('${name}', () => {
  test.skip('placeholder: implement assertions from ${name}-SPEC_TEST.md', () => {
    // TODO: replace this skipped placeholder with real acceptance-criteria checks.
  });
});
`,
    // PHP/Laravel (PHPUnit)
    phpunit: `<?php
${header(featureName, 'PHPUnit/Laravel', specTestContent, { php: true })}

namespace Tests\\Feature;

use Tests\\TestCase;

class ${cls}Test extends TestCase
{
    public function test_placeholder_needs_real_assertions(): void
    {
        $this->markTestSkipped('${singleQuoted(reason)}');
    }
}
`,
    // .NET (xUnit)
    xunit: `using Xunit;

${header(featureName, 'xUnit (.NET)', specTestContent)}

namespace ${cls}.Tests
{
    public class ${cls}Tests
    {
        [Fact(Skip = "${singleQuoted(reason)}")]
        public void Placeholder_Needs_Real_Assertions()
        {
        }
    }
}
`,
    // .NET (NUnit)
    nunit: `using NUnit.Framework;

${header(featureName, 'NUnit (.NET)', specTestContent)}

namespace ${cls}.Tests
{
    [TestFixture]
    public class ${cls}Tests
    {
        [Test]
        [Ignore("${singleQuoted(reason)}")]
        public void Placeholder_Needs_Real_Assertions()
        {
        }
    }
}
`,
    // Java (JUnit 5)
    junit: `import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

${header(featureName, 'JUnit 5 (Java)', specTestContent)}

class ${cls}Test {

    @Test
    @Disabled("${singleQuoted(reason)}")
    void placeholderNeedsRealAssertions() {
    }
}
`,
    // Python (pytest)
    pytest: `${header(featureName, 'pytest (Python)', specTestContent, { marker: '#' })}

import pytest


class Test${cls}:
    def test_placeholder_needs_real_assertions(self):
        pytest.skip("${singleQuoted(reason)}")
`,
    // Go (testing)
    gotest: `package tests

import "testing"

${header(featureName, 'Go testing', specTestContent)}

func Test${cls}(t *testing.T) {
\t// TODO: replace this skipped placeholder with real acceptance-criteria checks.
\tt.Skip("${singleQuoted(reason)}")
}
`
  };

  const source = templates[framework];
  if (!source) {
    throw new Error(`Unsupported test framework: ${framework}`);
  }
  return source;
}

module.exports = {
  generatePlaywrightScript,
  generateUnitTestScript,
  identifier,
  commentLines
};
