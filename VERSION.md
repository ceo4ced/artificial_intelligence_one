# Version History

## v1.0.2 (2024-12-11)

### Critical Bug Fix
- 🔥 **FIXED: Firestore rules `duration.value()` syntax error**
  - Changed `duration.value('31536000s')` to `duration.value(365, 'd')`
  - This was causing ALL Google registrations to fail with "Missing or insufficient permissions"
  - Firebase duration.value() requires TWO parameters: (number, unit)
  - This fix resolves the permission-denied errors during Google registration

---

## v1.0.1 (2024-12-11)

### Bug Fixes
- ✅ Add comprehensive debugging to Google registration flow
- ✅ Fix potential null photoURL issue (only include if exists)
- ✅ Add detailed error logging to diagnose Firestore permission errors

### Improvements
- ✅ Enhanced error messages with error codes and full error objects
- ✅ Added debug logging for user authentication status, age calculation, and profile data

---

## v1.0.0 (2024-12-09)

### New Features
- ✅ Complete role-based access control (RBAC) system
  - Guest role (default): View-only access to lessons
  - Student role: Full interactive access (visualizers, games, quizzes)
  - Teacher role: Admin capabilities and student management
- ✅ Google SSO (Single Sign-On) authentication
- ✅ Email/password authentication with COPPA compliance (13+ age verification)
- ✅ User profile management (profile, settings pages)
- ✅ Comprehensive testing infrastructure with Vitest
- ✅ Version number display in navigation

### Bug Fixes
- ✅ Fixed Google SSO registration flow (keeps user signed in during age verification)
- ✅ Fixed birthdate format for Firestore rules validation (converts to ISO 8601)
- ✅ Fixed field name mismatch (displayName vs name in Firestore rules)
- ✅ Fixed getCurrentUser() to properly merge Firebase Auth with Firestore profile data

### Infrastructure
- ✅ Updated Firebase SDK to v12.6.0
- ✅ Firestore security rules with 3-tier role system
- ✅ 45 passing unit tests for auth-guard.js
- ✅ Google SSO troubleshooting documentation (GOOGLE_SSO_TROUBLESHOOTING.md)
- ✅ Comprehensive testing documentation (TESTING.md)

### Site Structure
- ✅ index.html: Landing page
- ✅ topics.html: AI learning content
- ✅ about.html: Course information
- ✅ auth/: Authentication pages (login, register, dashboard, profile, settings)
- ✅ auth/upgrade.html: Guest to Student upgrade page

### Deployment
- Hosted on GitHub Pages: https://ceo4ced.github.io/artificial_intelligence_one/
- Firebase backend: ai-learning-platform-ncca

---

## Version Update Instructions

When pushing updates to production:

1. **Update version number** in all navigation files:
   - `index.html` - Line 287
   - `topics.html` - Line 386
   - `quizzes/index.html` - Line 46

2. **Document changes** in this VERSION.md file

3. **Use semantic versioning:**
   - MAJOR.MINOR.PATCH (e.g., 1.0.0)
   - MAJOR: Breaking changes
   - MINOR: New features (backwards compatible)
   - PATCH: Bug fixes (backwards compatible)

4. **Example:**
   ```
   v1.0.0 → v1.0.1 (bug fix)
   v1.0.0 → v1.1.0 (new feature)
   v1.0.0 → v2.0.0 (breaking change)
   ```
