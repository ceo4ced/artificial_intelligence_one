// Tiered Content System and Enhanced User Management
// Comprehensive permission and content access control

import { auth, db } from './firebase-config.js';
import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ============================================================================
// USER TIER DEFINITIONS (Levels 0-7)
// ============================================================================

export const USER_TIERS = {
    PUBLIC: 0,              // Content preview only, no account
    GUEST: 1,               // Basic interactives, no assessments
    STUDENT: 2,             // Standard curriculum access
    TEACHER: 3,             // Classroom management
    PRINCIPAL: 4,           // School oversight
    SUPERINTENDENT: 5,      // District management
    SYSTEM_ADMIN: 6,        // System administration
    SUPER_ADMIN: 7          // Full system control
};

export const USER_TIER_NAMES = {
    [USER_TIERS.PUBLIC]: 'Public',
    [USER_TIERS.GUEST]: 'Guest',
    [USER_TIERS.STUDENT]: 'Student',
    [USER_TIERS.TEACHER]: 'Teacher',
    [USER_TIERS.PRINCIPAL]: 'Principal/Admin',
    [USER_TIERS.SUPERINTENDENT]: 'Superintendent/Board',
    [USER_TIERS.SYSTEM_ADMIN]: 'System Administrator',
    [USER_TIERS.SUPER_ADMIN]: 'Super Admin'
};

// Map legacy role names to tier levels
export const ROLE_TO_TIER = {
    'public': USER_TIERS.PUBLIC,
    'guest': USER_TIERS.GUEST,
    'student': USER_TIERS.STUDENT,
    'teacher': USER_TIERS.TEACHER,
    'principal': USER_TIERS.PRINCIPAL,
    'admin': USER_TIERS.PRINCIPAL,
    'superintendent': USER_TIERS.SUPERINTENDENT,
    'board': USER_TIERS.SUPERINTENDENT,
    'system_admin': USER_TIERS.SYSTEM_ADMIN,
    'super_admin': USER_TIERS.SUPER_ADMIN
};

// ============================================================================
// CONTENT TIER DEFINITIONS
// ============================================================================

export const CONTENT_TIERS = {
    FREE: 'free',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise'
};

export const CONTENT_TIER_FEATURES = {
    [CONTENT_TIERS.FREE]: {
        name: 'Free',
        description: 'Basic curriculum access',
        features: [
            'Basic curriculum content',
            'Simple interactives',
            'Basic quizzes (limited)',
            'Community forum access',
            'Email support'
        ],
        limits: {
            quizzesPerMonth: 10,
            gamesAccess: 'basic',
            visualizersAccess: 'basic',
            exportFormats: ['csv'],
            maxStudentsPerClass: 30,
            advancedAnalytics: false,
            apLevelContent: false,
            customPathways: false
        },
        price: {
            monthly: 0,
            annual: 0
        }
    },
    [CONTENT_TIERS.PREMIUM]: {
        name: 'Premium',
        description: 'Full curriculum with advanced features',
        features: [
            'All free features',
            'Enriched content with deeper case studies',
            'Advanced interactive lessons and simulations',
            'Complex games and activities',
            'AP Computer Science level assessments',
            'Advanced project templates and rubrics',
            'Priority support',
            'Progress tracking and reports',
            'Unlimited quizzes'
        ],
        limits: {
            quizzesPerMonth: -1, // unlimited
            gamesAccess: 'full',
            visualizersAccess: 'full',
            exportFormats: ['csv', 'pdf', 'json'],
            maxStudentsPerClass: 100,
            advancedAnalytics: true,
            apLevelContent: true,
            customPathways: false
        },
        price: {
            monthly: 9.99,
            annual: 99.99 // ~17% discount
        }
    },
    [CONTENT_TIERS.ENTERPRISE]: {
        name: 'Enterprise',
        description: 'District/School licenses with full control',
        features: [
            'All premium features',
            'Custom curriculum pathways',
            'Advanced analytics and reporting',
            'Multi-school management',
            'Professional development resources',
            'Canvas/Google Classroom LMS integration',
            'PlayLab.ai advanced integration',
            'Dedicated account manager',
            'Custom branding options',
            'SLA support guarantee',
            'Bulk user provisioning',
            'SSO integration (SAML/OAuth)'
        ],
        limits: {
            quizzesPerMonth: -1,
            gamesAccess: 'full',
            visualizersAccess: 'full',
            exportFormats: ['csv', 'pdf', 'json', 'xml', 'lti'],
            maxStudentsPerClass: -1,
            advancedAnalytics: true,
            apLevelContent: true,
            customPathways: true
        },
        price: {
            monthly: null, // Contact sales
            annual: null,
            perStudentAnnual: 5.99,
            siteWide: 2999.99
        }
    }
};

