/**
 * Unit tests for tier-system.js
 * Tests user tier levels, content tiers, permissions, and access control
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    USER_TIERS,
    USER_TIER_NAMES,
    CONTENT_TIERS,
    CONTENT_TIER_FEATURES,
    CONTENT_ACCESS,
    PERMISSIONS,
    ROLE_TO_TIER,
    getUserTierLevel,
    getTierName,
    hasMinimumTier,
    hasPermission,
    canAccessContent,
    getUpgradeOptions
} from '../auth/tier-system.js';

// ============================================================================
// USER TIER DEFINITIONS TESTS
// ============================================================================

describe('Tier System - User Tier Definitions', () => {

    describe('USER_TIERS constant', () => {
        it('should define all 8 tier levels (0-7)', () => {
            expect(USER_TIERS.PUBLIC).toBe(0);
            expect(USER_TIERS.GUEST).toBe(1);
            expect(USER_TIERS.STUDENT).toBe(2);
            expect(USER_TIERS.TEACHER).toBe(3);
            expect(USER_TIERS.PRINCIPAL).toBe(4);
            expect(USER_TIERS.SUPERINTENDENT).toBe(5);
            expect(USER_TIERS.SYSTEM_ADMIN).toBe(6);
            expect(USER_TIERS.SUPER_ADMIN).toBe(7);
        });

        it('should have exactly 8 tier levels', () => {
            expect(Object.keys(USER_TIERS).length).toBe(8);
        });

        it('should have consecutive tier values', () => {
            const values = Object.values(USER_TIERS).sort((a, b) => a - b);
            for (let i = 0; i < values.length; i++) {
                expect(values[i]).toBe(i);
            }
        });
    });

    describe('USER_TIER_NAMES constant', () => {
        it('should provide display names for all tier levels', () => {
            expect(USER_TIER_NAMES[0]).toBe('Public');
            expect(USER_TIER_NAMES[1]).toBe('Guest');
            expect(USER_TIER_NAMES[2]).toBe('Student');
            expect(USER_TIER_NAMES[3]).toBe('Teacher');
            expect(USER_TIER_NAMES[4]).toBe('Principal/Admin');
            expect(USER_TIER_NAMES[5]).toBe('Superintendent/Board');
            expect(USER_TIER_NAMES[6]).toBe('System Administrator');
            expect(USER_TIER_NAMES[7]).toBe('Super Admin');
        });

        it('should have names for all 8 tiers', () => {
            expect(Object.keys(USER_TIER_NAMES).length).toBe(8);
        });
    });

    describe('ROLE_TO_TIER mapping', () => {
        it('should map legacy role strings to tier levels', () => {
            expect(ROLE_TO_TIER['public']).toBe(USER_TIERS.PUBLIC);
            expect(ROLE_TO_TIER['guest']).toBe(USER_TIERS.GUEST);
            expect(ROLE_TO_TIER['student']).toBe(USER_TIERS.STUDENT);
            expect(ROLE_TO_TIER['teacher']).toBe(USER_TIERS.TEACHER);
            expect(ROLE_TO_TIER['principal']).toBe(USER_TIERS.PRINCIPAL);
            expect(ROLE_TO_TIER['superintendent']).toBe(USER_TIERS.SUPERINTENDENT);
            expect(ROLE_TO_TIER['system_admin']).toBe(USER_TIERS.SYSTEM_ADMIN);
            expect(ROLE_TO_TIER['super_admin']).toBe(USER_TIERS.SUPER_ADMIN);
        });

        it('should map alias roles correctly', () => {
            expect(ROLE_TO_TIER['admin']).toBe(USER_TIERS.PRINCIPAL);
            expect(ROLE_TO_TIER['board']).toBe(USER_TIERS.SUPERINTENDENT);
        });
    });
});

// ============================================================================
// CONTENT TIER DEFINITIONS TESTS
// ============================================================================

describe('Tier System - Content Tier Definitions', () => {

    describe('CONTENT_TIERS constant', () => {
        it('should define all content tiers', () => {
            expect(CONTENT_TIERS.FREE).toBe('free');
            expect(CONTENT_TIERS.PREMIUM).toBe('premium');
            expect(CONTENT_TIERS.ENTERPRISE).toBe('enterprise');
        });

        it('should have exactly 3 content tiers', () => {
            expect(Object.keys(CONTENT_TIERS).length).toBe(3);
        });
    });

    describe('CONTENT_TIER_FEATURES', () => {
        it('should define features for FREE tier', () => {
            const freeTier = CONTENT_TIER_FEATURES[CONTENT_TIERS.FREE];
            expect(freeTier.name).toBe('Free');
            expect(freeTier.price.monthly).toBe(0);
            expect(freeTier.price.annual).toBe(0);
            expect(freeTier.limits.quizzesPerMonth).toBe(10);
            expect(freeTier.limits.advancedAnalytics).toBe(false);
            expect(freeTier.limits.apLevelContent).toBe(false);
        });

        it('should define features for PREMIUM tier', () => {
            const premiumTier = CONTENT_TIER_FEATURES[CONTENT_TIERS.PREMIUM];
            expect(premiumTier.name).toBe('Premium');
            expect(premiumTier.price.monthly).toBe(9.99);
            expect(premiumTier.price.annual).toBe(99.99);
            expect(premiumTier.limits.quizzesPerMonth).toBe(-1); // unlimited
            expect(premiumTier.limits.advancedAnalytics).toBe(true);
            expect(premiumTier.limits.apLevelContent).toBe(true);
        });

        it('should define features for ENTERPRISE tier', () => {
            const enterpriseTier = CONTENT_TIER_FEATURES[CONTENT_TIERS.ENTERPRISE];
            expect(enterpriseTier.name).toBe('Enterprise');
            expect(enterpriseTier.limits.quizzesPerMonth).toBe(-1);
            expect(enterpriseTier.limits.customPathways).toBe(true);
            expect(enterpriseTier.price.perStudentAnnual).toBe(5.99);
        });

        it('should have features array for each tier', () => {
            Object.values(CONTENT_TIERS).forEach(tier => {
                expect(Array.isArray(CONTENT_TIER_FEATURES[tier].features)).toBe(true);
                expect(CONTENT_TIER_FEATURES[tier].features.length).toBeGreaterThan(0);
            });
        });
    });

    describe('CONTENT_ACCESS definitions', () => {
        it('should define access requirements for basic content', () => {
            expect(CONTENT_ACCESS.BASIC_LESSONS.requiredUserTier).toBe(USER_TIERS.PUBLIC);
            expect(CONTENT_ACCESS.BASIC_LESSONS.requiredContentTier).toBe(CONTENT_TIERS.FREE);
        });

        it('should define access requirements for premium content', () => {
            expect(CONTENT_ACCESS.AP_CONTENT.requiredUserTier).toBe(USER_TIERS.STUDENT);
            expect(CONTENT_ACCESS.AP_CONTENT.requiredContentTier).toBe(CONTENT_TIERS.PREMIUM);
        });

        it('should define access requirements for enterprise content', () => {
            expect(CONTENT_ACCESS.DISTRICT_MANAGEMENT.requiredUserTier).toBe(USER_TIERS.SUPERINTENDENT);
            expect(CONTENT_ACCESS.DISTRICT_MANAGEMENT.requiredContentTier).toBe(CONTENT_TIERS.ENTERPRISE);
        });

        it('should require teacher tier for classroom management', () => {
            expect(CONTENT_ACCESS.CLASSROOM_MANAGEMENT.requiredUserTier).toBe(USER_TIERS.TEACHER);
        });
    });
});

// ============================================================================
// TIER CHECK FUNCTIONS TESTS
// ============================================================================

describe('Tier System - Tier Check Functions', () => {

    describe('getUserTierLevel()', () => {
        it('should return tier level for string role', () => {
            expect(getUserTierLevel('guest')).toBe(1);
            expect(getUserTierLevel('student')).toBe(2);
            expect(getUserTierLevel('teacher')).toBe(3);
            expect(getUserTierLevel('principal')).toBe(4);
            expect(getUserTierLevel('superintendent')).toBe(5);
            expect(getUserTierLevel('system_admin')).toBe(6);
            expect(getUserTierLevel('super_admin')).toBe(7);
        });

        it('should return tier level for numeric input', () => {
            expect(getUserTierLevel(0)).toBe(0);
            expect(getUserTierLevel(3)).toBe(3);
            expect(getUserTierLevel(7)).toBe(7);
        });

        it('should handle case-insensitive role strings', () => {
            expect(getUserTierLevel('GUEST')).toBe(1);
            expect(getUserTierLevel('Teacher')).toBe(3);
        });

        it('should return PUBLIC (0) for unknown roles', () => {
            expect(getUserTierLevel('unknown')).toBe(0);
            expect(getUserTierLevel(null)).toBe(0);
            expect(getUserTierLevel(undefined)).toBe(0);
        });
    });

    describe('getTierName()', () => {
        it('should return name for valid tier levels', () => {
            expect(getTierName(0)).toBe('Public');
            expect(getTierName(1)).toBe('Guest');
            expect(getTierName(2)).toBe('Student');
            expect(getTierName(3)).toBe('Teacher');
            expect(getTierName(7)).toBe('Super Admin');
        });

        it('should return Unknown for invalid tier levels', () => {
            expect(getTierName(99)).toBe('Unknown');
            expect(getTierName(-1)).toBe('Unknown');
        });
    });

    describe('hasMinimumTier()', () => {
        it('should return true when user tier >= required tier', () => {
            expect(hasMinimumTier('teacher', 'student')).toBe(true);
            expect(hasMinimumTier('teacher', 'teacher')).toBe(true);
            expect(hasMinimumTier('super_admin', 'guest')).toBe(true);
        });

        it('should return false when user tier < required tier', () => {
            expect(hasMinimumTier('guest', 'student')).toBe(false);
            expect(hasMinimumTier('student', 'teacher')).toBe(false);
            expect(hasMinimumTier('teacher', 'principal')).toBe(false);
        });

        it('should work with numeric tier levels', () => {
            expect(hasMinimumTier(3, 2)).toBe(true);
            expect(hasMinimumTier(2, 3)).toBe(false);
            expect(hasMinimumTier(5, 5)).toBe(true);
        });

        it('should work with mixed string and numeric inputs', () => {
            expect(hasMinimumTier('teacher', 2)).toBe(true);
            expect(hasMinimumTier(3, 'student')).toBe(true);
        });
    });
});

// ============================================================================
// PERMISSION TESTS
// ============================================================================

describe('Tier System - Permissions', () => {

    describe('PERMISSIONS constant', () => {
        it('should allow public users to view public content', () => {
            expect(PERMISSIONS.VIEW_PUBLIC_CONTENT).toContain(USER_TIERS.PUBLIC);
        });

        it('should restrict interactive features to students and above', () => {
            expect(PERMISSIONS.USE_VISUALIZERS).not.toContain(USER_TIERS.PUBLIC);
            expect(PERMISSIONS.USE_VISUALIZERS).not.toContain(USER_TIERS.GUEST);
            expect(PERMISSIONS.USE_VISUALIZERS).toContain(USER_TIERS.STUDENT);
        });

        it('should restrict classroom management to teachers and above', () => {
            expect(PERMISSIONS.MANAGE_CLASSROOM).not.toContain(USER_TIERS.STUDENT);
            expect(PERMISSIONS.MANAGE_CLASSROOM).toContain(USER_TIERS.TEACHER);
            expect(PERMISSIONS.MANAGE_CLASSROOM).toContain(USER_TIERS.PRINCIPAL);
        });

        it('should restrict school analytics to principals and above', () => {
            expect(PERMISSIONS.VIEW_SCHOOL_ANALYTICS).not.toContain(USER_TIERS.TEACHER);
            expect(PERMISSIONS.VIEW_SCHOOL_ANALYTICS).toContain(USER_TIERS.PRINCIPAL);
        });

        it('should restrict super admin actions to super admin only', () => {
            expect(PERMISSIONS.SUPER_ADMIN_ACCESS).toEqual([USER_TIERS.SUPER_ADMIN]);
            expect(PERMISSIONS.DELETE_ANYTHING).toEqual([USER_TIERS.SUPER_ADMIN]);
        });
    });

    describe('hasPermission()', () => {
        it('should allow students to take quizzes', () => {
            expect(hasPermission('student', 'TAKE_QUIZZES')).toBe(true);
        });

        it('should NOT allow guests to take quizzes', () => {
            expect(hasPermission('guest', 'TAKE_QUIZZES')).toBe(false);
        });

        it('should allow teachers to manage classrooms', () => {
            expect(hasPermission('teacher', 'MANAGE_CLASSROOM')).toBe(true);
        });

        it('should NOT allow students to manage classrooms', () => {
            expect(hasPermission('student', 'MANAGE_CLASSROOM')).toBe(false);
        });

        it('should allow principals to manage teachers', () => {
            expect(hasPermission('principal', 'MANAGE_TEACHERS')).toBe(true);
        });

        it('should NOT allow teachers to manage teachers', () => {
            expect(hasPermission('teacher', 'MANAGE_TEACHERS')).toBe(false);
        });

        it('should return false for unknown permissions', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            expect(hasPermission('teacher', 'UNKNOWN_PERMISSION')).toBe(false);
            consoleSpy.mockRestore();
        });

        it('should work with numeric tier levels', () => {
            expect(hasPermission(USER_TIERS.STUDENT, 'TAKE_QUIZZES')).toBe(true);
            expect(hasPermission(USER_TIERS.GUEST, 'TAKE_QUIZZES')).toBe(false);
        });
    });
});

// ============================================================================
// CONTENT ACCESS TESTS
// ============================================================================

describe('Tier System - Content Access', () => {

    describe('canAccessContent()', () => {
        it('should allow public users to access basic lessons', () => {
            expect(canAccessContent('public', 'free', 'BASIC_LESSONS')).toBe(true);
        });

        it('should allow students with free tier to access basic quizzes', () => {
            expect(canAccessContent('student', 'free', 'BASIC_QUIZZES')).toBe(true);
        });

        it('should NOT allow guests to access quizzes (tier requirement)', () => {
            expect(canAccessContent('guest', 'free', 'BASIC_QUIZZES')).toBe(false);
        });

        it('should NOT allow students with free tier to access AP content', () => {
            expect(canAccessContent('student', 'free', 'AP_CONTENT')).toBe(false);
        });

        it('should allow students with premium tier to access AP content', () => {
            expect(canAccessContent('student', 'premium', 'AP_CONTENT')).toBe(true);
        });

        it('should NOT allow teachers to access district management', () => {
            expect(canAccessContent('teacher', 'enterprise', 'DISTRICT_MANAGEMENT')).toBe(false);
        });

        it('should allow superintendents with enterprise to access district management', () => {
            expect(canAccessContent('superintendent', 'enterprise', 'DISTRICT_MANAGEMENT')).toBe(true);
        });

        it('should return false for unknown content types', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            expect(canAccessContent('student', 'premium', 'UNKNOWN_CONTENT')).toBe(false);
            consoleSpy.mockRestore();
        });

        it('should handle enterprise tier granting all content access', () => {
            expect(canAccessContent('student', 'enterprise', 'BASIC_LESSONS')).toBe(true);
            expect(canAccessContent('student', 'enterprise', 'AP_CONTENT')).toBe(true);
            expect(canAccessContent('student', 'enterprise', 'ADVANCED_GAMES')).toBe(true);
        });
    });
});

// ============================================================================
// UPGRADE OPTIONS TESTS
// ============================================================================

describe('Tier System - Upgrade Options', () => {

    describe('getUpgradeOptions()', () => {
        it('should offer Premium upgrade for free tier users', () => {
            const options = getUpgradeOptions('student', 'free');
            const premiumOption = options.find(o => o.to === CONTENT_TIERS.PREMIUM);
            expect(premiumOption).toBeDefined();
            expect(premiumOption.from).toBe(CONTENT_TIERS.FREE);
        });

        it('should offer Enterprise upgrade for free tier users', () => {
            const options = getUpgradeOptions('student', 'free');
            const enterpriseOption = options.find(o => o.to === CONTENT_TIERS.ENTERPRISE);
            expect(enterpriseOption).toBeDefined();
        });

        it('should offer Enterprise upgrade for premium tier users', () => {
            const options = getUpgradeOptions('student', 'premium');
            const enterpriseOption = options.find(o => o.to === CONTENT_TIERS.ENTERPRISE);
            expect(enterpriseOption).toBeDefined();
            expect(options.find(o => o.to === CONTENT_TIERS.PREMIUM)).toBeUndefined();
        });

        it('should not offer upgrades for enterprise tier users', () => {
            const options = getUpgradeOptions('student', 'enterprise');
            expect(options.find(o => o.to === CONTENT_TIERS.ENTERPRISE)).toBeUndefined();
        });

        it('should include pricing information in upgrade options', () => {
            const options = getUpgradeOptions('student', 'free');
            const premiumOption = options.find(o => o.to === CONTENT_TIERS.PREMIUM);
            expect(premiumOption.price).toBeDefined();
            expect(premiumOption.price.monthly).toBe(9.99);
        });
    });
});

// ============================================================================
// HIERARCHY TESTS
// ============================================================================

describe('Tier System - Permission Hierarchy', () => {

    it('should maintain proper user tier hierarchy', () => {
        // Each tier should have all permissions of lower tiers
        const allPermissions = Object.keys(PERMISSIONS);

        for (let tier = 1; tier <= 7; tier++) {
            const currentTierPerms = allPermissions.filter(perm =>
                hasPermission(tier, perm)
            );

            const lowerTierPerms = allPermissions.filter(perm =>
                hasPermission(tier - 1, perm)
            );

            // Current tier should have at least as many permissions as lower tier
            expect(currentTierPerms.length).toBeGreaterThanOrEqual(lowerTierPerms.length);

            // All lower tier permissions should be included in current tier
            lowerTierPerms.forEach(perm => {
                expect(currentTierPerms).toContain(perm);
            });
        }
    });

    it('should ensure cumulative content access up the hierarchy', () => {
        const contentTypes = Object.keys(CONTENT_ACCESS);
        const tiers = ['student', 'teacher', 'principal', 'superintendent', 'system_admin', 'super_admin'];

        tiers.forEach((tier, index) => {
            if (index === 0) return;

            const previousTier = tiers[index - 1];

            contentTypes.forEach(contentType => {
                // If previous tier can access with enterprise, current should too
                if (canAccessContent(previousTier, 'enterprise', contentType)) {
                    expect(canAccessContent(tier, 'enterprise', contentType)).toBe(true);
                }
            });
        });
    });
});

// ============================================================================
// SECURITY TESTS
// ============================================================================

describe('Tier System - Security Tests', () => {

    it('should never allow guests to save progress', () => {
        expect(hasPermission('guest', 'SAVE_PROGRESS')).toBe(false);
    });

    it('should never allow students to approve teachers', () => {
        expect(hasPermission('student', 'APPROVE_TEACHERS')).toBe(false);
    });

    it('should never allow teachers to manage schools', () => {
        expect(hasPermission('teacher', 'MANAGE_SCHOOLS')).toBe(false);
    });

    it('should never allow principals to delete anything', () => {
        expect(hasPermission('principal', 'DELETE_ANYTHING')).toBe(false);
    });

    it('should restrict system configuration to system admins', () => {
        expect(hasPermission('superintendent', 'SYSTEM_CONFIGURATION')).toBe(false);
        expect(hasPermission('system_admin', 'SYSTEM_CONFIGURATION')).toBe(true);
    });

    it('should prevent privilege escalation through content access', () => {
        // Users cannot access admin features through content tier alone
        expect(canAccessContent('student', 'enterprise', 'SYSTEM_CONFIGURATION')).toBe(false);
        expect(canAccessContent('teacher', 'enterprise', 'SUPER_ADMIN_TOOLS')).toBe(false);
    });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Tier System - Edge Cases', () => {

    it('should handle null/undefined inputs gracefully', () => {
        expect(getUserTierLevel(null)).toBe(0);
        expect(getUserTierLevel(undefined)).toBe(0);
        expect(hasMinimumTier(null, 'guest')).toBe(false);
    });

    it('should handle empty string inputs', () => {
        expect(getUserTierLevel('')).toBe(0);
    });

    it('should handle whitespace in role strings', () => {
        // Whitespace should result in unknown role
        expect(getUserTierLevel(' guest ')).toBe(0);
    });

    it('should handle very high tier numbers', () => {
        expect(getTierName(100)).toBe('Unknown');
        expect(hasMinimumTier(100, 7)).toBe(true);
    });

    it('should handle negative tier numbers', () => {
        expect(getTierName(-1)).toBe('Unknown');
        expect(hasMinimumTier(-1, 0)).toBe(false);
    });
});
