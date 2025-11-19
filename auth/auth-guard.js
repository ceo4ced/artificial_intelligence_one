// Authentication Guard and Role-Based Access Control
// Protects pages and features based on user authentication and role

import { getCurrentUser } from './auth-utils.js';

/**
 * Role hierarchy and permissions
 */
export const ROLES = {
    GUEST: 'guest',      // Can view lessons only, no interaction
    STUDENT: 'student',  // Full access to all learning materials
    TEACHER: 'teacher'   // Admin access + all student features
};

/**
 * Permission definitions for each role
 */
export const PERMISSIONS = {
    // View permissions
    VIEW_LESSONS: [ROLES.GUEST, ROLES.STUDENT, ROLES.TEACHER],
    VIEW_TOPICS: [ROLES.GUEST, ROLES.STUDENT, ROLES.TEACHER],

    // Interaction permissions
    USE_VISUALIZERS: [ROLES.STUDENT, ROLES.TEACHER],
    PLAY_GAMES: [ROLES.STUDENT, ROLES.TEACHER],
    TAKE_QUIZZES: [ROLES.STUDENT, ROLES.TEACHER],

    // Data permissions
    VIEW_OWN_SCORES: [ROLES.STUDENT, ROLES.TEACHER],
    SAVE_PROGRESS: [ROLES.STUDENT, ROLES.TEACHER],

    // Teacher-only permissions
    VIEW_ALL_STUDENTS: [ROLES.TEACHER],
    EXPORT_DATA: [ROLES.TEACHER],
    MANAGE_USERS: [ROLES.TEACHER],
    DELETE_ACCOUNTS: [ROLES.TEACHER]
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
 */
export async function requireRole(requiredRole, redirectUrl = '/auth/upgrade.html') {
    const user = await requireAuth();
    if (!user) return null;

    const roleHierarchy = {
        [ROLES.GUEST]: 0,
        [ROLES.STUDENT]: 1,
        [ROLES.TEACHER]: 2
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        // User doesn't have required role
        sessionStorage.setItem('requiredRole', requiredRole);
        sessionStorage.setItem('redirectAfterUpgrade', window.location.pathname);
        window.location.href = redirectUrl;
        return null;
    }

    return user;
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
                [ROLES.GUEST]: 0,
                [ROLES.STUDENT]: 1,
                [ROLES.TEACHER]: 2
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
 */
export function getRoleDisplayName(role) {
    const displayNames = {
        [ROLES.GUEST]: 'Guest',
        [ROLES.STUDENT]: 'Student',
        [ROLES.TEACHER]: 'Teacher'
    };
    return displayNames[role] || 'Unknown';
}

/**
 * Get next role in hierarchy (for upgrade prompts)
 */
export function getNextRole(currentRole) {
    if (currentRole === ROLES.GUEST) return ROLES.STUDENT;
    if (currentRole === ROLES.STUDENT) return ROLES.TEACHER;
    return null; // Teacher is highest role
}

/**
 * Check if user can upgrade
 */
export function canUpgrade(currentRole) {
    return currentRole === ROLES.GUEST; // Only guests can upgrade to student
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
