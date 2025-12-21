// Authentication Guard and Role-Based Access Control
// Protects pages and features based on user authentication and role
// Updated to support 8-tier user system (0-7)

import { getCurrentUser } from './auth-utils.js';
import {
    USER_TIERS,
    USER_TIER_NAMES,
    PERMISSIONS as TIER_PERMISSIONS,
    hasMinimumTier,
    hasPermission as checkTierPermission,
    getUserTierLevel,
    getTierName,
    getUserSubscription,
    canAccessContent,
    CONTENT_TIERS
} from './tier-system.js';

/**
 * Legacy role mapping (for backward compatibility)
 * Maps old 3-tier system to new 8-tier system
 */
export const ROLES = {
    PUBLIC: 'public',           // Level 0
    GUEST: 'guest',             // Level 1
    STUDENT: 'student',         // Level 2
    TEACHER: 'teacher',         // Level 3
    PRINCIPAL: 'principal',     // Level 4
    SUPERINTENDENT: 'superintendent', // Level 5
    SYSTEM_ADMIN: 'system_admin',     // Level 6
    SUPER_ADMIN: 'super_admin'        // Level 7
};

// Re-export tier system
export { USER_TIERS, USER_TIER_NAMES, CONTENT_TIERS };

/**
 * Permission definitions mapped to tier levels
 * Backward compatible with old permission checks
 */
