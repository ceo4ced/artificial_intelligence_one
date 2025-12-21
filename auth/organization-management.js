// Organization Management System
// Handles hierarchical structure: State → County → District → City → School → Teacher → Classroom → Student

import { auth, db } from './firebase-config.js';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    Timestamp,
    arrayUnion,
    arrayRemove,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { USER_TIERS, hasMinimumTier, hasPermission } from './tier-system.js';

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export const ORG_TYPES = {
    STATE: 'state',
    COUNTY: 'county',
    DISTRICT: 'district',
    CITY: 'city',
    SCHOOL: 'school',
    CLASSROOM: 'classroom'
};

export const ORG_HIERARCHY = [
    ORG_TYPES.STATE,
    ORG_TYPES.COUNTY,     // Optional
    ORG_TYPES.DISTRICT,
    ORG_TYPES.CITY,       // Optional
    ORG_TYPES.SCHOOL,
    ORG_TYPES.CLASSROOM
];

// ============================================================================
// ORGANIZATION SCHEMA DEFINITIONS
// ============================================================================

/**
 * Organization document structure
 * Collection: /organizations/{orgId}
 */
export const ORGANIZATION_SCHEMA = {
    id: '',                     // Auto-generated unique ID
    type: '',                   // ORG_TYPES value
    name: '',                   // Display name
    code: '',                   // Short code (e.g., "CA" for California)
    parentId: null,             // Parent organization ID (null for states)
    parentPath: [],             // Array of ancestor IDs for efficient queries

    // Contact information
    address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
    },
    phone: '',
    email: '',
    website: '',

    // Administrative
    adminIds: [],               // User IDs with admin access
    primaryContactId: null,     // Primary contact user ID

    // Subscription (for districts/schools)
    subscriptionId: null,       // Link to subscription document
    subscriptionTier: 'free',   // 'free', 'premium', 'enterprise'

    // Settings
    settings: {
        allowTeacherRegistration: true,     // Teachers can self-register
        requireApproval: true,              // Require approval for new users
        autoApproveStudents: false,         // Auto-approve students joining classes
        enableLmsIntegration: false,        // Canvas/Google Classroom integration
        customBranding: null,               // Custom branding settings
        timezone: 'America/Los_Angeles'
    },

    // Statistics
    stats: {
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalClassrooms: 0,
        activeUsers30Days: 0
    },

    // Timestamps
    createdAt: null,
    updatedAt: null,
    createdBy: null
};

/**
 * Classroom document structure
 * Collection: /classrooms/{classroomId}
 */
export const CLASSROOM_SCHEMA = {
    id: '',
    name: '',                   // e.g., "AP Computer Science - Period 3"
    code: '',                   // Join code for students
    description: '',

    // Organization hierarchy
    schoolId: '',
    districtId: '',

    // Teachers
    teacherId: '',              // Primary teacher
    coTeacherIds: [],           // Co-teachers
    taIds: [],                  // Teaching assistants

    // Students
    studentIds: [],
    maxStudents: 30,            // Based on subscription tier

    // Course settings
    courseInfo: {
        subject: 'Computer Science',
        gradeLevel: '9-12',
        courseCode: '',
        section: '',
        term: '',               // e.g., "Fall 2024"
        year: ''
    },

    // Content settings
    enabledModules: [],         // Which curriculum modules are enabled
    customPathway: null,        // Custom curriculum pathway ID
    assignmentIds: [],          // Linked assignments

    // LMS Integration
    lmsIntegration: {
        provider: null,         // 'canvas', 'google_classroom', 'schoology'
        courseId: null,
        syncEnabled: false,
        lastSync: null
    },

    // Status
    isActive: true,
    isArchived: false,

    // Timestamps
    createdAt: null,
    updatedAt: null,
    startDate: null,
    endDate: null
};

/**
 * User Organization Membership
 * Collection: /users/{userId}/memberships/{membershipId}
 */
export const MEMBERSHIP_SCHEMA = {
    organizationId: '',
    organizationType: '',
    role: '',                   // Role within this organization
    status: 'pending',          // 'pending', 'active', 'suspended', 'inactive'

    // For classrooms
    classroomIds: [],           // Which classrooms user belongs to

    // Approval tracking
    approvedBy: null,
    approvedAt: null,
    requestedAt: null,

    // Cross-school teaching
    isPrimaryOrg: true,         // Is this user's primary organization?

    // Timestamps
    joinedAt: null,
    lastActiveAt: null
};

