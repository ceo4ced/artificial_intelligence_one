# Version History

## v1.2.0 - "AI Tutor Integration" (2025-12-26)

### Major Features
- 🤖 **AI Tutor System**: Integrated Claude-powered AI tutoring for intelligent student support
  - Pure function architecture for testability (10+ pure functions)
  - 53 comprehensive unit tests (100% pass rate)
  - Firestore integration for conversation history
  - Interactive modal UI with message history and conversation management
- ✅ **Full Test Coverage**: All AI Tutor functions fully tested with Vitest
- 📱 **Mobile Responsive**: AI Tutor works on desktop and mobile devices
- 💾 **Conversation Persistence**: Save, load, and export tutoring conversations

### Implementation Details
- **New Files**:
  - `auth/ai-tutor.js` - Core tutoring logic (pure functions, 280 LOC)
  - `auth/ai-tutor-firestore.js` - Database integration (400 LOC)
  - `components/ai-tutor-modal.html` - UI component (400 LOC)
  - `tests/ai-tutor.test.js` - Unit tests (480 LOC)
- **Architecture**: Separates pure functions from side effects for clean testing
- **Security**: Input validation, prompt injection prevention, permission checks
- **Performance**: Message history limited to 10 recent exchanges for context window efficiency

### Setup Instructions
To enable the AI Tutor:
1. Deploy Firebase Cloud Function (see docs/FIREBASE_SETUP.md)
2. Configure Claude API key in Cloud Function environment
3. Import AI Tutor modal into lesson pages: `<iframe src="components/ai-tutor-modal.html"></iframe>`
4. Users with Student tier or higher can access the tutor

### Breaking Changes
None - backward compatible with v1.1.0

---

## v1.1.0 - "Tiered Content & Org Management" (2025-12-21)

### Major Improvements
- ✨ **Tiered Content System**: Implemented a new system for managing content access based on user tiers.
- 🏢 **Organization Management**: Added features for enhanced user and organization management.
- ✅ **Test Coverage**: Added comprehensive unit tests and documentation for the new systems.

---

## v1.0.6 - "Maintenance Update" (2025-12-16)

### Updates
- 🔄 **Version Bump**: Updated version number across all pages (index, topics, quizzes) to ensure consistency.

---

## v1.0.5 - "Games Refactor & Persistence" (2024-12-16)

### Major Improvements
- 🎮 **Refactored All AI Games**: Standardized 33 AI games to Consistent Module Structure
  - `engine.ts` (Core Logic)
  - `ui.ts` (User Interface)
  - `engine.test.ts` (Unit Tests)
  - `index.html` (Module imports)
- ✅ **Infrastructure Stability**: Verified unit tests pass across all game modules

### Bug Fixes
- 🐛 **Fixed Session Persistence**: Users now remain logged in across page navigations
  - Explicitly enabled `browserLocalPersistence` in Firebase config
- 🐛 **Fixed Logout Bug**: Corrected import error in `index.html` that prevented proper logout
- 🐛 **Fixed Test Infrastructure**: Solved HTTPS module import issues in Vitest
- 🔄 **Improved UX**: Login now redirects to previous page or "Topics" (Learning Hub) instead of Dashboard

---

## v1.0.4 - "Low Barrier Registration" (2024-12-11)

### Major Changes - Registration Model
- 🚀 **Removed age verification requirement**
  - No more 13+ age check or birthdate collection
  - Instant account creation - low barrier to register
  - All users start as 'guest' role by default
  - Requires teacher/admin approval for content access (high barrier to access)

### Backend Changes
- ✅ Updated `registerUser()` - removed birthdate parameter
- ✅ Updated `completeGoogleRegistration()` - removed age verification logic
- ✅ Updated `loginWithGoogle()` - auto-completes registration for new Google users
- ✅ Removed `calculateAge()` function
- ✅ Updated Firestore rules - removed age/birthdate validation
- ✅ Updated `hasRequiredUserFields()` - no longer requires birthdate

### Frontend Changes
- ✅ Removed age requirement notice
- ✅ Removed birthdate input field from registration form
- ✅ Removed Google age verification form
- ✅ Simplified registration flow - one-step process
- ✅ Updated UI: "Start as a guest - teacher approval required for full access"

### Philosophy
This implements a **low-barrier registration** with **high-barrier content access** model:
- **Easy to register** → Anyone can create an account instantly
- **Hard to access content** → Requires teacher/admin approval
- **Guest role default** → Limited permissions until promoted by educator

---

## v1.0.3 - "Update All" (2024-12-11)

### Critical Bug Fix - Google Registration
- 🔥 **FIXED: Firestore rules `hasOnly()` strict validation blocking registration**
  - Removed strict `hasOnly()` check that required exact key matches
  - Rule was failing because it expected optional fields: 'bio', 'profilePictureUrl', 'school', 'grade'
  - Changed to allow required fields + any optional fields
  - This was the ACTUAL cause of "Missing or insufficient permissions" errors

### Additional Fixes
- ✅ Fixed `duration.value()` syntax: changed `duration.value('31536000s')` to `duration.value(365, 'd')`
- ✅ Added comprehensive debugging to identify the root cause
- ✅ Removed null photoURL field handling

---

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