export const PERMISSIONS = {
    // View permissions
    VIEW_LESSONS: [ROLES.GUEST, ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    VIEW_TOPICS: [ROLES.GUEST, ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    VIEW_PREMIUM_CONTENT: [ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // Interaction permissions
    USE_VISUALIZERS: [ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    PLAY_GAMES: [ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    TAKE_QUIZZES: [ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // Data permissions
    VIEW_OWN_SCORES: [ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    SAVE_PROGRESS: [ROLES.STUDENT, ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // Teacher permissions (Level 3+)
    VIEW_ALL_STUDENTS: [ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    EXPORT_DATA: [ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_USERS: [ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_CLASSROOM: [ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    APPROVE_STUDENTS: [ROLES.TEACHER, ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // Principal permissions (Level 4+)
    VIEW_SCHOOL_ANALYTICS: [ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_TEACHERS: [ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    APPROVE_TEACHERS: [ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    SCHOOL_CONFIGURATION: [ROLES.PRINCIPAL, ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // Superintendent permissions (Level 5+)
    VIEW_DISTRICT_ANALYTICS: [ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_SCHOOLS: [ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_PRINCIPALS: [ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    DISTRICT_CONFIGURATION: [ROLES.SUPERINTENDENT, ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // System Admin permissions (Level 6+)
    SYSTEM_CONFIGURATION: [ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    VIEW_ALL_ANALYTICS: [ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_ALL_USERS: [ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],
    MANAGE_CONTENT: [ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN],

    // Super Admin only (Level 7)
    DELETE_ACCOUNTS: [ROLES.SUPER_ADMIN],
    SUPER_ADMIN_ACCESS: [ROLES.SUPER_ADMIN],
    MANAGE_SYSTEM_ADMINS: [ROLES.SUPER_ADMIN]
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole, permission) {
    if (!PERMISSIONS[permission]) {
        console.error(`Unknown permission: ${permission}`);
        return false;
    }
    return PERMISSIONS[permission].includes(userRole);
}

/**
 * Require authentication for page access
 * Redirects to login if not authenticated
 */
export async function requireAuth(redirectUrl = '/auth/login.html') {
    try {
        const user = await getCurrentUser();

        if (!user) {
            // Save intended destination
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = redirectUrl;
            return null;
        }

        return user;
    } catch (error) {
        console.error('Auth guard error:', error);
        window.location.href = redirectUrl;
        return null;
    }
}

/**
 * Require specific role for page access
 * Redirects to upgrade page if insufficient permissions
 * Updated to support 8-tier system
 */
export async function requireRole(requiredRole, redirectUrl = '/auth/upgrade.html') {
    const user = await requireAuth();
    if (!user) return null;

    const roleHierarchy = {
        [ROLES.PUBLIC]: 0,
        [ROLES.GUEST]: 1,
        [ROLES.STUDENT]: 2,
        [ROLES.TEACHER]: 3,
        [ROLES.PRINCIPAL]: 4,
        [ROLES.SUPERINTENDENT]: 5,
        [ROLES.SYSTEM_ADMIN]: 6,
        [ROLES.SUPER_ADMIN]: 7
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        // User doesn't have required role
        sessionStorage.setItem('requiredRole', requiredRole);
        sessionStorage.setItem('requiredTierLevel', requiredLevel.toString());
        sessionStorage.setItem('redirectAfterUpgrade', window.location.pathname);
        window.location.href = redirectUrl;
        return null;
    }

    return user;
}

/**
 * Require specific tier level for page access
 * Uses numeric tier levels (0-7)
 */
export async function requireTier(requiredTierLevel, redirectUrl = '/auth/upgrade.html') {
    const user = await requireAuth();
    if (!user) return null;

    const userLevel = getUserTierLevel(user.role);

    if (userLevel < requiredTierLevel) {
        sessionStorage.setItem('requiredTierLevel', requiredTierLevel.toString());
        sessionStorage.setItem('requiredTierName', getTierName(requiredTierLevel));
        sessionStorage.setItem('redirectAfterUpgrade', window.location.pathname);
        window.location.href = redirectUrl;
        return null;
    }

    return user;
}

/**
 * Require premium subscription for content access
 */
export async function requirePremium(redirectUrl = '/auth/upgrade.html') {
    const user = await requireAuth();
    if (!user) return null;

    const subscription = await getUserSubscription(user.uid);

    if (!subscription.isActive || subscription.tier === CONTENT_TIERS.FREE) {
        sessionStorage.setItem('requiredSubscription', CONTENT_TIERS.PREMIUM);
        sessionStorage.setItem('redirectAfterUpgrade', window.location.pathname);
        window.location.href = redirectUrl;
        return null;
    }

    return { user, subscription };
}

/**
 * Check content access based on user tier and subscription
 */
export async function checkContentAccess(contentType) {
    const user = await getCurrentUser();
    if (!user) {
        return {
            canAccess: false,
            reason: 'authentication_required',
            message: 'Please log in to access this content.'
        };
    }

    const subscription = await getUserSubscription(user.uid);
    const canAccess = canAccessContent(user.role, subscription.tier, contentType);

    if (!canAccess) {
        const userLevel = getUserTierLevel(user.role);
        return {
            canAccess: false,
            reason: 'insufficient_access',
            userTier: user.role,
            subscriptionTier: subscription.tier,
            message: `This content requires higher access level or subscription.`
        };
    }

    return { canAccess: true, user, subscription };
}

/**
 * Require specific permission for feature access
 */
export async function requirePermission(permission) {
    const user = await requireAuth();
    if (!user) return false;

    return hasPermission(user.role, permission);
}

/**
 * Show/hide elements based on permissions
 * Usage: <div data-permission="USE_VISUALIZERS">...</div>
 */
export async function applyPermissions() {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        // Find all elements with permission attributes
        const permissionElements = document.querySelectorAll('[data-permission]');

        permissionElements.forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');

            if (hasPermission(user.role, requiredPermission)) {
                element.style.display = '';
                element.classList.remove('permission-denied');
            } else {
                element.style.display = 'none';
                element.classList.add('permission-denied');
            }
        });

        // Find all elements with role requirements
        const roleElements = document.querySelectorAll('[data-require-role]');

        roleElements.forEach(element => {
            const requiredRole = element.getAttribute('data-require-role');
            const roleHierarchy = {
                [ROLES.PUBLIC]: 0,
                [ROLES.GUEST]: 1,
                [ROLES.STUDENT]: 2,
                [ROLES.TEACHER]: 3,
                [ROLES.PRINCIPAL]: 4,
                [ROLES.SUPERINTENDENT]: 5,
                [ROLES.SYSTEM_ADMIN]: 6,
                [ROLES.SUPER_ADMIN]: 7
            };

            const userLevel = roleHierarchy[user.role] || 0;
            const requiredLevel = roleHierarchy[requiredRole] || 0;

            if (userLevel >= requiredLevel) {
                element.style.display = '';
                element.classList.remove('role-denied');
            } else {
                element.style.display = 'none';
                element.classList.add('role-denied');
            }
        });

    } catch (error) {
        console.error('Error applying permissions:', error);
    }
}

/**
 * Get user's role display name
 * Updated for 8-tier system
 */
export function getRoleDisplayName(role) {
    const displayNames = {
        [ROLES.PUBLIC]: 'Public',
        [ROLES.GUEST]: 'Guest',
        [ROLES.STUDENT]: 'Student',
        [ROLES.TEACHER]: 'Teacher',
        [ROLES.PRINCIPAL]: 'Principal/Admin',
        [ROLES.SUPERINTENDENT]: 'Superintendent/Board',
        [ROLES.SYSTEM_ADMIN]: 'System Administrator',
        [ROLES.SUPER_ADMIN]: 'Super Admin'
    };
    return displayNames[role] || getTierName(getUserTierLevel(role)) || 'Unknown';
}

/**
 * Get next role in hierarchy (for upgrade prompts)
 * Updated for 8-tier system
 */
export function getNextRole(currentRole) {
    const roleOrder = [
        ROLES.PUBLIC,
        ROLES.GUEST,
        ROLES.STUDENT,
        ROLES.TEACHER,
        ROLES.PRINCIPAL,
        ROLES.SUPERINTENDENT,
        ROLES.SYSTEM_ADMIN,
        ROLES.SUPER_ADMIN
    ];

    const currentIndex = roleOrder.indexOf(currentRole);
    if (currentIndex === -1 || currentIndex >= roleOrder.length - 1) {
        return null; // Already at highest or unknown role
    }

    return roleOrder[currentIndex + 1];
}

/**
 * Check if user can upgrade their role
 * Guest can request student (through teacher approval)
 * Higher tier upgrades require admin intervention
 */
export function canUpgrade(currentRole) {
    const upgradableRoles = [ROLES.GUEST]; // Only guests can self-request upgrade
    return upgradableRoles.includes(currentRole);
}

/**
 * Check if user can upgrade their subscription
 */
export async function canUpgradeSubscription(userId) {
    const subscription = await getUserSubscription(userId);
    return subscription.tier !== CONTENT_TIERS.ENTERPRISE;
}

/**
 * Initialize auth guard on page load
 * Call this at the bottom of protected pages
 */
export async function initAuthGuard(options = {}) {
    const {
        requireAuth: needsAuth = true,
        requiredRole = null,
        requiredPermission = null,
        onSuccess = null,
        onFailure = null
    } = options;

    try {
        let user = null;

        if (needsAuth) {
            user = await requireAuth();
            if (!user) return;
        }

        if (requiredRole) {
            user = await requireRole(requiredRole);
            if (!user) return;
        }

        if (requiredPermission) {
            const allowed = await requirePermission(requiredPermission);
            if (!allowed) {
                if (onFailure) onFailure();
                return;
            }
        }

        // Apply permission-based UI hiding
        await applyPermissions();

        if (onSuccess) onSuccess(user);

        return user;

    } catch (error) {
        console.error('Auth guard initialization error:', error);
        if (onFailure) onFailure(error);
    }
}

// Auto-apply permissions on DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPermissions);
} else {
    applyPermissions();
}
