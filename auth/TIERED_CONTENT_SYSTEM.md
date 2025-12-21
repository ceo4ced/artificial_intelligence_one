# Tiered Content System & Organization Management

## Overview

This document describes the 8-tier user permission system, content subscription tiers, organization hierarchy, and analytics features implemented for the AI Learning Platform.

---

## 8-Tier User Permission System

### Tier Levels

| Level | Role | Description | Use Case |
|-------|------|-------------|----------|
| 0 | `public` | Unauthenticated visitors | Landing pages, marketing |
| 1 | `guest` | Logged in, unverified | Basic browsing, limited access |
| 2 | `student` | Verified student | Full learning access |
| 3 | `teacher` | Classroom educator | Manage students, view analytics |
| 4 | `principal` | School administrator | Manage teachers, school analytics |
| 5 | `superintendent` | District/Board administrator | Manage schools, district analytics |
| 6 | `system_admin` | Platform administrator | System configuration, all users |
| 7 | `super_admin` | Ultimate authority | Delete accounts, manage admins |

### Permission Matrix

```javascript
// View permissions (tier 1+)
VIEW_LESSONS: guest, student, teacher, principal, superintendent, system_admin, super_admin
VIEW_TOPICS: guest, student, teacher, principal, superintendent, system_admin, super_admin
VIEW_PREMIUM_CONTENT: student, teacher, principal, superintendent, system_admin, super_admin

// Interaction permissions (tier 2+)
USE_VISUALIZERS: student, teacher, principal, superintendent, system_admin, super_admin
PLAY_GAMES: student, teacher, principal, superintendent, system_admin, super_admin
TAKE_QUIZZES: student, teacher, principal, superintendent, system_admin, super_admin
VIEW_OWN_SCORES: student, teacher, principal, superintendent, system_admin, super_admin
SAVE_PROGRESS: student, teacher, principal, superintendent, system_admin, super_admin

// Teacher permissions (tier 3+)
VIEW_ALL_STUDENTS: teacher, principal, superintendent, system_admin, super_admin
EXPORT_DATA: teacher, principal, superintendent, system_admin, super_admin
MANAGE_CLASSROOM: teacher, principal, superintendent, system_admin, super_admin
APPROVE_STUDENTS: teacher, principal, superintendent, system_admin, super_admin

// Principal permissions (tier 4+)
VIEW_SCHOOL_ANALYTICS: principal, superintendent, system_admin, super_admin
MANAGE_TEACHERS: principal, superintendent, system_admin, super_admin
APPROVE_TEACHERS: principal, superintendent, system_admin, super_admin
SCHOOL_CONFIGURATION: principal, superintendent, system_admin, super_admin

// Superintendent permissions (tier 5+)
VIEW_DISTRICT_ANALYTICS: superintendent, system_admin, super_admin
MANAGE_SCHOOLS: superintendent, system_admin, super_admin
MANAGE_PRINCIPALS: superintendent, system_admin, super_admin
DISTRICT_CONFIGURATION: superintendent, system_admin, super_admin

// System Admin permissions (tier 6+)
SYSTEM_CONFIGURATION: system_admin, super_admin
VIEW_ALL_ANALYTICS: system_admin, super_admin
MANAGE_ALL_USERS: system_admin, super_admin
MANAGE_CONTENT: system_admin, super_admin

// Super Admin only (tier 7)
DELETE_ACCOUNTS: super_admin
SUPER_ADMIN_ACCESS: super_admin
MANAGE_SYSTEM_ADMINS: super_admin
```

### Usage

```javascript
import { hasPermission, ROLES } from './auth-guard.js';
import { hasMinimumTier, USER_TIERS } from './tier-system.js';

// Check specific permission
if (hasPermission(user.role, 'MANAGE_CLASSROOM')) {
    // Show classroom management UI
}

// Check tier level
if (hasMinimumTier(user.role, USER_TIERS.TEACHER)) {
    // User is teacher or higher
}
```

---

## Content Subscription Tiers

### Tier Definitions

| Tier | Price (Monthly) | Features |
|------|-----------------|----------|
| **Free** | $0 | Basic lessons, 10 quizzes/month, limited games |
| **Premium** | $9.99/mo | Unlimited quizzes, all games, visualizers, certificates |
| **Enterprise** | Custom | Volume pricing, SSO, dedicated support, API access |

### Feature Access

