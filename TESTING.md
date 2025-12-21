# AI Learning Platform - Testing Documentation

## Test Suite Overview

This project uses **Vitest** for fast, modern JavaScript testing.

### Test Categories:

1. **Unit Tests** - Individual function testing
   - `tests/auth-guard.test.js` - Role and permission system (8-tier)
   - `tests/tier-system.test.js` - User tier levels and content access
   - `tests/subscription-management.test.js` - Subscriptions and billing
   - `tests/organization-management.test.js` - Organization hierarchy
   - `tests/analytics-reporting.test.js` - Event tracking and metrics

2. **Integration Tests** - Flow testing
   - `tests/auth-integration.test.js` - Registration/login flows

3. **Security Tests** - Firestore rules testing
   - `tests/firestore-rules.test.js` - Database security for all collections

---

## Installation

```bash
npm install
```

This installs:
- `vitest` - Test runner
- `@vitest/ui` - Visual test UI
- `happy-dom` - Browser environment simulation
- `@firebase/rules-unit-testing` - Firestore rules testing
- `@testing-library/dom` - DOM testing utilities

---

## Running Tests

### Run All Tests:
```bash
npm test
```

### Run Tests in Watch Mode:
```bash
npm run test:watch
```

### Run Tests with UI:
```bash
npm run test:ui
```
Then open http://localhost:51204/__vitest__/

### Run Tests Once (CI mode):
```bash
npm run test:run
```

### Run with Coverage:
```bash
npm run test:coverage
```
Generates coverage report in `coverage/` directory

### Run Firestore Rules Tests:
```bash
npm run test:rules
```
Requires Firebase emulator running

### Run Specific Test File:
```bash
npm test -- tests/tier-system.test.js
```

---

## Current Test Status

### Completed:

| Test File | Description | Status |
|-----------|-------------|--------|
| `auth-guard.test.js` | 8-tier role system, permissions, hierarchy | Complete |
| `tier-system.test.js` | USER_TIERS, CONTENT_TIERS, content access | Complete |
| `subscription-management.test.js` | Subscription types, pricing, billing | Complete |
| `organization-management.test.js` | Org types, classroom schemas | Complete |
| `analytics-reporting.test.js` | Event definitions, metric types | Complete |
| `firestore-rules.test.js` | Security rules for all collections | Complete |
| `setup.js` | Mock configuration for Firebase | Complete |

### To Implement:
- Auth integration tests (registration/login flows)
- E2E tests for full user journeys
- Performance tests
- Firebase emulator tests

---

## Test Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| auth-guard.js | 100% | Complete |
| tier-system.js | 100% | Complete |
| subscription-management.js | 100% | Complete |
| organization-management.js | 100% | Complete |
| analytics-reporting.js | 100% | Complete |
| Firestore rules | 100% | Scaffold Complete |

---

## What's Tested

### Tier System Tests (`tier-system.test.js`):
- USER_TIERS constant (levels 0-7)
- USER_TIER_NAMES mapping
- CONTENT_TIERS (free, premium, enterprise)
- CONTENT_TIER_FEATURES pricing and limits
- PERMISSIONS matrix (view, interact, admin)
- Tier hierarchy validation
- Content access logic

### Auth Guard Tests (`auth-guard.test.js`):
- Role definitions (8 tiers: public to super_admin)
- Permission definitions (view, interact, manage, admin)
- `hasPermission()` for all roles x all permissions
- Role hierarchy enforcement
- Role display names
- Role upgrade paths
- Tier-based access control
- Content access checking

### Subscription Management Tests (`subscription-management.test.js`):
- SUBSCRIPTION_TYPES (individual, family, classroom, school, district)
- SUBSCRIPTION_STATUS lifecycle
- BILLING_CYCLES (monthly, annual)
- PRICING structure with discounts
- Volume-based enterprise pricing
- Trial periods
- Proration calculations

### Organization Management Tests (`organization-management.test.js`):
- ORG_TYPES (state, county, district, city, school, classroom)
- Organization schemas and validation
- Parent path hierarchy
- Classroom join codes
- Student enrollment workflow
- Teacher registration approval

### Analytics Reporting Tests (`analytics-reporting.test.js`):
- ANALYTICS_EVENTS (user lifecycle, content, subscription, org)
- METRIC_TYPES (engagement, learning, conversion, revenue)
- Event naming conventions (snake_case)
- Metric code uniqueness
- Journey coverage (user, subscription, learning)

### Firestore Rules Tests (`firestore-rules.test.js`):
- User profiles CRUD with tier-based access
- Quiz scores subcollection
- User memberships and enrollments
- Organizations collection (tier-based creation)
- Classrooms collection
- Subscriptions and payments
- Approval requests
- Coupons, usage tracking, system logs
- 8-tier role enforcement
- Security edge cases

---

