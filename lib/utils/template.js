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
  generatedBy: "sdd-gen /implement-code"
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
  return `const { test, expect } = require('@playwright/test');

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

module.exports = {
  generateSkillContent,
  generatePlaywrightScript
};
