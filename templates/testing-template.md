# Testing Scenarios: <Feature> - <StoryTitle>

## Document Information
- **Document Version**: 1.0
- **Created Date**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Author**: [Author Name]
- **Feature**: <Feature>
- **User Story**: <StoryId> - <StoryTitle>

---

## User Story

**As a** <AsA>
**I want** <IWant>
**So that** <SoThat>

---

## Acceptance Criteria

<AcceptanceCriteria>

---

## Test Cases

### TC01: [Test case description]

**Given** [Precondition]
- [System state before test]
- [Data setup required]
- [User authentication state]

**When** [Action]
- [User action performed]
- [API call made]
- [Event triggered]

**Then** [Expected result]
- [System response]
- [UI changes]
- [Data state after]
- [Side effects]

**Priority:** [High/Medium/Low]

---

### TC02: [Test case description]

**Given** [Precondition]
- [System state before test]
- [Data setup required]
- [User authentication state]

**When** [Action]
- [User action performed]
- [API call made]
- [Event triggered]

**Then** [Expected result]
- [System response]
- [UI changes]
- [Data state after]
- [Side effects]

**Priority:** [High/Medium/Low]

---

### TC03: [Test case description]

**Given** [Precondition]
- [System state before test]
- [Data setup required]
- [User authentication state]

**When** [Action]
- [User action performed]
- [API call made]
- [Event triggered]

**Then** [Expected result]
- [System response]
- [UI changes]
- [Data state after]
- [Side effects]

**Priority:** [High/Medium/Low]

---

## Edge Cases

### EC01: [Edge case description]
- **Scenario:** [Description of edge case]
- **Expected Behavior:** [How system should handle]
- **Test Data:** [Specific data to test]

### EC02: [Edge case description]
- **Scenario:** [Description of edge case]
- **Expected Behavior:** [How system should handle]
- **Test Data:** [Specific data to test]

### EC03: [Edge case description]
- **Scenario:** [Description of edge case]
- **Expected Behavior:** [How system should handle]
- **Test Data:** [Specific data to test]

---

## Negative Testing

### NT01: [Negative test case]
- **Invalid Input:** [What makes it invalid]
- **Expected Error:** [Error message or behavior]
- **Recovery:** [How user/system recovers]

### NT02: [Negative test case]
- **Invalid Input:** [What makes it invalid]
- **Expected Error:** [Error message or behavior]
- **Recovery:** [How user/system recovers]

---

## Performance Testing

### PT01: [Performance scenario]
- **Load:** [Number of users/requests]
- **Expected Response Time:** [Target in ms]
- **Throughput:** [Requests per second]

### PT02: [Performance scenario]
- **Load:** [Number of users/requests]
- **Expected Response Time:** [Target in ms]
- **Throughput:** [Requests per second]

---

## Security Testing

### ST01: [Security scenario]
- **Threat:** [Security vulnerability being tested]
- **Test Method:** [How to test]
- **Expected Result:** [System should prevent/allow]

### ST02: [Security scenario]
- **Threat:** [Security vulnerability being tested]
- **Test Method:** [How to test]
- **Expected Result:** [System should prevent/allow]

---

## Acceptance Criteria Verification

| Acceptance Criteria | Test Case(s) | Status |
|---------------------|--------------|--------|
| FR01: [Criteria 1] | TC01, TC02 | [ ] Pass |
| FR02: [Criteria 2] | TC03 | [ ] Pass |
| FR03: [Criteria 3] | TC01, EC01 | [ ] Pass |

---

## Test Data Requirements

- **Test User Accounts:**
  - [User type 1]: [Permissions/role]
  - [User type 2]: [Permissions/role]

- **Sample Data:**
  - [Data set 1]: [Description]
  - [Data set 2]: [Description]

- **Test Environment:**
  - [Environment 1]: [Configuration]
  - [Environment 2]: [Configuration]

---

## Playwright E2E Test Specification

### Browser Configuration

| Browser | Viewport | Headless | Use |
|---------|----------|----------|-----|
| Chromium | 1920x1080 | Yes | Primary |
| Firefox | 1920x1080 | Yes | Secondary |
| WebKit | 1920x1080 | Yes | Secondary |

### Page Object Model

```javascript
// tests/pages/[pageName].page.js
class [PageName]Page {
  constructor(page) {
    this.page = page;
    this.title = page.locator('h1');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async navigate() {
    await this.page.goto('/[path]');
  }

  async submit() {
    await this.submitButton.click();
  }
}
module.exports = [PageName]Page;
```

### E2E Test Cases

#### TC-E001: [User Flow Test Name]
**Preconditions:**
- User is logged in
- Test data is available

**Test Steps:**
| Step | Action | Playwright Code | Expected Result |
|------|--------|-----------------|----------------|
| 1 | Navigate to page | `await page.goto('/path')` | Page loads |
| 2 | Click element | `await page.locator('selector').click()` | Element clicked |
| 3 | Verify visible | `await expect(page.locator('selector')).toBeVisible()` | Element visible |

**Playwright Code:**
```typescript
test('[Test Name]', async ({ page }) => {
  await page.goto('/path');
  await page.locator('selector').click();
  await expect(page.locator('target')).toBeVisible();
});
```

**Priority:** Critical

---

#### TC-E002: [Form Validation Test]
**Test Scenarios:**
| Scenario | Input | Expected Behavior |
|----------|-------|-------------------|
| Valid input | [Valid data] | Form submits |
| Required field empty | [Empty] | Error shown |
| Invalid format | [Invalid] | Validation error |

**Playwright Code:**
```typescript
test('[Form Validation]', async ({ page }) => {
  await page.goto('/form');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.error')).toContainText('required');
});
```

**Priority:** High

---

### Responsive Design Tests

| Device | Viewport | Expected Behavior |
|--------|----------|-------------------|
| Desktop | 1920x1080 | Full layout |
| Tablet | 768x1024 | Adapted layout |
| Mobile | 375x667 | Mobile layout |

```typescript
test('[Responsive Test]', async ({ page }) => {
  await page.goto('/page');
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.mobile-menu')).toBeVisible();
});
```

---

### Accessibility Tests

| Check | Selector | Expected |
|-------|----------|----------|
| Alt text | `img` | Has alt attribute |
| ARIA labels | `[role="button"]` | Has aria-label |
| Keyboard nav | `input, button` | Focusable |

```typescript
test('[Accessibility Test]', async ({ page }) => {
  await page.goto('/page');
  const images = await page.locator('img').all();
  for (const img of images) {
    await expect(img).toHaveAttribute('alt');
  }
});
```

---

### Performance Metrics

| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| Time to Interactive | < 3s |
| First Contentful Paint | < 1s |

```typescript
test('[Performance Test]', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/page');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});
```

---

### Test Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: '[BASE_URL]',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## Automation Notes

- **Automatable:** [Yes/No]
- **Automation Priority:** [High/Medium/Low]
- **Special Tools Required:** [List any special testing tools]
- **Mock Requirements:** [What needs to be mocked]

---

## Notes

[Additional context, assumptions, or clarifications]
