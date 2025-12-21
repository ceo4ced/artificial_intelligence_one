/**
 * Unit tests for auth-guard.js
 * Tests role-based access control and permission system
 * Updated for 8-tier user system (0-7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ROLES,
    PERMISSIONS,
    USER_TIERS,
    USER_TIER_NAMES,
    CONTENT_TIERS,
    hasPermission,
    getRoleDisplayName,
    getNextRole,
    canUpgrade
} from '../auth/auth-guard.js';

// ============================================================================
// ROLE DEFINITIONS TESTS
// ============================================================================

describe('Auth Guard - Role System (8-Tier)', () => {

    describe('ROLES constant', () => {
        it('should define all 8 role types', () => {
            expect(ROLES.PUBLIC).toBe('public');
            expect(ROLES.GUEST).toBe('guest');
            expect(ROLES.STUDENT).toBe('student');
            expect(ROLES.TEACHER).toBe('teacher');
            expect(ROLES.PRINCIPAL).toBe('principal');
            expect(ROLES.SUPERINTENDENT).toBe('superintendent');
            expect(ROLES.SYSTEM_ADMIN).toBe('system_admin');
            expect(ROLES.SUPER_ADMIN).toBe('super_admin');
        });

        it('should have exactly 8 roles', () => {
            expect(Object.keys(ROLES).length).toBe(8);
        });
    });

    describe('Re-exported tier constants', () => {
        it('should export USER_TIERS from tier-system', () => {
            expect(USER_TIERS.PUBLIC).toBe(0);
            expect(USER_TIERS.SUPER_ADMIN).toBe(7);
        });

        it('should export CONTENT_TIERS from tier-system', () => {
            expect(CONTENT_TIERS.FREE).toBe('free');
            expect(CONTENT_TIERS.PREMIUM).toBe('premium');
            expect(CONTENT_TIERS.ENTERPRISE).toBe('enterprise');
        });
    });
});

// ============================================================================
// PERMISSIONS TESTS
// ============================================================================

describe('Auth Guard - Permissions (8-Tier)', () => {

    describe('PERMISSIONS constant', () => {
        it('should define VIEW_LESSONS permission for all authenticated roles', () => {
            expect(PERMISSIONS.VIEW_LESSONS).toContain('guest');
            expect(PERMISSIONS.VIEW_LESSONS).toContain('student');
            expect(PERMISSIONS.VIEW_LESSONS).toContain('teacher');
            expect(PERMISSIONS.VIEW_LESSONS).toContain('principal');
            expect(PERMISSIONS.VIEW_LESSONS).toContain('superintendent');
            expect(PERMISSIONS.VIEW_LESSONS).toContain('system_admin');
            expect(PERMISSIONS.VIEW_LESSONS).toContain('super_admin');
        });

        it('should define interactive permissions for students and above', () => {
            expect(PERMISSIONS.USE_VISUALIZERS).not.toContain('guest');
            expect(PERMISSIONS.USE_VISUALIZERS).toContain('student');
            expect(PERMISSIONS.USE_VISUALIZERS).toContain('teacher');
            expect(PERMISSIONS.USE_VISUALIZERS).toContain('super_admin');
        });

        it('should define teacher permissions (Level 3+)', () => {
            expect(PERMISSIONS.MANAGE_CLASSROOM).not.toContain('student');
            expect(PERMISSIONS.MANAGE_CLASSROOM).toContain('teacher');
            expect(PERMISSIONS.APPROVE_STUDENTS).toContain('teacher');
        });

        it('should define principal permissions (Level 4+)', () => {
            expect(PERMISSIONS.VIEW_SCHOOL_ANALYTICS).not.toContain('teacher');
            expect(PERMISSIONS.VIEW_SCHOOL_ANALYTICS).toContain('principal');
            expect(PERMISSIONS.MANAGE_TEACHERS).toContain('principal');
            expect(PERMISSIONS.APPROVE_TEACHERS).toContain('principal');
        });

        it('should define superintendent permissions (Level 5+)', () => {
            expect(PERMISSIONS.VIEW_DISTRICT_ANALYTICS).not.toContain('principal');
            expect(PERMISSIONS.VIEW_DISTRICT_ANALYTICS).toContain('superintendent');
            expect(PERMISSIONS.MANAGE_SCHOOLS).toContain('superintendent');
        });

        it('should define system admin permissions (Level 6+)', () => {
            expect(PERMISSIONS.SYSTEM_CONFIGURATION).not.toContain('superintendent');
            expect(PERMISSIONS.SYSTEM_CONFIGURATION).toContain('system_admin');
            expect(PERMISSIONS.VIEW_ALL_ANALYTICS).toContain('system_admin');
        });

        it('should define super admin only permissions (Level 7)', () => {
            expect(PERMISSIONS.DELETE_ACCOUNTS).toEqual(['super_admin']);
            expect(PERMISSIONS.SUPER_ADMIN_ACCESS).toEqual(['super_admin']);
            expect(PERMISSIONS.MANAGE_SYSTEM_ADMINS).toEqual(['super_admin']);
        });
    });

    describe('hasPermission()', () => {
        // Guest permissions
        it('should allow guests to view lessons', () => {
            expect(hasPermission('guest', 'VIEW_LESSONS')).toBe(true);
        });

        it('should NOT allow guests to use visualizers', () => {
            expect(hasPermission('guest', 'USE_VISUALIZERS')).toBe(false);
        });

        // Student permissions
        it('should allow students interactive features', () => {
            expect(hasPermission('student', 'USE_VISUALIZERS')).toBe(true);
            expect(hasPermission('student', 'PLAY_GAMES')).toBe(true);
            expect(hasPermission('student', 'TAKE_QUIZZES')).toBe(true);
        });

        it('should NOT allow students to manage classrooms', () => {
            expect(hasPermission('student', 'MANAGE_CLASSROOM')).toBe(false);
        });

        // Teacher permissions
        it('should allow teachers classroom management', () => {
            expect(hasPermission('teacher', 'MANAGE_CLASSROOM')).toBe(true);
            expect(hasPermission('teacher', 'APPROVE_STUDENTS')).toBe(true);
            expect(hasPermission('teacher', 'EXPORT_DATA')).toBe(true);
        });

        it('should NOT allow teachers school-level permissions', () => {
            expect(hasPermission('teacher', 'VIEW_SCHOOL_ANALYTICS')).toBe(false);
            expect(hasPermission('teacher', 'MANAGE_TEACHERS')).toBe(false);
        });

        // Principal permissions
        it('should allow principals school management', () => {
            expect(hasPermission('principal', 'VIEW_SCHOOL_ANALYTICS')).toBe(true);
            expect(hasPermission('principal', 'MANAGE_TEACHERS')).toBe(true);
            expect(hasPermission('principal', 'APPROVE_TEACHERS')).toBe(true);
        });

        it('should NOT allow principals district-level permissions', () => {
            expect(hasPermission('principal', 'VIEW_DISTRICT_ANALYTICS')).toBe(false);
            expect(hasPermission('principal', 'MANAGE_SCHOOLS')).toBe(false);
        });

        // Superintendent permissions
        it('should allow superintendents district management', () => {
            expect(hasPermission('superintendent', 'VIEW_DISTRICT_ANALYTICS')).toBe(true);
            expect(hasPermission('superintendent', 'MANAGE_SCHOOLS')).toBe(true);
            expect(hasPermission('superintendent', 'MANAGE_PRINCIPALS')).toBe(true);
        });

        it('should NOT allow superintendents system configuration', () => {
            expect(hasPermission('superintendent', 'SYSTEM_CONFIGURATION')).toBe(false);
        });

        // System Admin permissions
        it('should allow system admins system configuration', () => {
            expect(hasPermission('system_admin', 'SYSTEM_CONFIGURATION')).toBe(true);
            expect(hasPermission('system_admin', 'VIEW_ALL_ANALYTICS')).toBe(true);
            expect(hasPermission('system_admin', 'MANAGE_ALL_USERS')).toBe(true);
        });

        it('should NOT allow system admins super admin actions', () => {
            expect(hasPermission('system_admin', 'DELETE_ACCOUNTS')).toBe(false);
            expect(hasPermission('system_admin', 'SUPER_ADMIN_ACCESS')).toBe(false);
        });

        // Super Admin permissions
        it('should allow super admins all permissions', () => {
            expect(hasPermission('super_admin', 'DELETE_ACCOUNTS')).toBe(true);
            expect(hasPermission('super_admin', 'SUPER_ADMIN_ACCESS')).toBe(true);
            expect(hasPermission('super_admin', 'MANAGE_SYSTEM_ADMINS')).toBe(true);
        });

        // Error handling
        it('should return false for unknown permissions', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(hasPermission('student', 'UNKNOWN_PERMISSION')).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown permission'));
            consoleSpy.mockRestore();
        });
    });
});

// ============================================================================
// ROLE DISPLAY AND NAVIGATION TESTS
// ============================================================================

describe('Auth Guard - Role Display Names (8-Tier)', () => {

    describe('getRoleDisplayName()', () => {
        it('should return display name for all roles', () => {
            expect(getRoleDisplayName('public')).toBe('Public');
            expect(getRoleDisplayName('guest')).toBe('Guest');
            expect(getRoleDisplayName('student')).toBe('Student');
            expect(getRoleDisplayName('teacher')).toBe('Teacher');
            expect(getRoleDisplayName('principal')).toBe('Principal/Admin');
            expect(getRoleDisplayName('superintendent')).toBe('Superintendent/Board');
            expect(getRoleDisplayName('system_admin')).toBe('System Administrator');
            expect(getRoleDisplayName('super_admin')).toBe('Super Admin');
        });

        it('should handle unknown roles gracefully', () => {
            const result = getRoleDisplayName('invalid_role');
            expect(result).toBeDefined();
        });
    });

    describe('getNextRole()', () => {
        it('should return next role in hierarchy', () => {
            expect(getNextRole('public')).toBe('guest');
            expect(getNextRole('guest')).toBe('student');
            expect(getNextRole('student')).toBe('teacher');
            expect(getNextRole('teacher')).toBe('principal');
            expect(getNextRole('principal')).toBe('superintendent');
            expect(getNextRole('superintendent')).toBe('system_admin');
            expect(getNextRole('system_admin')).toBe('super_admin');
        });

        it('should return null for super_admin (highest role)', () => {
            expect(getNextRole('super_admin')).toBe(null);
        });

        it('should return null for unknown roles', () => {
            expect(getNextRole('invalid_role')).toBe(null);
        });
    });

    describe('canUpgrade()', () => {
        it('should return true only for guest', () => {
            expect(canUpgrade('guest')).toBe(true);
        });

        it('should return false for all other roles', () => {
            expect(canUpgrade('public')).toBe(false);
            expect(canUpgrade('student')).toBe(false);
            expect(canUpgrade('teacher')).toBe(false);
            expect(canUpgrade('principal')).toBe(false);
            expect(canUpgrade('superintendent')).toBe(false);
            expect(canUpgrade('system_admin')).toBe(false);
            expect(canUpgrade('super_admin')).toBe(false);
        });
    });
});

// ============================================================================
// PERMISSION HIERARCHY TESTS
// ============================================================================

describe('Auth Guard - Permission Hierarchy (8-Tier)', () => {

    it('should maintain proper 8-tier role hierarchy', () => {
        const roles = ['guest', 'student', 'teacher', 'principal', 'superintendent', 'system_admin', 'super_admin'];

        for (let i = 1; i < roles.length; i++) {
            const currentRole = roles[i];
            const previousRole = roles[i - 1];

            const currentPerms = Object.keys(PERMISSIONS).filter(perm =>
                hasPermission(currentRole, perm)
            );

            const previousPerms = Object.keys(PERMISSIONS).filter(perm =>
                hasPermission(previousRole, perm)
            );

            // Each role should have at least as many permissions as the previous
            expect(currentPerms.length).toBeGreaterThanOrEqual(previousPerms.length);
        }
    });

    it('should grant cumulative permissions up the hierarchy', () => {
        const roles = ['guest', 'student', 'teacher', 'principal', 'superintendent', 'system_admin', 'super_admin'];

        roles.forEach((role, index) => {
            if (index === 0) return;

            const previousRole = roles[index - 1];

            Object.keys(PERMISSIONS).forEach(perm => {
                if (hasPermission(previousRole, perm)) {
                    expect(hasPermission(role, perm)).toBe(true);
                }
            });
        });
    });

    it('should have super_admin with all permissions', () => {
        const allPermissions = Object.keys(PERMISSIONS);
        const superAdminPerms = allPermissions.filter(perm =>
            hasPermission('super_admin', perm)
        );

        expect(superAdminPerms.length).toBe(allPermissions.length);
    });
});

// ============================================================================
// SECURITY TESTS
// ============================================================================

describe('Auth Guard - Security Tests (8-Tier)', () => {

    it('should never allow guests to modify data', () => {
        expect(hasPermission('guest', 'SAVE_PROGRESS')).toBe(false);
    });

    it('should never allow students to manage users', () => {
        expect(hasPermission('student', 'MANAGE_USERS')).toBe(false);
    });

    it('should never allow students to delete accounts', () => {
        expect(hasPermission('student', 'DELETE_ACCOUNTS')).toBe(false);
    });

    it('should never allow teachers to approve other teachers', () => {
        expect(hasPermission('teacher', 'APPROVE_TEACHERS')).toBe(false);
    });

    it('should never allow principals to manage system admins', () => {
        expect(hasPermission('principal', 'MANAGE_SYSTEM_ADMINS')).toBe(false);
    });

    it('should never allow superintendents to access super admin features', () => {
        expect(hasPermission('superintendent', 'SUPER_ADMIN_ACCESS')).toBe(false);
    });

    it('should restrict DELETE_ACCOUNTS to super_admin only', () => {
        const rolesWithDelete = Object.values(ROLES).filter(role =>
            hasPermission(role, 'DELETE_ACCOUNTS')
        );
        expect(rolesWithDelete).toEqual(['super_admin']);
    });
});

// ============================================================================
// BACKWARD COMPATIBILITY TESTS
// ============================================================================

describe('Auth Guard - Backward Compatibility', () => {

    it('should still work with legacy 3-tier role names', () => {
        expect(hasPermission('guest', 'VIEW_LESSONS')).toBe(true);
        expect(hasPermission('student', 'TAKE_QUIZZES')).toBe(true);
        expect(hasPermission('teacher', 'VIEW_ALL_STUDENTS')).toBe(true);
    });

    it('should maintain legacy permission behavior', () => {
        // Guest can view but not interact
        expect(hasPermission('guest', 'VIEW_LESSONS')).toBe(true);
        expect(hasPermission('guest', 'USE_VISUALIZERS')).toBe(false);

        // Student can interact
        expect(hasPermission('student', 'USE_VISUALIZERS')).toBe(true);
        expect(hasPermission('student', 'PLAY_GAMES')).toBe(true);

        // Teacher can manage
        expect(hasPermission('teacher', 'VIEW_ALL_STUDENTS')).toBe(true);
        expect(hasPermission('teacher', 'EXPORT_DATA')).toBe(true);
    });
});