// ============================================================================
// CONTENT ACCESS LEVELS
// ============================================================================

export const CONTENT_ACCESS = {
    // Content categories and their required tiers
    BASIC_LESSONS: {
        requiredUserTier: USER_TIERS.PUBLIC,
        requiredContentTier: CONTENT_TIERS.FREE
    },
    BASIC_QUIZZES: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.FREE
    },
    BASIC_GAMES: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.FREE
    },
    BASIC_VISUALIZERS: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.FREE
    },
    ADVANCED_QUIZZES: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.PREMIUM
    },
    ADVANCED_GAMES: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.PREMIUM
    },
    ADVANCED_VISUALIZERS: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.PREMIUM
    },
    AP_CONTENT: {
        requiredUserTier: USER_TIERS.STUDENT,
        requiredContentTier: CONTENT_TIERS.PREMIUM
    },
    CLASSROOM_MANAGEMENT: {
        requiredUserTier: USER_TIERS.TEACHER,
        requiredContentTier: CONTENT_TIERS.FREE
    },
    SCHOOL_ANALYTICS: {
        requiredUserTier: USER_TIERS.PRINCIPAL,
        requiredContentTier: CONTENT_TIERS.ENTERPRISE
    },
    DISTRICT_MANAGEMENT: {
        requiredUserTier: USER_TIERS.SUPERINTENDENT,
        requiredContentTier: CONTENT_TIERS.ENTERPRISE
    },
    SYSTEM_CONFIGURATION: {
        requiredUserTier: USER_TIERS.SYSTEM_ADMIN,
        requiredContentTier: CONTENT_TIERS.ENTERPRISE
    },
    SUPER_ADMIN_TOOLS: {
        requiredUserTier: USER_TIERS.SUPER_ADMIN,
        requiredContentTier: CONTENT_TIERS.ENTERPRISE
    }
};

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export const PERMISSIONS = {
    // Content viewing
    VIEW_PUBLIC_CONTENT: [USER_TIERS.PUBLIC, USER_TIERS.GUEST, USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_LESSONS: [USER_TIERS.GUEST, USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_PREMIUM_CONTENT: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // Interactive features
    USE_VISUALIZERS: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    PLAY_GAMES: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    TAKE_QUIZZES: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    TAKE_AP_ASSESSMENTS: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // Data permissions
    SAVE_PROGRESS: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_OWN_SCORES: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_OWN_ANALYTICS: [USER_TIERS.STUDENT, USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // Teacher permissions (Level 3)
    MANAGE_CLASSROOM: [USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_STUDENT_SCORES: [USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    APPROVE_STUDENTS: [USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    ASSIGN_CONTENT: [USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    EXPORT_CLASS_DATA: [USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    CREATE_ASSIGNMENTS: [USER_TIERS.TEACHER, USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // Principal permissions (Level 4)
    VIEW_SCHOOL_ANALYTICS: [USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_TEACHERS: [USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    APPROVE_TEACHERS: [USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    SCHOOL_CONFIGURATION: [USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_SCHOOL_REPORTS: [USER_TIERS.PRINCIPAL, USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // Superintendent permissions (Level 5)
    VIEW_DISTRICT_ANALYTICS: [USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_SCHOOLS: [USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_PRINCIPALS: [USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    DISTRICT_CONFIGURATION: [USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_SUBSCRIPTIONS: [USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    CUSTOM_CURRICULUM: [USER_TIERS.SUPERINTENDENT, USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // System Admin permissions (Level 6)
    SYSTEM_CONFIGURATION: [USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_ALL_ANALYTICS: [USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_ALL_USERS: [USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_CONTENT: [USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    VIEW_SYSTEM_LOGS: [USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],
    MANAGE_PAYMENTS: [USER_TIERS.SYSTEM_ADMIN, USER_TIERS.SUPER_ADMIN],

    // Super Admin permissions (Level 7)
    SUPER_ADMIN_ACCESS: [USER_TIERS.SUPER_ADMIN],
    DELETE_ANYTHING: [USER_TIERS.SUPER_ADMIN],
    IMPERSONATE_USER: [USER_TIERS.SUPER_ADMIN],
    MANAGE_SYSTEM_ADMINS: [USER_TIERS.SUPER_ADMIN],
    BILLING_MANAGEMENT: [USER_TIERS.SUPER_ADMIN],
    API_MANAGEMENT: [USER_TIERS.SUPER_ADMIN]
};

// ============================================================================
// TIER CHECK FUNCTIONS
// ============================================================================

/**
 * Get user's tier level from their role
 */
export function getUserTierLevel(role) {
    if (typeof role === 'number') return role;
    return ROLE_TO_TIER[role?.toLowerCase()] ?? USER_TIERS.PUBLIC;
}

/**
 * Get user's tier name from level
 */
export function getTierName(tierLevel) {
    return USER_TIER_NAMES[tierLevel] || 'Unknown';
}

/**
 * Check if user has minimum tier level
 */
export function hasMinimumTier(userTier, requiredTier) {
    const userLevel = getUserTierLevel(userTier);
    const requiredLevel = typeof requiredTier === 'number' ? requiredTier : getUserTierLevel(requiredTier);
    return userLevel >= requiredLevel;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userTier, permission) {
    const userLevel = getUserTierLevel(userTier);
    const allowedTiers = PERMISSIONS[permission];

    if (!allowedTiers) {
        console.error(`Unknown permission: ${permission}`);
        return false;
    }

    return allowedTiers.includes(userLevel);
}

/**
 * Check if user can access specific content type
 */
export function canAccessContent(userTier, contentTier, contentType) {
    const userLevel = getUserTierLevel(userTier);
    const accessConfig = CONTENT_ACCESS[contentType];

    if (!accessConfig) {
        console.warn(`Unknown content type: ${contentType}`);
        return false;
    }

    // Check user tier requirement
    if (userLevel < accessConfig.requiredUserTier) {
        return false;
    }

    // Check content tier requirement
    const contentTierOrder = {
        [CONTENT_TIERS.FREE]: 0,
        [CONTENT_TIERS.PREMIUM]: 1,
        [CONTENT_TIERS.ENTERPRISE]: 2
    };

    const userContentLevel = contentTierOrder[contentTier] ?? 0;
    const requiredContentLevel = contentTierOrder[accessConfig.requiredContentTier] ?? 0;

    return userContentLevel >= requiredContentLevel;
}

// ============================================================================
// SUBSCRIPTION STATUS FUNCTIONS
// ============================================================================

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId) {
    try {
        const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));

        if (!subscriptionDoc.exists()) {
            return {
                tier: CONTENT_TIERS.FREE,
                status: 'active',
                isActive: true,
                expiresAt: null
            };
        }

        const subscription = subscriptionDoc.data();
        const now = Timestamp.now();

        // Check if subscription is expired
        const isActive = subscription.status === 'active' &&
            (!subscription.expiresAt || subscription.expiresAt > now);

        return {
            ...subscription,
            isActive
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return {
            tier: CONTENT_TIERS.FREE,
            status: 'active',
            isActive: true,
            expiresAt: null
        };
    }
}

/**
 * Check if user has premium access
 */
export async function hasPremiumAccess(userId) {
    const subscription = await getUserSubscription(userId);
    return subscription.isActive &&
        (subscription.tier === CONTENT_TIERS.PREMIUM || subscription.tier === CONTENT_TIERS.ENTERPRISE);
}

/**
 * Check if user has enterprise access
 */
export async function hasEnterpriseAccess(userId) {
    const subscription = await getUserSubscription(userId);
    return subscription.isActive && subscription.tier === CONTENT_TIERS.ENTERPRISE;
}

/**
 * Get organization's subscription (for enterprise)
 */
export async function getOrganizationSubscription(organizationId) {
    try {
        const subQuery = query(
            collection(db, 'subscriptions'),
            where('organizationId', '==', organizationId),
            where('type', '==', 'enterprise')
        );

        const snapshot = await getDocs(subQuery);

        if (snapshot.empty) {
            return null;
        }

        const subscription = snapshot.docs[0].data();
        const now = Timestamp.now();

        return {
            ...subscription,
            isActive: subscription.status === 'active' &&
                (!subscription.expiresAt || subscription.expiresAt > now)
        };
    } catch (error) {
        console.error('Error fetching organization subscription:', error);
        return null;
    }
}

// ============================================================================
// CONTENT FILTERING BASED ON TIER
// ============================================================================

/**
 * Filter content list based on user's access level
 */
export async function filterContentByAccess(contentList, userId, userTier) {
    const subscription = await getUserSubscription(userId);

    return contentList.filter(content => {
        return canAccessContent(userTier, subscription.tier, content.accessType || 'BASIC_LESSONS');
    });
}

/**
 * Get content access status for display
 */
export async function getContentAccessStatus(contentType, userId, userTier) {
    const subscription = await getUserSubscription(userId);
    const canAccess = canAccessContent(userTier, subscription.tier, contentType);
    const accessConfig = CONTENT_ACCESS[contentType];

    if (canAccess) {
        return {
            canAccess: true,
            status: 'available',
            message: null
        };
    }

    // Determine why access is denied
    const userLevel = getUserTierLevel(userTier);

    if (userLevel < accessConfig.requiredUserTier) {
        return {
            canAccess: false,
            status: 'tier_required',
            requiredTier: getTierName(accessConfig.requiredUserTier),
            message: `This content requires ${getTierName(accessConfig.requiredUserTier)} access or higher.`
        };
    }

    return {
        canAccess: false,
        status: 'subscription_required',
        requiredSubscription: accessConfig.requiredContentTier,
        message: `This content requires a ${accessConfig.requiredContentTier} subscription.`
    };
}

// ============================================================================
// USAGE TRACKING FOR TIER LIMITS
// ============================================================================

/**
 * Check and increment usage for limited features
 */
export async function checkUsageLimit(userId, featureType) {
    const subscription = await getUserSubscription(userId);
    const limits = CONTENT_TIER_FEATURES[subscription.tier]?.limits;

    if (!limits) {
        return { allowed: false, message: 'Invalid subscription' };
    }

    const limit = limits[featureType];

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, remaining: -1 };
    }

    // Get current month's usage
    const usageDoc = await getDoc(doc(db, 'usage', userId));
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    let currentUsage = 0;
    if (usageDoc.exists()) {
        const usageData = usageDoc.data();
        currentUsage = usageData[currentMonth]?.[featureType] || 0;
    }

    if (currentUsage >= limit) {
        return {
            allowed: false,
            remaining: 0,
            limit,
            message: `Monthly limit of ${limit} ${featureType} reached. Upgrade for unlimited access.`
        };
    }

    return {
        allowed: true,
        remaining: limit - currentUsage - 1,
        limit
    };
}

// ============================================================================
// TIER UPGRADE PATHS
// ============================================================================

/**
 * Get available upgrade options for user
 */
export function getUpgradeOptions(currentUserTier, currentContentTier) {
    const userLevel = getUserTierLevel(currentUserTier);
    const options = [];

    // Content tier upgrades
    if (currentContentTier === CONTENT_TIERS.FREE) {
        options.push({
            type: 'content',
            from: CONTENT_TIERS.FREE,
            to: CONTENT_TIERS.PREMIUM,
            ...CONTENT_TIER_FEATURES[CONTENT_TIERS.PREMIUM]
        });
    }

    if (currentContentTier !== CONTENT_TIERS.ENTERPRISE) {
        options.push({
            type: 'content',
            from: currentContentTier,
            to: CONTENT_TIERS.ENTERPRISE,
            ...CONTENT_TIER_FEATURES[CONTENT_TIERS.ENTERPRISE]
        });
    }

    return options;
}

export default {
    USER_TIERS,
    USER_TIER_NAMES,
    CONTENT_TIERS,
    CONTENT_TIER_FEATURES,
    CONTENT_ACCESS,
    PERMISSIONS,
    getUserTierLevel,
    getTierName,
    hasMinimumTier,
    hasPermission,
    canAccessContent,
    getUserSubscription,
    hasPremiumAccess,
    hasEnterpriseAccess,
    getOrganizationSubscription,
    filterContentByAccess,
    getContentAccessStatus,
    checkUsageLimit,
    getUpgradeOptions
};