## Test Helpers (setup.js)

### Mock Functions:

```javascript
// Create mock user with defaults or overrides
const user = createMockUser({ role: 'teacher', tier: 3 });

// Create mock organization
const org = createMockOrganization({ type: 'school', name: 'Test High' });

// Create mock subscription
const sub = createMockSubscription({ tier: 'premium', status: 'active' });

// Create mock classroom
const classroom = createMockClassroom({ name: 'Period 1' });
```

### Firebase Mocks:

```javascript
// Firestore mocks
vi.mock('../auth/firebase-config.js', () => ({
    db: mockDb,
    auth: mockAuth,
    analytics: mockAnalytics
}));

// Auth state mock
onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(mockUser);
    return vi.fn();
});
```

---

## Writing New Tests

### Example Unit Test:

```javascript
import { describe, it, expect } from 'vitest';
import { hasMinimumTier, USER_TIERS } from '../auth/tier-system.js';

describe('Tier System', () => {
  describe('hasMinimumTier()', () => {
    it('should return true when user tier meets requirement', () => {
      expect(hasMinimumTier('teacher', USER_TIERS.STUDENT)).toBe(true);
    });

    it('should return false when user tier is below requirement', () => {
      expect(hasMinimumTier('guest', USER_TIERS.STUDENT)).toBe(false);
    });
  });
});
```

### Example Permission Test:

```javascript
import { describe, it, expect } from 'vitest';
import { hasPermission, ROLES, PERMISSIONS } from '../auth/auth-guard.js';

describe('Permission System', () => {
  it('should allow teacher to manage classroom', () => {
    expect(hasPermission(ROLES.TEACHER, 'MANAGE_CLASSROOM')).toBe(true);
  });

  it('should deny student from managing classroom', () => {
    expect(hasPermission(ROLES.STUDENT, 'MANAGE_CLASSROOM')).toBe(false);
  });
});
```

### Example Subscription Test:

```javascript
import { describe, it, expect } from 'vitest';
import { PRICING, CONTENT_TIERS, BILLING_CYCLES } from '../auth/subscription-management.js';

describe('Subscription Pricing', () => {
  it('should have correct premium monthly price', () => {
    expect(PRICING[CONTENT_TIERS.PREMIUM].individual[BILLING_CYCLES.MONTHLY]).toBe(9.99);
  });

  it('should apply annual discount', () => {
    const monthly = PRICING[CONTENT_TIERS.PREMIUM].individual[BILLING_CYCLES.MONTHLY];
    const annual = PRICING[CONTENT_TIERS.PREMIUM].individual[BILLING_CYCLES.ANNUAL];
    expect(annual).toBeLessThan(monthly * 12);
  });
});
```

---

## Debugging Tests

### View Test Output:
```bash
npm test -- --reporter=verbose
```

### Run Single Test File:
```bash
npm test -- tests/tier-system.test.js
```

### Run Single Test:
```bash
npm test -- -t "should return correct tier level for teacher"
```

### Debug in VS Code:
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

---

## CI/CD Integration

### GitHub Actions Example:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

---

## Testing Best Practices

1. **Test Behavior, Not Implementation**
   - Test what user sees/experiences
   - Don't test internal implementation details

2. **Keep Tests Independent**
   - Each test should run in isolation
   - No shared state between tests

3. **Use Descriptive Names**
   ```javascript
   // Good
   it('should deny guest user from saving quiz scores')

   // Bad
   it('test1')
   ```

4. **Follow AAA Pattern**
   - **Arrange** - Set up test data
   - **Act** - Execute the function
   - **Assert** - Verify the result

5. **Test Edge Cases**
   - Empty inputs
   - Null/undefined
   - Boundary values (tier 0, tier 7)
   - Invalid data types

6. **Test Security Boundaries**
   - Privilege escalation attempts
   - Cross-user data access
   - Role-based restrictions

---

## Troubleshooting

### Tests Not Running?
- Check Node.js version (need 18+)
- Run `npm install` again
- Clear cache: `npm run test -- --clearCache`

### Import Errors?
- Verify file paths in imports
- Check `vitest.config.js` alias settings
- Ensure files export functions properly

### Firebase Mock Issues?
- Check `tests/setup.js` for mock configuration
- Verify Firebase imports match mocked modules
- Ensure mock functions are properly reset in beforeEach

### Tier System Tests Failing?
- Verify tier constants match between files
- Check permission arrays include all required roles
- Ensure role names are consistent (snake_case)

---

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Firebase Rules Testing](https://firebase.google.com/docs/rules/unit-tests)

---

## Next Steps

1. Run `npm install` to set up testing
2. Run `npm test` to run all tests
3. Add Firebase emulator for Firestore rules testing
4. Implement remaining integration tests
5. Add E2E tests with Playwright/Cypress
6. Set up coverage thresholds in CI
