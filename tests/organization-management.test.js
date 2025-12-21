/**
 * Unit tests for organization-management.js
 * Tests organizational hierarchy, classroom management, and approval workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ORG_TYPES,
    ORG_HIERARCHY,
    ORGANIZATION_SCHEMA,
    CLASSROOM_SCHEMA,
    MEMBERSHIP_SCHEMA
} from '../auth/organization-management.js';

// ============================================================================
// ORGANIZATION TYPE DEFINITIONS TESTS
// ============================================================================

describe('Organization Management - Type Definitions', () => {

    describe('ORG_TYPES constant', () => {
        it('should define all organization types', () => {
            expect(ORG_TYPES.STATE).toBe('state');
            expect(ORG_TYPES.COUNTY).toBe('county');
            expect(ORG_TYPES.DISTRICT).toBe('district');
            expect(ORG_TYPES.CITY).toBe('city');
            expect(ORG_TYPES.SCHOOL).toBe('school');
            expect(ORG_TYPES.CLASSROOM).toBe('classroom');
        });

        it('should have exactly 6 organization types', () => {
            expect(Object.keys(ORG_TYPES).length).toBe(6);
        });
    });

    describe('ORG_HIERARCHY constant', () => {
        it('should define proper hierarchy order', () => {
            expect(ORG_HIERARCHY[0]).toBe('state');
            expect(ORG_HIERARCHY[1]).toBe('county');
            expect(ORG_HIERARCHY[2]).toBe('district');
            expect(ORG_HIERARCHY[3]).toBe('city');
            expect(ORG_HIERARCHY[4]).toBe('school');
            expect(ORG_HIERARCHY[5]).toBe('classroom');
        });

        it('should have state at the top of hierarchy', () => {
            expect(ORG_HIERARCHY[0]).toBe(ORG_TYPES.STATE);
        });

        it('should have classroom at the bottom of hierarchy', () => {
            expect(ORG_HIERARCHY[ORG_HIERARCHY.length - 1]).toBe(ORG_TYPES.CLASSROOM);
        });

        it('should include optional levels (county, city)', () => {
            expect(ORG_HIERARCHY).toContain(ORG_TYPES.COUNTY);
            expect(ORG_HIERARCHY).toContain(ORG_TYPES.CITY);
        });
    });
});

// ============================================================================
// ORGANIZATION SCHEMA TESTS
// ============================================================================

describe('Organization Management - Organization Schema', () => {

    describe('ORGANIZATION_SCHEMA structure', () => {
        it('should have required identification fields', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('id');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('type');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('name');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('code');
        });

        it('should have hierarchy tracking fields', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('parentId');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('parentPath');
            expect(Array.isArray(ORGANIZATION_SCHEMA.parentPath)).toBe(true);
        });

        it('should have contact information fields', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('address');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('phone');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('email');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('website');
        });

        it('should have address sub-fields', () => {
            expect(ORGANIZATION_SCHEMA.address).toHaveProperty('street');
            expect(ORGANIZATION_SCHEMA.address).toHaveProperty('city');
            expect(ORGANIZATION_SCHEMA.address).toHaveProperty('state');
            expect(ORGANIZATION_SCHEMA.address).toHaveProperty('zipCode');
            expect(ORGANIZATION_SCHEMA.address).toHaveProperty('country');
        });

        it('should have administrative fields', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('adminIds');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('primaryContactId');
            expect(Array.isArray(ORGANIZATION_SCHEMA.adminIds)).toBe(true);
        });

        it('should have subscription fields', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('subscriptionId');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('subscriptionTier');
        });

        it('should have settings object', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('settings');
            expect(ORGANIZATION_SCHEMA.settings).toHaveProperty('allowTeacherRegistration');
            expect(ORGANIZATION_SCHEMA.settings).toHaveProperty('requireApproval');
            expect(ORGANIZATION_SCHEMA.settings).toHaveProperty('autoApproveStudents');
            expect(ORGANIZATION_SCHEMA.settings).toHaveProperty('enableLmsIntegration');
        });

        it('should have statistics tracking', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('stats');
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalUsers');
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalStudents');
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalTeachers');
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalClassrooms');
        });

        it('should have timestamp fields', () => {
            expect(ORGANIZATION_SCHEMA).toHaveProperty('createdAt');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('updatedAt');
            expect(ORGANIZATION_SCHEMA).toHaveProperty('createdBy');
        });
    });

    describe('Default settings values', () => {
        it('should allow teacher registration by default', () => {
            expect(ORGANIZATION_SCHEMA.settings.allowTeacherRegistration).toBe(true);
        });

        it('should require approval by default', () => {
            expect(ORGANIZATION_SCHEMA.settings.requireApproval).toBe(true);
        });

        it('should NOT auto-approve students by default', () => {
            expect(ORGANIZATION_SCHEMA.settings.autoApproveStudents).toBe(false);
        });

        it('should have LMS integration disabled by default', () => {
            expect(ORGANIZATION_SCHEMA.settings.enableLmsIntegration).toBe(false);
        });
    });
});

// ============================================================================
// CLASSROOM SCHEMA TESTS
// ============================================================================

describe('Organization Management - Classroom Schema', () => {

    describe('CLASSROOM_SCHEMA structure', () => {
        it('should have required identification fields', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('id');
            expect(CLASSROOM_SCHEMA).toHaveProperty('name');
            expect(CLASSROOM_SCHEMA).toHaveProperty('code');
            expect(CLASSROOM_SCHEMA).toHaveProperty('description');
        });

        it('should have organization hierarchy fields', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('schoolId');
            expect(CLASSROOM_SCHEMA).toHaveProperty('districtId');
        });

        it('should have teacher assignment fields', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('teacherId');
            expect(CLASSROOM_SCHEMA).toHaveProperty('coTeacherIds');
            expect(CLASSROOM_SCHEMA).toHaveProperty('taIds');
            expect(Array.isArray(CLASSROOM_SCHEMA.coTeacherIds)).toBe(true);
            expect(Array.isArray(CLASSROOM_SCHEMA.taIds)).toBe(true);
        });

        it('should have student management fields', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('studentIds');
            expect(CLASSROOM_SCHEMA).toHaveProperty('maxStudents');
            expect(Array.isArray(CLASSROOM_SCHEMA.studentIds)).toBe(true);
        });

        it('should have course information', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('courseInfo');
            expect(CLASSROOM_SCHEMA.courseInfo).toHaveProperty('subject');
            expect(CLASSROOM_SCHEMA.courseInfo).toHaveProperty('gradeLevel');
            expect(CLASSROOM_SCHEMA.courseInfo).toHaveProperty('courseCode');
            expect(CLASSROOM_SCHEMA.courseInfo).toHaveProperty('section');
            expect(CLASSROOM_SCHEMA.courseInfo).toHaveProperty('term');
        });

        it('should have content settings', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('enabledModules');
            expect(CLASSROOM_SCHEMA).toHaveProperty('customPathway');
            expect(CLASSROOM_SCHEMA).toHaveProperty('assignmentIds');
        });

        it('should have LMS integration settings', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('lmsIntegration');
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('provider');
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('courseId');
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('syncEnabled');
        });

        it('should have status fields', () => {
            expect(CLASSROOM_SCHEMA).toHaveProperty('isActive');
            expect(CLASSROOM_SCHEMA).toHaveProperty('isArchived');
        });
    });

    describe('Default classroom values', () => {
        it('should have 30 max students by default', () => {
            expect(CLASSROOM_SCHEMA.maxStudents).toBe(30);
        });

        it('should be active by default', () => {
            expect(CLASSROOM_SCHEMA.isActive).toBe(true);
        });

        it('should NOT be archived by default', () => {
            expect(CLASSROOM_SCHEMA.isArchived).toBe(false);
        });

        it('should have Computer Science as default subject', () => {
            expect(CLASSROOM_SCHEMA.courseInfo.subject).toBe('Computer Science');
        });

        it('should have 9-12 as default grade level', () => {
            expect(CLASSROOM_SCHEMA.courseInfo.gradeLevel).toBe('9-12');
        });
    });
});

// ============================================================================
// MEMBERSHIP SCHEMA TESTS
// ============================================================================

describe('Organization Management - Membership Schema', () => {

    describe('MEMBERSHIP_SCHEMA structure', () => {
        it('should have organization reference fields', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('organizationId');
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('organizationType');
        });

        it('should have role and status fields', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('role');
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('status');
        });

        it('should have classroom tracking for students', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('classroomIds');
            expect(Array.isArray(MEMBERSHIP_SCHEMA.classroomIds)).toBe(true);
        });

        it('should have approval tracking fields', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('approvedBy');
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('approvedAt');
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('requestedAt');
        });

        it('should have cross-school teaching support', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('isPrimaryOrg');
        });

        it('should have activity tracking', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('joinedAt');
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('lastActiveAt');
        });
    });

    describe('Default membership values', () => {
        it('should have pending status by default', () => {
            expect(MEMBERSHIP_SCHEMA.status).toBe('pending');
        });

        it('should be primary org by default', () => {
            expect(MEMBERSHIP_SCHEMA.isPrimaryOrg).toBe(true);
        });
    });
});

// ============================================================================
// HIERARCHY LOGIC TESTS
// ============================================================================

describe('Organization Management - Hierarchy Logic', () => {

    describe('Parent-child relationships', () => {
        it('should have state as top-level (no parent)', () => {
            const stateIndex = ORG_HIERARCHY.indexOf(ORG_TYPES.STATE);
            expect(stateIndex).toBe(0);
        });

        it('should have proper hierarchy ordering', () => {
            const stateIndex = ORG_HIERARCHY.indexOf(ORG_TYPES.STATE);
            const districtIndex = ORG_HIERARCHY.indexOf(ORG_TYPES.DISTRICT);
            const schoolIndex = ORG_HIERARCHY.indexOf(ORG_TYPES.SCHOOL);
            const classroomIndex = ORG_HIERARCHY.indexOf(ORG_TYPES.CLASSROOM);

            expect(stateIndex).toBeLessThan(districtIndex);
            expect(districtIndex).toBeLessThan(schoolIndex);
            expect(schoolIndex).toBeLessThan(classroomIndex);
        });
    });

    describe('Optional hierarchy levels', () => {
        it('should allow county to be skipped', () => {
            // County is optional - districts can be directly under states
            expect(ORG_HIERARCHY.includes(ORG_TYPES.COUNTY)).toBe(true);
        });

        it('should allow city to be skipped', () => {
            // City is optional - schools can be directly under districts
            expect(ORG_HIERARCHY.includes(ORG_TYPES.CITY)).toBe(true);
        });
    });
});

// ============================================================================
// APPROVAL WORKFLOW TESTS
// ============================================================================

describe('Organization Management - Approval Workflows', () => {

    describe('Membership status values', () => {
        it('should support pending status', () => {
            expect(MEMBERSHIP_SCHEMA.status).toBe('pending');
        });

        it('should define valid status transitions', () => {
            const validStatuses = ['pending', 'active', 'suspended', 'inactive'];
            // Schema shows pending as default, implying these are valid values
            expect(validStatuses).toContain(MEMBERSHIP_SCHEMA.status);
        });
    });

    describe('Approval tracking', () => {
        it('should track who approved membership', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('approvedBy');
        });

        it('should track when membership was approved', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('approvedAt');
        });

        it('should track when approval was requested', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('requestedAt');
        });
    });
});

// ============================================================================
// CROSS-SCHOOL TEACHING TESTS
// ============================================================================

describe('Organization Management - Cross-School Teaching', () => {

    describe('Primary organization support', () => {
        it('should track if organization is primary', () => {
            expect(MEMBERSHIP_SCHEMA).toHaveProperty('isPrimaryOrg');
        });

        it('should default to primary organization', () => {
            expect(MEMBERSHIP_SCHEMA.isPrimaryOrg).toBe(true);
        });
    });

    describe('Multiple classroom support', () => {
        it('should allow multiple classroom memberships', () => {
            expect(Array.isArray(MEMBERSHIP_SCHEMA.classroomIds)).toBe(true);
        });
    });
});

// ============================================================================
// LMS INTEGRATION TESTS
// ============================================================================

describe('Organization Management - LMS Integration', () => {

    describe('Organization LMS settings', () => {
        it('should have LMS integration toggle', () => {
            expect(ORGANIZATION_SCHEMA.settings).toHaveProperty('enableLmsIntegration');
        });

        it('should default to disabled', () => {
            expect(ORGANIZATION_SCHEMA.settings.enableLmsIntegration).toBe(false);
        });
    });

    describe('Classroom LMS integration', () => {
        it('should support LMS provider configuration', () => {
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('provider');
        });

        it('should support course ID linking', () => {
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('courseId');
        });

        it('should support sync toggle', () => {
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('syncEnabled');
        });

        it('should track last sync time', () => {
            expect(CLASSROOM_SCHEMA.lmsIntegration).toHaveProperty('lastSync');
        });
    });
});

// ============================================================================
// STATISTICS TRACKING TESTS
// ============================================================================

describe('Organization Management - Statistics', () => {

    describe('Organization statistics', () => {
        it('should track total users', () => {
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalUsers');
            expect(ORGANIZATION_SCHEMA.stats.totalUsers).toBe(0);
        });

        it('should track total students', () => {
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalStudents');
            expect(ORGANIZATION_SCHEMA.stats.totalStudents).toBe(0);
        });

        it('should track total teachers', () => {
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalTeachers');
            expect(ORGANIZATION_SCHEMA.stats.totalTeachers).toBe(0);
        });

        it('should track total classrooms', () => {
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('totalClassrooms');
            expect(ORGANIZATION_SCHEMA.stats.totalClassrooms).toBe(0);
        });

        it('should track active users in last 30 days', () => {
            expect(ORGANIZATION_SCHEMA.stats).toHaveProperty('activeUsers30Days');
            expect(ORGANIZATION_SCHEMA.stats.activeUsers30Days).toBe(0);
        });
    });
});

// ============================================================================
// EDGE CASES AND VALIDATION TESTS
// ============================================================================

describe('Organization Management - Edge Cases', () => {

    describe('Empty arrays initialization', () => {
        it('should initialize adminIds as empty array', () => {
            expect(ORGANIZATION_SCHEMA.adminIds).toEqual([]);
        });

        it('should initialize parentPath as empty array', () => {
            expect(ORGANIZATION_SCHEMA.parentPath).toEqual([]);
        });

        it('should initialize studentIds as empty array', () => {
            expect(CLASSROOM_SCHEMA.studentIds).toEqual([]);
        });

        it('should initialize coTeacherIds as empty array', () => {
            expect(CLASSROOM_SCHEMA.coTeacherIds).toEqual([]);
        });
    });

    describe('Null field defaults', () => {
        it('should have null parentId for top-level orgs', () => {
            expect(ORGANIZATION_SCHEMA.parentId).toBeNull();
        });

        it('should have null subscriptionId by default', () => {
            expect(ORGANIZATION_SCHEMA.subscriptionId).toBeNull();
        });

        it('should have null timestamps by default', () => {
            expect(ORGANIZATION_SCHEMA.createdAt).toBeNull();
            expect(ORGANIZATION_SCHEMA.updatedAt).toBeNull();
        });
    });
});
