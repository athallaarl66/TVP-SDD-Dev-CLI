// Helper function to generate skill.md content
function generateSkillContent(featureName, slug, prodFile, techFile, designFile, testingFile, designPath) {
  let content = `---
name: implement-${featureName}-${slug}
description: Implement user story "${slug}" for ${featureName} based on breakdown files
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "sdd-gen"
---

You are a senior IT fullstack software engineer architect with expertise in:

- Database design and optimization
- API development (REST/GraphQL)
- Frontend development with reactive state management
- SEO optimization and metadata
- Security best practices
- Performance optimization
- Testing and quality assurance

## Task

Implement user story "${slug}" for feature "${featureName}" following the specifications in the breakdown files.

## Required Files

Read and implement based on these files:

1. **Production Requirements**: \`${prodFile}\`
   - User acceptance criteria
   - Business value and success metrics
   - User persona and journey

2. **Technical Specifications**: \`${techFile}\`
   - API endpoints
   - Database changes
   - Permissions and dependencies
   - Impact analysis

`;

  // Add optional files
  if (designFile) {
    content += `3. **Design Specifications**: \`${designFile}\` (if exists)
   - Wireframe and design references
   - UI components and visual guidelines

`;
  }

  if (testingFile) {
    content += `4. **Testing Scenarios**: \`${testingFile}\` (if exists)
   - Test cases and edge cases
   - Acceptance criteria verification

`;
  }

  // Add DESIGN.md if exists
  if (designPath) {
    content += `## Visual Design Tokens

Use the following visual tokens from DESIGN.md as mandatory standards:

\`\`\`
(Read DESIGN.md content from: ${designPath})
\`\`\`

`;
  }

  content += `## Implementation Requirements

Implement FULL SLICE CODE PRODUCTION including:

1. **Database**
   - Create/modify tables as specified
   - Add seed data if required
   - Create migrations

2. **API**
   - Implement all specified endpoints
   - Add proper error handling
   - Implement authentication/authorization if required

3. **Frontend UI Components**
   - Build reactive UI components
   - Implement state management
   - Follow design specifications
   - Ensure responsive design

4. **SEO Metadata**
   - Add proper meta tags
   - Implement structured data if required
   - Ensure proper semantic HTML

5. **Testing**
   - Follow testing scenarios from breakdown files
   - Handle edge cases

## Notes

- Follow the business logic and technical specifications from the breakdown files
- Use visual tokens from DESIGN.md if available
- Ensure code is production-ready and follows best practices
- Add proper error handling and validation
- Write clean, maintainable, and well-documented code
`;

  return content;
}

// Helper function to generate Playwright script from SPEC_TEST content
function generatePlaywrightScript(featureName, specTestContent) {
  return `import { test, expect } from '@playwright/test';

// Auto-generated from ${featureName}-SPEC_TEST.md
// Spec Test Content:
/*
${specTestContent}
*/

test.describe('${featureName} Tests', () => {
  test('should load the page', async ({ page }) => {
    // TODO: Implement test based on SPEC_TEST requirements
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
  });

  // Add more tests based on SPEC_TEST.md requirements
  // test('should perform specific action', async ({ page }) => {
  //   // Implementation
  // });
});
`;
}

// Helper function to generate Unit test script from SPEC_TEST content
function generateUnitTestScript(featureName, specTestContent, framework) {
  const templates = {
    // JavaScript/TypeScript (Jest/Vitest)
    jest: `// Auto-generated from ${featureName}-SPEC_TEST.md
// Framework: Jest
// Spec Test Content:
/*
${specTestContent}
*/

describe('${featureName}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should initialize correctly', () => {
    // TODO: Implement test based on SPEC_TEST requirements
    expect(true).toBe(true);
  });

  // Add more tests based on SPEC_TEST.md requirements
  // test('should perform specific action', () => {
  //   // Implementation
  // });
});
`,
    // PHP/Laravel (PHPUnit)
    phpunit: `<?php
// Auto-generated from ${featureName}-SPEC_TEST.md
// Framework: PHPUnit/Laravel
// Spec Test Content:
/*
${specTestContent}
*/

namespace Tests\\Feature;

use Tests\\TestCase;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

class ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Test extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // TODO: Implement test based on SPEC_TEST requirements
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    // Add more tests based on SPEC_TEST.md requirements
}
`,
    // .NET (xUnit)
    xunit: `using Xunit;
using System.Net.Http;
using System.Threading.Tasks;

// Auto-generated from ${featureName}-SPEC_TEST.md
// Framework: xUnit (.NET)
// Spec Test Content:
/*
${specTestContent}
*/

namespace ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}.Tests
{
    public class ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Tests
    {
        [Fact]
        public void Should_Initialize_Correctly()
        {
            // TODO: Implement test based on SPEC_TEST requirements
            Assert.True(true);
        }

        // Add more tests based on SPEC_TEST.md requirements
    }
}
`,
    // .NET (NUnit)
    nunit: `using NUnit.Framework;
using System;
using System.Threading.Tasks;

// Auto-generated from ${featureName}-SPEC_TEST.md
// Framework: NUnit (.NET)
// Spec Test Content:
/*
${specTestContent}
*/

namespace ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}.Tests
{
    [TestFixture]
    public class ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Tests
    {
        [SetUp]
        public void Setup()
        {
            // Setup before each test
        }

        [Test]
        public void Should_Initialize_Correctly()
        {
            // TODO: Implement test based on SPEC_TEST requirements
            Assert.That(true, Is.True);
        }

        // Add more tests based on SPEC_TEST.md requirements
    }
}
`,
    // Java (JUnit)
    junit: `import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.*;

// Auto-generated from ${featureName}-SPEC_TEST.md
// Framework: JUnit 5 (Java)
// Spec Test Content:
/*
${specTestContent}
*/

class ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Test {

    @BeforeEach
    void setUp() {
        // Setup before each test
    }

    @AfterEach
    void tearDown() {
        // Cleanup after each test
    }

    @Test
    void shouldInitializeCorrectly() {
        // TODO: Implement test based on SPEC_TEST requirements
        assertTrue(true);
    }

    // Add more tests based on SPEC_TEST.md requirements
}
`,
    // Python (pytest)
    pytest: `# Auto-generated from ${featureName}-SPEC_TEST.md
# Framework: pytest (Python)
# Spec Test Content:
"""
${specTestContent}
"""

import pytest

class Test${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}:
    def setup_method(self):
        """Setup before each test"""
        pass

    def teardown_method(self):
        """Cleanup after each test"""
        pass

    def test_should_initialize_correctly(self):
        """Test initialization"""
        # TODO: Implement test based on SPEC_TEST requirements
        assert True

    # Add more tests based on SPEC_TEST.md requirements
`
  };

  return templates[framework] || templates.jest;
}

module.exports = {
  generateSkillContent,
  generatePlaywrightScript,
  generateUnitTestScript
};