```javascript
const CONTENT_TIER_FEATURES = {
    free: {
        maxQuizzesPerMonth: 10,
        canAccessPremiumLessons: false,
        canAccessGames: true,  // Limited
        canAccessVisualizers: false,
        canExportData: false,
        canGetCertificates: false,
        maxClassroomSize: 0
    },
    premium: {
        maxQuizzesPerMonth: Infinity,
        canAccessPremiumLessons: true,
        canAccessGames: true,
        canAccessVisualizers: true,
        canExportData: true,
        canGetCertificates: true,
        maxClassroomSize: 35
    },
    enterprise: {
        maxQuizzesPerMonth: Infinity,
        canAccessPremiumLessons: true,
        canAccessGames: true,
        canAccessVisualizers: true,
        canExportData: true,
        canGetCertificates: true,
        maxClassroomSize: Infinity,
        ssoEnabled: true,
        apiAccess: true,
        dedicatedSupport: true
    }
};
```

### Billing Cycles

| Cycle | Discount |
|-------|----------|
| Monthly | Base price |
| Annual | ~17% discount ($99.99/year vs $119.88) |

### Volume Discounts (Enterprise)

| Students | Discount |
|----------|----------|
| 1-100 | 0% |
| 101-500 | 10% |
| 501-1000 | 15% |
| 1001-5000 | 20% |
| 5001+ | 25% |

---

## Organization Hierarchy

### Structure

```
State (Level 1)
└── County (Optional, Level 2)
    └── District (Level 3)
        └── City (Optional, Level 4)
            └── School (Level 5)
                └── Classroom (Level 6)
                    └── Student (Level 7)
```

### Organization Types

| Type | Created By | Managed By |
|------|------------|------------|
| `state` | Super Admin | Super Admin |
| `county` | Superintendent | Superintendent+ |
| `district` | Superintendent | Superintendent+ |
| `city` | Principal | Principal+ |
| `school` | Principal | Principal+ |
| `classroom` | Teacher | Teacher+ |

### Classroom Management

#### Creating a Classroom

```javascript
import { createClassroom } from './organization-management.js';

const classroom = await createClassroom({
    name: 'AI Fundamentals - Period 3',
    schoolId: 'school_123',
    teacherId: 'teacher_abc',
    subject: 'Artificial Intelligence',
    gradeLevel: '9-12',
    maxStudents: 30
});
// Returns: { id, name, joinCode, ... }
```

#### Join Codes

Each classroom gets a unique 6-character join code:
- Format: `ABC123` (uppercase letters + numbers)
- Valid for 30 days (configurable)
- Can be regenerated by teacher

#### Student Enrollment

```javascript
import { joinClassroom } from './organization-management.js';

const enrollment = await joinClassroom('ABC123', studentUserId);
// Creates pending enrollment, requires teacher approval
```

### Teacher Registration Workflow

1. **User registers** with `.edu` email
2. **System creates** approval request
3. **Principal reviews** and approves/denies
4. **On approval**: User role upgraded to `teacher`

```javascript
import { requestTeacherRegistration, processApprovalRequest } from './organization-management.js';

// Step 1: User submits request
await requestTeacherRegistration({
    userId: 'user_123',
    schoolId: 'school_abc',
    credentials: 'State Teaching License #12345',
    subjects: ['Computer Science', 'Mathematics']
});

// Step 2: Principal approves
await processApprovalRequest('request_xyz', {
    status: 'approved',
    approvedBy: 'principal_456',
    notes: 'Verified credentials'
});
```

---

## Analytics & Reporting

### Event Types

#### User Lifecycle Events
- `user_registered` - New account created
- `user_login` - User logged in
- `user_logout` - User logged out
- `user_upgraded` - Subscription upgraded
- `user_downgraded` - Subscription downgraded
- `user_churned` - User cancelled/left

#### Content Engagement Events
- `lesson_started` - Lesson opened
- `lesson_completed` - Lesson finished
- `quiz_started` - Quiz begun
- `quiz_completed` - Quiz submitted
- `game_started` - Game launched
- `game_completed` - Game finished
- `visualizer_used` - ML visualizer accessed

#### Subscription Events
- `trial_started` - Free trial begun
- `trial_converted` - Trial converted to paid
- `trial_expired` - Trial ended without conversion
- `subscription_created` - New subscription
- `subscription_renewed` - Subscription renewed
- `subscription_cancelled` - Subscription cancelled
- `payment_completed` - Payment successful
- `payment_failed` - Payment failed

