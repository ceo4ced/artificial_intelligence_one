# AI Learning Platform - Testing Documentation

## 🧪 Test Suite Overview

This project uses **Vitest** for fast, modern JavaScript testing.

### Test Categories:

1. **Unit Tests** - Individual function testing
   - `tests/auth-guard.test.js` - Role and permission system

2. **Integration Tests** - Flow testing
   - `tests/auth-integration.test.js` - Registration/login flows

3. **Security Tests** - Firestore rules testing
   - `tests/firestore-rules.test.js` - Database security

---

## 📦 Installation

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

## 🚀 Running Tests

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

---

## 📊 Current Test Status

### ✅ Completed:
- Auth Guard unit tests (role system, permissions)
- Test framework setup
- Mock configuration

### 🚧 To Implement:
- Auth integration tests (registration/login flows)
- Firestore rules tests (requires emulator setup)
- E2E tests for full user journeys
- Performance tests

---

## 🎯 Test Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| auth-guard.js | 100% | ✅ 100% |
| auth-utils.js | 80% | 🚧 0% |
| firebase-config.js | 50% | 🚧 0% |
| Firestore rules | 100% | 🚧 0% |

---

## 🔍 What's Tested

### Auth Guard Tests (`auth-guard.test.js`):
✅ Role definitions (GUEST, STUDENT, TEACHER)
✅ Permission definitions (VIEW_LESSONS, USE_VISUALIZERS, etc.)
✅ `hasPermission()` for all roles × all permissions
✅ Role hierarchy (guest < student < teacher)
✅ Role display names
✅ Role upgrade paths
✅ Security edge cases (guests can't save, students can't admin)

### Integration Tests (`auth-integration.test.js`):
🚧 Email/password registration
🚧 Google SSO registration
🚧 Age verification (COPPA)
🚧 Login flows
🚧 Session management
🚧 Role-based navigation

### Firestore Rules Tests (`firestore-rules.test.js`):
🚧 Profile CRUD operations
🚧 Quiz score CRUD operations
🚧 Role-based access control
🚧 Field validation
🚧 Security edge cases

---

## 🛠️ Writing New Tests

### Example Unit Test:

```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../auth/my-module.js';

describe('My Module', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Example Integration Test:

```javascript
import { describe, it, expect, vi } from 'vitest';

describe('User Registration', () => {
  it('should create account and redirect', async () => {
    // Mock Firebase
    vi.mock('./auth/firebase-config.js');

    // Test registration flow
    const result = await registerUser('test@example.com', 'password123', 'Test User', '2000-01-01');

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Example Firestore Rules Test:

```javascript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Profile Creation', () => {
  it('should allow user to create own profile', async () => {
    const db = getFirestore(testEnv, { uid: 'user123' });

    await assertSucceeds(
      setDoc(doc(db, 'users/user123'), {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'guest',
        // ...
      })
    );
  });
});
```

---

## 🔧 Debugging Tests

### View Test Output:
```bash
npm test -- --reporter=verbose
```

### Run Single Test File:
```bash
npm test -- tests/auth-guard.test.js
```

### Run Single Test:
```bash
npm test -- -t "should allow guests to view lessons"
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

## 📈 CI/CD Integration

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

## 🎓 Testing Best Practices

1. **Test Behavior, Not Implementation**
   - ✅ Test what user sees/experiences
   - ❌ Don't test internal implementation details

2. **Keep Tests Independent**
   - Each test should run in isolation
   - No shared state between tests

3. **Use Descriptive Names**
   ```javascript
   // ✅ Good
   it('should reject guest from creating quiz scores')

   // ❌ Bad
   it('test1')
   ```

4. **Follow AAA Pattern**
   - **Arrange** - Set up test data
   - **Act** - Execute the function
   - **Assert** - Verify the result

5. **Test Edge Cases**
   - Empty inputs
   - Null/undefined
   - Maximum values
   - Invalid data types

---

## 🆘 Troubleshooting

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

---

## 📚 Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Firebase Rules Testing](https://firebase.google.com/docs/rules/unit-tests)

---

**Next Steps:**
1. Run `npm install` to set up testing
2. Run `npm test` to see current tests
3. Implement remaining integration tests
4. Set up Firebase emulator for rules testing
5. Add E2E tests with Playwright/Cypress