// ============================================================================
// ORGANIZATION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new organization
 */
export async function createOrganization(orgData, creatorUserId) {
    try {
        // Verify creator has permission
        const userDoc = await getDoc(doc(db, 'users', creatorUserId));
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userRole = userDoc.data().role;
        const requiredTier = getRequiredTierForOrgType(orgData.type);

        if (!hasMinimumTier(userRole, requiredTier)) {
            throw new Error(`Insufficient permissions to create ${orgData.type}`);
        }

        // Generate unique ID
        const orgId = generateOrgId(orgData.type, orgData.name);

        // Build parent path
        let parentPath = [];
        if (orgData.parentId) {
            const parentDoc = await getDoc(doc(db, 'organizations', orgData.parentId));
            if (parentDoc.exists()) {
                parentPath = [...(parentDoc.data().parentPath || []), orgData.parentId];
            }
        }

        const organization = {
            ...ORGANIZATION_SCHEMA,
            ...orgData,
            id: orgId,
            parentPath,
            adminIds: [creatorUserId],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            createdBy: creatorUserId
        };

        await setDoc(doc(db, 'organizations', orgId), organization);

        // Add creator as admin member
        await addUserToOrganization(creatorUserId, orgId, orgData.type, 'admin');

        return { success: true, organizationId: orgId, organization };
    } catch (error) {
        console.error('Error creating organization:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get organization by ID
 */
export async function getOrganization(orgId) {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));

        if (!orgDoc.exists()) {
            return { success: false, error: 'Organization not found' };
        }

        return { success: true, organization: orgDoc.data() };
    } catch (error) {
        console.error('Error fetching organization:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update organization
 */
export async function updateOrganization(orgId, updates, userId) {
    try {
        // Verify user has admin access
        const hasAccess = await userHasOrgAccess(userId, orgId, 'admin');
        if (!hasAccess) {
            throw new Error('Insufficient permissions');
        }

        // Remove protected fields
        delete updates.id;
        delete updates.createdAt;
        delete updates.createdBy;
        delete updates.parentPath;

        await updateDoc(doc(db, 'organizations', orgId), {
            ...updates,
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating organization:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get child organizations
 */
export async function getChildOrganizations(parentId, childType = null) {
    try {
        let orgQuery = query(
            collection(db, 'organizations'),
            where('parentId', '==', parentId)
        );

        if (childType) {
            orgQuery = query(orgQuery, where('type', '==', childType));
        }

        const snapshot = await getDocs(orgQuery);
        const organizations = snapshot.docs.map(doc => doc.data());

        return { success: true, organizations };
    } catch (error) {
        console.error('Error fetching child organizations:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all organizations in hierarchy path
 */
export async function getOrganizationHierarchy(orgId) {
    try {
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));

        if (!orgDoc.exists()) {
            return { success: false, error: 'Organization not found' };
        }

        const org = orgDoc.data();
        const hierarchy = [org];

        // Fetch all ancestors
        for (const ancestorId of (org.parentPath || [])) {
            const ancestorDoc = await getDoc(doc(db, 'organizations', ancestorId));
            if (ancestorDoc.exists()) {
                hierarchy.unshift(ancestorDoc.data());
            }
        }

        return { success: true, hierarchy };
    } catch (error) {
        console.error('Error fetching organization hierarchy:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// CLASSROOM OPERATIONS
// ============================================================================

/**
 * Create a new classroom
 */
export async function createClassroom(classroomData, teacherId) {
    try {
        // Verify teacher permissions
        const userDoc = await getDoc(doc(db, 'users', teacherId));
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userRole = userDoc.data().role;
        if (!hasMinimumTier(userRole, USER_TIERS.TEACHER)) {
            throw new Error('Must be a teacher to create classrooms');
        }

        // Verify school membership
        const hasSchoolAccess = await userHasOrgAccess(teacherId, classroomData.schoolId, 'teacher');
        if (!hasSchoolAccess) {
            throw new Error('Not a teacher at this school');
        }

        // Generate classroom ID and join code
        const classroomId = generateClassroomId(classroomData.schoolId);
        const joinCode = generateJoinCode();

        // Get school's district
        const schoolDoc = await getDoc(doc(db, 'organizations', classroomData.schoolId));
        const districtId = schoolDoc.exists() ? schoolDoc.data().parentPath?.find(id => id.includes('district')) : null;

        const classroom = {
            ...CLASSROOM_SCHEMA,
            ...classroomData,
            id: classroomId,
            code: joinCode,
            districtId,
            teacherId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await setDoc(doc(db, 'classrooms', classroomId), classroom);

        // Update school stats
        await updateOrgStats(classroomData.schoolId);

        return { success: true, classroomId, joinCode, classroom };
    } catch (error) {
        console.error('Error creating classroom:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get classroom by ID
 */
export async function getClassroom(classroomId) {
    try {
        const classDoc = await getDoc(doc(db, 'classrooms', classroomId));

        if (!classDoc.exists()) {
            return { success: false, error: 'Classroom not found' };
        }

        return { success: true, classroom: classDoc.data() };
    } catch (error) {
        console.error('Error fetching classroom:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get classroom by join code
 */
export async function getClassroomByCode(joinCode) {
    try {
        const classQuery = query(
            collection(db, 'classrooms'),
            where('code', '==', joinCode.toUpperCase()),
            where('isActive', '==', true)
        );

        const snapshot = await getDocs(classQuery);

        if (snapshot.empty) {
            return { success: false, error: 'Invalid join code' };
        }

        return { success: true, classroom: snapshot.docs[0].data() };
    } catch (error) {
        console.error('Error fetching classroom by code:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Join classroom as student
 */
export async function joinClassroom(joinCode, studentId) {
    try {
        // Get classroom
        const result = await getClassroomByCode(joinCode);
        if (!result.success) {
            return result;
        }

        const classroom = result.classroom;

        // Check if student is already in classroom
        if (classroom.studentIds.includes(studentId)) {
            return { success: false, error: 'Already enrolled in this classroom' };
        }

        // Check max students
        if (classroom.studentIds.length >= classroom.maxStudents) {
            return { success: false, error: 'Classroom is full' };
        }

        // Get school settings
        const schoolDoc = await getDoc(doc(db, 'organizations', classroom.schoolId));
        const schoolSettings = schoolDoc.exists() ? schoolDoc.data().settings : {};

        // Determine if auto-approve or needs approval
        const status = schoolSettings.autoApproveStudents ? 'active' : 'pending';

        if (status === 'active') {
            // Add student to classroom
            await updateDoc(doc(db, 'classrooms', classroom.id), {
                studentIds: arrayUnion(studentId),
                updatedAt: Timestamp.now()
            });
        }

        // Create membership record
        await addUserToOrganization(studentId, classroom.schoolId, 'school', 'student', {
            classroomIds: [classroom.id],
            status
        });

        // Create classroom enrollment record
        await setDoc(doc(db, 'users', studentId, 'enrollments', classroom.id), {
            classroomId: classroom.id,
            schoolId: classroom.schoolId,
            status,
            joinCode,
            requestedAt: Timestamp.now(),
            joinedAt: status === 'active' ? Timestamp.now() : null
        });

        return {
            success: true,
            status,
            message: status === 'pending'
                ? 'Join request submitted. Waiting for teacher approval.'
                : 'Successfully joined classroom!'
        };
    } catch (error) {
        console.error('Error joining classroom:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get classrooms for a teacher
 */
export async function getTeacherClassrooms(teacherId) {
    try {
        // Get classrooms where user is primary teacher
        const primaryQuery = query(
            collection(db, 'classrooms'),
            where('teacherId', '==', teacherId),
            where('isActive', '==', true)
        );

        // Get classrooms where user is co-teacher
        const coTeacherQuery = query(
            collection(db, 'classrooms'),
            where('coTeacherIds', 'array-contains', teacherId),
            where('isActive', '==', true)
        );

        const [primarySnapshot, coTeacherSnapshot] = await Promise.all([
            getDocs(primaryQuery),
            getDocs(coTeacherQuery)
        ]);

        const classrooms = new Map();

        primarySnapshot.docs.forEach(doc => {
            classrooms.set(doc.id, { ...doc.data(), isPrimary: true });
        });

        coTeacherSnapshot.docs.forEach(doc => {
            if (!classrooms.has(doc.id)) {
                classrooms.set(doc.id, { ...doc.data(), isPrimary: false });
            }
        });

        return { success: true, classrooms: Array.from(classrooms.values()) };
    } catch (error) {
        console.error('Error fetching teacher classrooms:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get classrooms for a student
 */
export async function getStudentClassrooms(studentId) {
    try {
        const enrollmentsRef = collection(db, 'users', studentId, 'enrollments');
        const snapshot = await getDocs(enrollmentsRef);

        const classrooms = [];

        for (const enrollDoc of snapshot.docs) {
            const enrollment = enrollDoc.data();
            if (enrollment.status === 'active') {
                const classDoc = await getDoc(doc(db, 'classrooms', enrollment.classroomId));
                if (classDoc.exists()) {
                    classrooms.push({
                        ...classDoc.data(),
                        enrollment
                    });
                }
            }
        }

        return { success: true, classrooms };
    } catch (error) {
        console.error('Error fetching student classrooms:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// USER ORGANIZATION MEMBERSHIP
// ============================================================================

/**
 * Add user to organization
 */
export async function addUserToOrganization(userId, orgId, orgType, role, additionalData = {}) {
    try {
        const membershipId = `${orgId}_${role}`;

        const membership = {
            ...MEMBERSHIP_SCHEMA,
            organizationId: orgId,
            organizationType: orgType,
            role,
            status: additionalData.status || 'pending',
            requestedAt: Timestamp.now(),
            ...additionalData
        };

        await setDoc(doc(db, 'users', userId, 'memberships', membershipId), membership);

        return { success: true, membershipId };
    } catch (error) {
        console.error('Error adding user to organization:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if user has access to organization
 */
export async function userHasOrgAccess(userId, orgId, requiredRole = 'member') {
    try {
        const membershipsRef = collection(db, 'users', userId, 'memberships');
        const snapshot = await getDocs(membershipsRef);

        for (const memberDoc of snapshot.docs) {
            const membership = memberDoc.data();

            // Direct membership
            if (membership.organizationId === orgId && membership.status === 'active') {
                return roleHasAccess(membership.role, requiredRole);
            }
        }

        // Check if user has access through parent organization
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (orgDoc.exists()) {
            const org = orgDoc.data();
            for (const ancestorId of (org.parentPath || [])) {
                for (const memberDoc of snapshot.docs) {
                    const membership = memberDoc.data();
                    if (membership.organizationId === ancestorId && membership.status === 'active') {
                        // Higher-level access grants access to child orgs
                        return roleHasAccess(membership.role, requiredRole);
                    }
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking org access:', error);
        return false;
    }
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId) {
    try {
        const membershipsRef = collection(db, 'users', userId, 'memberships');
        const snapshot = await getDocs(membershipsRef);

        const organizations = [];

        for (const memberDoc of snapshot.docs) {
            const membership = memberDoc.data();
            if (membership.status === 'active') {
                const orgDoc = await getDoc(doc(db, 'organizations', membership.organizationId));
                if (orgDoc.exists()) {
                    organizations.push({
                        ...orgDoc.data(),
                        membership
                    });
                }
            }
        }

        return { success: true, organizations };
    } catch (error) {
        console.error('Error fetching user organizations:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TEACHER APPROVAL WORKFLOW
// ============================================================================

/**
 * Request teacher registration at a school
 */
export async function requestTeacherRegistration(userId, schoolId, verificationData) {
    try {
        // Get user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        // Create teacher registration request
        const requestId = `teacher_${userId}_${schoolId}`;

        const request = {
            id: requestId,
            type: 'teacher_registration',
            userId,
            schoolId,
            status: 'pending',

            // Verification data
            verificationData: {
                employeeId: verificationData.employeeId || null,
                schoolEmail: verificationData.schoolEmail || null,
                department: verificationData.department || null,
                subjects: verificationData.subjects || [],
                verificationDocument: verificationData.verificationDocument || null
            },

            // User info snapshot
            userInfo: {
                displayName: userDoc.data().displayName,
                email: userDoc.data().email
            },

            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),

            // Approval tracking
            reviewedBy: null,
            reviewedAt: null,
            reviewNotes: null
        };

        await setDoc(doc(db, 'approvalRequests', requestId), request);

        // Create pending membership
        await addUserToOrganization(userId, schoolId, 'school', 'teacher', {
            status: 'pending',
            approvalRequestId: requestId
        });

        return { success: true, requestId };
    } catch (error) {
        console.error('Error requesting teacher registration:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get pending approval requests for an organization
 */
export async function getPendingApprovals(orgId, userId) {
    try {
        // Verify user has approval permissions
        const hasAccess = await userHasOrgAccess(userId, orgId, 'admin');
        if (!hasAccess) {
            throw new Error('Insufficient permissions');
        }

        const requestsQuery = query(
            collection(db, 'approvalRequests'),
            where('schoolId', '==', orgId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(requestsQuery);
        const requests = snapshot.docs.map(doc => doc.data());

        return { success: true, requests };
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Approve or reject a registration request
 */
export async function processApprovalRequest(requestId, approverId, approved, notes = '') {
    try {
        // Get the request
        const requestDoc = await getDoc(doc(db, 'approvalRequests', requestId));
        if (!requestDoc.exists()) {
            throw new Error('Request not found');
        }

        const request = requestDoc.data();

        // Verify approver has permission
        const hasAccess = await userHasOrgAccess(approverId, request.schoolId, 'admin');
        if (!hasAccess) {
            throw new Error('Insufficient permissions to approve');
        }

        const batch = writeBatch(db);

        // Update request status
        batch.update(doc(db, 'approvalRequests', requestId), {
            status: approved ? 'approved' : 'rejected',
            reviewedBy: approverId,
            reviewedAt: Timestamp.now(),
            reviewNotes: notes,
            updatedAt: Timestamp.now()
        });

        if (approved) {
            // Update user role to teacher
            batch.update(doc(db, 'users', request.userId), {
                role: 'teacher',
                updatedAt: Timestamp.now()
            });

            // Update membership status
            const membershipId = `${request.schoolId}_teacher`;
            batch.update(doc(db, 'users', request.userId, 'memberships', membershipId), {
                status: 'active',
                approvedBy: approverId,
                approvedAt: Timestamp.now()
            });

            // Update organization stats
            const orgDoc = await getDoc(doc(db, 'organizations', request.schoolId));
            if (orgDoc.exists()) {
                const currentStats = orgDoc.data().stats || {};
                batch.update(doc(db, 'organizations', request.schoolId), {
                    'stats.totalTeachers': (currentStats.totalTeachers || 0) + 1,
                    'stats.totalUsers': (currentStats.totalUsers || 0) + 1,
                    updatedAt: Timestamp.now()
                });
            }
        }

        await batch.commit();

        return { success: true, approved };
    } catch (error) {
        console.error('Error processing approval:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Approve student joining classroom
 */
export async function approveStudentEnrollment(classroomId, studentId, teacherId, approved) {
    try {
        // Verify teacher owns classroom
        const classDoc = await getDoc(doc(db, 'classrooms', classroomId));
        if (!classDoc.exists()) {
            throw new Error('Classroom not found');
        }

        const classroom = classDoc.data();
        const isTeacher = classroom.teacherId === teacherId ||
                          classroom.coTeacherIds.includes(teacherId);

        if (!isTeacher) {
            throw new Error('Not authorized for this classroom');
        }

        const batch = writeBatch(db);

        if (approved) {
            // Add student to classroom
            batch.update(doc(db, 'classrooms', classroomId), {
                studentIds: arrayUnion(studentId),
                updatedAt: Timestamp.now()
            });

            // Update enrollment status
            batch.update(doc(db, 'users', studentId, 'enrollments', classroomId), {
                status: 'active',
                approvedBy: teacherId,
                joinedAt: Timestamp.now()
            });

            // Update user role to student if they were guest
            const userDoc = await getDoc(doc(db, 'users', studentId));
            if (userDoc.exists() && userDoc.data().role === 'guest') {
                batch.update(doc(db, 'users', studentId), {
                    role: 'student',
                    updatedAt: Timestamp.now()
                });
            }
        } else {
            // Reject enrollment
            batch.update(doc(db, 'users', studentId, 'enrollments', classroomId), {
                status: 'rejected',
                reviewedBy: teacherId,
                reviewedAt: Timestamp.now()
            });
        }

        await batch.commit();

        return { success: true, approved };
    } catch (error) {
        console.error('Error processing student enrollment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get pending student enrollments for teacher's classrooms
 */
export async function getPendingStudentEnrollments(teacherId) {
    try {
        // Get teacher's classrooms
        const classroomsResult = await getTeacherClassrooms(teacherId);
        if (!classroomsResult.success) {
            return classroomsResult;
        }

        const pendingEnrollments = [];

        for (const classroom of classroomsResult.classrooms) {
            // Get pending enrollments for this classroom
            const enrollmentsQuery = query(
                collection(db, 'users'),
                // This requires a collection group query in practice
            );

            // For now, use classroom data to find pending students
            // In production, use a collection group query or denormalized data
        }

        return { success: true, enrollments: pendingEnrollments };
    } catch (error) {
        console.error('Error fetching pending enrollments:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// CROSS-SCHOOL TEACHING SUPPORT
// ============================================================================

/**
 * Add teacher to additional school (cross-school teaching)
 */
export async function addTeacherToSchool(teacherId, schoolId, requesterId) {
    try {
        // Verify requester has permission (must be principal or higher at target school)
        const hasAccess = await userHasOrgAccess(requesterId, schoolId, 'admin');
        if (!hasAccess) {
            throw new Error('Insufficient permissions');
        }

        // Verify user is already a teacher somewhere
        const userDoc = await getDoc(doc(db, 'users', teacherId));
        if (!userDoc.exists() || userDoc.data().role !== 'teacher') {
            throw new Error('User must already be a verified teacher');
        }

        // Add as secondary school membership
        await addUserToOrganization(teacherId, schoolId, 'school', 'teacher', {
            status: 'active',
            isPrimaryOrg: false,
            approvedBy: requesterId,
            approvedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error adding teacher to school:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateOrgId(type, name) {
    const sanitizedName = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 30);
    const timestamp = Date.now().toString(36);
    return `${type}_${sanitizedName}_${timestamp}`;
}

function generateClassroomId(schoolId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `class_${schoolId.slice(0, 10)}_${timestamp}${random}`;
}

function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function getRequiredTierForOrgType(orgType) {
    const requirements = {
        [ORG_TYPES.STATE]: USER_TIERS.SUPER_ADMIN,
        [ORG_TYPES.COUNTY]: USER_TIERS.SUPERINTENDENT,
        [ORG_TYPES.DISTRICT]: USER_TIERS.SUPERINTENDENT,
        [ORG_TYPES.CITY]: USER_TIERS.SUPERINTENDENT,
        [ORG_TYPES.SCHOOL]: USER_TIERS.PRINCIPAL,
        [ORG_TYPES.CLASSROOM]: USER_TIERS.TEACHER
    };
    return requirements[orgType] || USER_TIERS.SUPER_ADMIN;
}

function roleHasAccess(userRole, requiredRole) {
    const roleHierarchy = {
        'super_admin': 7,
        'admin': 6,
        'principal': 5,
        'teacher': 4,
        'ta': 3,
        'student': 2,
        'member': 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
}

async function updateOrgStats(orgId) {
    try {
        // Get organization
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (!orgDoc.exists()) return;

        // Count classrooms
        const classroomsQuery = query(
            collection(db, 'classrooms'),
            where('schoolId', '==', orgId),
            where('isActive', '==', true)
        );
        const classroomsSnapshot = await getDocs(classroomsQuery);

        // Update stats
        await updateDoc(doc(db, 'organizations', orgId), {
            'stats.totalClassrooms': classroomsSnapshot.size,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating org stats:', error);
    }
}

export default {
    ORG_TYPES,
    ORG_HIERARCHY,
    createOrganization,
    getOrganization,
    updateOrganization,
    getChildOrganizations,
    getOrganizationHierarchy,
    createClassroom,
    getClassroom,
    getClassroomByCode,
    joinClassroom,
    getTeacherClassrooms,
    getStudentClassrooms,
    addUserToOrganization,
    userHasOrgAccess,
    getUserOrganizations,
    requestTeacherRegistration,
    getPendingApprovals,
    processApprovalRequest,
    approveStudentEnrollment,
    getPendingStudentEnrollments,
    addTeacherToSchool
};