#### Organization Events
- `org_created` - Organization created
- `classroom_created` - Classroom created
- `student_enrolled` - Student joined classroom
- `teacher_approved` - Teacher registration approved

### Metric Types

#### Engagement Metrics
- `dau` - Daily Active Users
- `wau` - Weekly Active Users
- `mau` - Monthly Active Users
- `avg_session_duration` - Average session length
- `pages_per_session` - Pages viewed per session
- `bounce_rate` - Single-page session rate

#### Learning Metrics
- `lesson_completion_rate` - % of started lessons completed
- `quiz_avg_score` - Average quiz score
- `quiz_pass_rate` - % of quizzes passed (>70%)
- `learning_path_progress` - % of curriculum completed
- `time_to_completion` - Time to complete learning path

#### Conversion Metrics
- `registration_rate` - Visitors → Registered users
- `trial_conversion_rate` - Trials → Paid subscriptions
- `free_to_paid_rate` - Free → Premium conversions
- `upgrade_rate` - Any tier upgrade rate
- `churn_rate` - Subscription cancellation rate

#### Revenue Metrics
- `mrr` - Monthly Recurring Revenue
- `arr` - Annual Recurring Revenue
- `arpu` - Average Revenue Per User
- `clv` - Customer Lifetime Value

### Usage Examples

```javascript
import { trackEvent, trackQuizCompletion, ANALYTICS_EVENTS } from './analytics-reporting.js';

// Track custom event
await trackEvent(ANALYTICS_EVENTS.LESSON_COMPLETED, {
    lessonId: 'intro-to-ml',
    userId: 'user_123',
    timeSpent: 1800 // seconds
});

// Track quiz completion
await trackQuizCompletion('quiz_456', {
    score: 8,
    totalQuestions: 10,
    timeSpent: 600,
    passed: true
});
```

---

## Firestore Collections

### Schema Overview

```
users/
  {userId}/
    email, displayName, role, createdAt
    quizScores/
      {quizId}/
        score, totalQuestions, completedAt
    memberships/
      {membershipId}/
        organizationId, role, status
    enrollments/
      {enrollmentId}/
        classroomId, status, enrolledAt

organizations/
  {orgId}/
    id, type, name, parentId, parentPath, adminIds, createdAt

classrooms/
  {classroomId}/
    id, name, schoolId, teacherId, coTeacherIds, studentIds, joinCode

subscriptions/
  {subscriptionId}/
    id, userId, organizationId, tier, status, billingCycle, currentPeriodEnd

payments/
  {paymentId}/
    id, subscriptionId, userId, amount, status, createdAt

approvalRequests/
  {requestId}/
    id, userId, type, schoolId, status, createdAt

coupons/
  {couponCode}/
    code, discountPercent, validUntil, maxUses, usedCount

usage/
  {userId}/
    quizzesThisMonth, lastQuizDate, monthlyReset

analytics/
  {docId}/
    type, data, timestamp
```

### Security Rules Summary

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| users | Own profile only | Own + Teachers | Own (no role change) | Super Admin |
| quizScores | Student+ own | Own + Teachers | Own | Never |
| organizations | By tier level | Admins + Members | Org Admins | System Admin |
| classrooms | Teachers | Teachers + Enrolled | Owner + Co-teacher | Owner + Principal |
| subscriptions | Own | Own + System Admin | Own (limited) | System Admin |
| payments | System Admin | Own + System Admin | System Admin | Never |
| analytics | System Admin | Teachers+ | System Admin | System Admin |

---

## API Reference

### tier-system.js

```javascript
// Constants
USER_TIERS           // { PUBLIC: 0, GUEST: 1, ..., SUPER_ADMIN: 7 }
USER_TIER_NAMES      // { 0: 'Public', 1: 'Guest', ... }
CONTENT_TIERS        // { FREE: 'free', PREMIUM: 'premium', ENTERPRISE: 'enterprise' }
PERMISSIONS          // Permission definitions by tier

// Functions
getUserTierLevel(role)              // Returns numeric tier (0-7)
getTierName(level)                  // Returns tier display name
hasMinimumTier(userRole, requiredTier)  // Boolean check
hasPermission(userRole, permission) // Boolean check
canAccessContent(userRole, subscriptionTier, contentType)  // Boolean check
getUserSubscription(userId)         // Returns subscription object
```

### auth-guard.js

```javascript
// Constants
ROLES                // Role string constants
PERMISSIONS          // Permission arrays by role

// Functions
hasPermission(userRole, permission) // Check specific permission
requireAuth(redirectUrl)            // Require authentication
requireRole(role, redirectUrl)      // Require minimum role
requireTier(tierLevel, redirectUrl) // Require minimum tier
requirePremium(redirectUrl)         // Require premium subscription
checkContentAccess(contentType)     // Check content access
applyPermissions()                  // Apply UI visibility
getRoleDisplayName(role)            // Get display name
getNextRole(currentRole)            // Get upgrade target
canUpgrade(currentRole)             // Check upgrade eligibility
initAuthGuard(options)              // Initialize on page load
```

### organization-management.js

```javascript
// Constants
ORG_TYPES            // Organization type constants
MEMBERSHIP_STATUS    // active, pending, suspended, removed
ENROLLMENT_STATUS    // enrolled, pending, removed

// Functions
createOrganization(data)            // Create new org
updateOrganization(orgId, data)     // Update org
getOrganization(orgId)              // Get org by ID
getOrganizationChildren(orgId)      // Get child orgs
createClassroom(data)               // Create classroom
updateClassroom(classroomId, data)  // Update classroom
getClassroom(classroomId)           // Get classroom
joinClassroom(joinCode, userId)     // Join via code
generateJoinCode()                  // Generate new code
requestTeacherRegistration(data)    // Submit teacher request
processApprovalRequest(id, data)    // Approve/deny request
```

### subscription-management.js

```javascript
// Constants
SUBSCRIPTION_TYPES   // individual, family, classroom, school, district
SUBSCRIPTION_STATUS  // active, trialing, past_due, cancelled, expired
BILLING_CYCLES       // monthly, annual
PRICING              // Price matrix by tier/type/cycle

// Functions
createSubscription(data)            // Create subscription
updateSubscription(id, data)        // Update subscription
cancelSubscription(id, reason)      // Cancel subscription
getSubscription(id)                 // Get by ID
getUserSubscriptions(userId)        // Get user's subscriptions
startFreeTrial(userId)              // Start trial
checkTrialStatus(subscriptionId)    // Check trial expiry
calculateProration(subscription, newTier)  // Calculate proration
applyVolumeDiscount(price, studentCount)   // Apply volume discount
validateCoupon(code)                // Validate coupon code
applyCoupon(subscriptionId, code)   // Apply coupon
```

### analytics-reporting.js

```javascript
// Constants
ANALYTICS_EVENTS     // Event name constants
METRIC_TYPES         // Metric type constants

// Functions
trackEvent(eventName, data)         // Track custom event
trackQuizCompletion(quizId, data)   // Track quiz
trackLessonEngagement(lessonId, action, data)  // Track lesson
trackSubscriptionEvent(eventType, data)        // Track subscription
getClassroomAnalytics(classroomId, dateRange)  // Get classroom stats
getSchoolAnalytics(schoolId, dateRange)        // Get school stats
getDistrictAnalytics(districtId, dateRange)    // Get district stats
```

---

## Migration from 3-Tier System

### Role Mapping

| Old Role | New Role | New Tier |
|----------|----------|----------|
| guest | guest | 1 |
| student | student | 2 |
| teacher | teacher | 3 |
| (new) | principal | 4 |
| (new) | superintendent | 5 |
| (new) | system_admin | 6 |
| (new) | super_admin | 7 |

### Backward Compatibility

The `auth-guard.js` module maintains backward compatibility:
- Old role constants still work
- `hasPermission()` works with old permission checks
- UI elements with `data-require-role` still function

### Migration Steps

1. **Deploy new auth modules** (tier-system.js, etc.)
2. **Update Firestore rules** (new collections, tier checks)
3. **Update existing code** to use new tier checks
4. **Create admin accounts** (principal, superintendent, etc.)
5. **Set up organizations** (schools, districts)
6. **Enable subscriptions** (Stripe integration)

---

## Security Considerations

### Privilege Escalation Prevention
- Users cannot change their own role
- Role changes require system_admin or higher
- Firestore rules enforce tier-based access

### Data Isolation
- Students can only access own data
- Teachers can read (not modify) student data
- Cross-organization access restricted

### Subscription Enforcement
- Content access checked against subscription tier
- Usage limits tracked per user
- Rate limiting on quiz attempts

### Audit Trail
- All role changes logged
- Subscription changes recorded
- Teacher approvals tracked

---

## Version History

- **v1.0.0** - Initial 3-tier system (guest, student, teacher)
- **v2.0.0** - Extended to 8-tier system with organizations and subscriptions
