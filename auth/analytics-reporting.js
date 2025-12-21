// Analytics and Reporting System
// Tracks engagement, conversion, and learning progress

import { auth, db } from './firebase-config.js';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    increment,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { analytics } from './firebase-config.js';
import { USER_TIERS, CONTENT_TIERS } from './tier-system.js';

// ============================================================================
// ANALYTICS EVENT TYPES
// ============================================================================

export const ANALYTICS_EVENTS = {
    // User lifecycle
    USER_REGISTERED: 'user_registered',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_UPGRADED: 'user_upgraded',
    USER_DOWNGRADED: 'user_downgraded',
    USER_CHURNED: 'user_churned',

    // Content engagement
    LESSON_STARTED: 'lesson_started',
    LESSON_COMPLETED: 'lesson_completed',
    QUIZ_STARTED: 'quiz_started',
    QUIZ_COMPLETED: 'quiz_completed',
    GAME_STARTED: 'game_started',
    GAME_COMPLETED: 'game_completed',
    VISUALIZER_USED: 'visualizer_used',

    // Premium content
    PREMIUM_CONTENT_VIEWED: 'premium_content_viewed',
    PREMIUM_CONTENT_BLOCKED: 'premium_content_blocked',
    UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
    UPGRADE_PROMPT_CLICKED: 'upgrade_prompt_clicked',

    // Subscription
    TRIAL_STARTED: 'trial_started',
    TRIAL_CONVERTED: 'trial_converted',
    TRIAL_EXPIRED: 'trial_expired',
    SUBSCRIPTION_CREATED: 'subscription_created',
    SUBSCRIPTION_RENEWED: 'subscription_renewed',
    SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',

    // Organization
    ORG_CREATED: 'org_created',
    CLASSROOM_CREATED: 'classroom_created',
    STUDENT_ENROLLED: 'student_enrolled',
    TEACHER_APPROVED: 'teacher_approved',

    // Assessment
    ASSESSMENT_STARTED: 'assessment_started',
    ASSESSMENT_COMPLETED: 'assessment_completed',
    CERTIFICATE_EARNED: 'certificate_earned'
};

// ============================================================================
// METRICS DEFINITIONS
// ============================================================================

export const METRIC_TYPES = {
    // Engagement metrics
    DAILY_ACTIVE_USERS: 'dau',
    WEEKLY_ACTIVE_USERS: 'wau',
    MONTHLY_ACTIVE_USERS: 'mau',
    AVERAGE_SESSION_DURATION: 'avg_session_duration',
    PAGES_PER_SESSION: 'pages_per_session',
    BOUNCE_RATE: 'bounce_rate',

    // Learning metrics
    LESSON_COMPLETION_RATE: 'lesson_completion_rate',
    QUIZ_AVERAGE_SCORE: 'quiz_avg_score',
    QUIZ_PASS_RATE: 'quiz_pass_rate',
    LEARNING_PATH_PROGRESS: 'learning_path_progress',
    TIME_TO_COMPLETION: 'time_to_completion',

    // Conversion metrics
    REGISTRATION_RATE: 'registration_rate',
    TRIAL_CONVERSION_RATE: 'trial_conversion_rate',
    FREE_TO_PAID_RATE: 'free_to_paid_rate',
    UPGRADE_RATE: 'upgrade_rate',
    CHURN_RATE: 'churn_rate',

    // Revenue metrics
    MONTHLY_RECURRING_REVENUE: 'mrr',
    ANNUAL_RECURRING_REVENUE: 'arr',
    AVERAGE_REVENUE_PER_USER: 'arpu',
    CUSTOMER_LIFETIME_VALUE: 'clv'
};

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track an analytics event
 */
export async function trackEvent(eventType, eventData = {}, userId = null) {
    try {
        const user = auth.currentUser;
        const uid = userId || user?.uid || 'anonymous';
        const timestamp = Timestamp.now();

        // Create event document
        const eventId = `${eventType}_${timestamp.toMillis()}_${Math.random().toString(36).slice(2, 8)}`;

        const event = {
            id: eventId,
            type: eventType,
            userId: uid,
            data: eventData,
            timestamp,
            sessionId: getSessionId(),
            userAgent: navigator?.userAgent || null,
            referrer: document?.referrer || null,
            url: window?.location?.href || null
        };

        // Store in Firestore
        await setDoc(doc(db, 'analytics', 'events', 'raw', eventId), event);

        // Log to Firebase Analytics
        logEvent(analytics, eventType, {
            user_id: uid,
            ...eventData
        });

        // Update real-time counters
        await updateRealtimeCounters(eventType, eventData);

        return { success: true, eventId };
    } catch (error) {
        console.error('Error tracking event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Track page view
 */
export async function trackPageView(pageName, pageData = {}) {
    return trackEvent('page_view', {
        page_name: pageName,
        page_path: window?.location?.pathname,
        ...pageData
    });
}

/**
 * Track lesson engagement
 */
export async function trackLessonEngagement(lessonId, action, data = {}) {
    const eventType = action === 'start' ? ANALYTICS_EVENTS.LESSON_STARTED :
                      action === 'complete' ? ANALYTICS_EVENTS.LESSON_COMPLETED :
                      'lesson_interaction';

    return trackEvent(eventType, {
        lesson_id: lessonId,
        action,
        ...data
    });
}

/**
 * Track quiz completion
 */
export async function trackQuizCompletion(quizId, score, totalQuestions, timeSpent) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70; // 70% passing threshold

    return trackEvent(ANALYTICS_EVENTS.QUIZ_COMPLETED, {
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        percentage,
        passed,
        time_spent: timeSpent
    });
}

/**
 * Track game interaction
 */
export async function trackGameInteraction(gameId, action, score = null, data = {}) {
    const eventType = action === 'start' ? ANALYTICS_EVENTS.GAME_STARTED :
                      action === 'complete' ? ANALYTICS_EVENTS.GAME_COMPLETED :
                      'game_interaction';

    return trackEvent(eventType, {
        game_id: gameId,
        action,
        score,
        ...data
    });
}

/**
 * Track conversion event
 */
export async function trackConversion(conversionType, data = {}) {
    return trackEvent(conversionType, {
        conversion_type: conversionType,
        ...data
    });
}

/**
 * Track upgrade prompt interaction
 */
export async function trackUpgradePrompt(action, contentType, contentId) {
    const eventType = action === 'shown' ? ANALYTICS_EVENTS.UPGRADE_PROMPT_SHOWN :
                      ANALYTICS_EVENTS.UPGRADE_PROMPT_CLICKED;

    return trackEvent(eventType, {
        action,
        content_type: contentType,
        content_id: contentId,
        current_tier: await getCurrentUserTier()
    });
}

// ============================================================================
// REAL-TIME COUNTERS
// ============================================================================

/**
 * Update real-time metric counters
 */
async function updateRealtimeCounters(eventType, eventData) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const month = today.slice(0, 7);

        const batch = writeBatch(db);

        // Daily counter
        const dailyRef = doc(db, 'analytics', 'counters', 'daily', today);
        batch.set(dailyRef, {
            [eventType]: increment(1),
            total_events: increment(1),
            last_updated: Timestamp.now()
        }, { merge: true });

        // Monthly counter
        const monthlyRef = doc(db, 'analytics', 'counters', 'monthly', month);
        batch.set(monthlyRef, {
            [eventType]: increment(1),
            total_events: increment(1),
            last_updated: Timestamp.now()
        }, { merge: true });

        // Event-specific counters
        if (eventType === ANALYTICS_EVENTS.USER_REGISTERED) {
            batch.set(dailyRef, { new_users: increment(1) }, { merge: true });
        } else if (eventType === ANALYTICS_EVENTS.SUBSCRIPTION_CREATED) {
            batch.set(dailyRef, { new_subscriptions: increment(1) }, { merge: true });
            if (eventData.tier === CONTENT_TIERS.PREMIUM) {
                batch.set(dailyRef, { premium_conversions: increment(1) }, { merge: true });
            }
        } else if (eventType === ANALYTICS_EVENTS.QUIZ_COMPLETED) {
            batch.set(dailyRef, {
                quizzes_completed: increment(1),
                quiz_scores_sum: increment(eventData.percentage || 0)
            }, { merge: true });
        }

        await batch.commit();
    } catch (error) {
        console.error('Error updating counters:', error);
    }
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

/**
 * Get dashboard metrics for a date range
 */
export async function getDashboardMetrics(startDate, endDate, organizationId = null) {
    try {
        const metrics = {
            engagement: {},
            learning: {},
            conversion: {},
            revenue: {}
        };

        // Get daily counters for date range
        const countersRef = collection(db, 'analytics', 'counters', 'daily');
        const countersQuery = query(
            countersRef,
            where('__name__', '>=', startDate),
            where('__name__', '<=', endDate)
        );

        const snapshot = await getDocs(countersQuery);

        let totalUsers = 0;
        let totalQuizzes = 0;
        let totalScoreSum = 0;
        let totalEvents = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalUsers += data.new_users || 0;
            totalQuizzes += data.quizzes_completed || 0;
            totalScoreSum += data.quiz_scores_sum || 0;
            totalEvents += data.total_events || 0;
        });

        metrics.engagement = {
            totalEvents,
            newUsers: totalUsers,
            averageEventsPerDay: snapshot.size > 0 ? Math.round(totalEvents / snapshot.size) : 0
        };

        metrics.learning = {
            quizzesCompleted: totalQuizzes,
            averageQuizScore: totalQuizzes > 0 ? Math.round(totalScoreSum / totalQuizzes) : 0
        };

        return { success: true, metrics };
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user engagement report
 */
export async function getUserEngagementReport(userId) {
    try {
        const report = {
            user: null,
            activity: {
                lessonsViewed: 0,
                lessonsCompleted: 0,
                quizzesTaken: 0,
                gamesPlayed: 0,
                totalTimeSpent: 0
            },
            performance: {
                averageQuizScore: 0,
                bestQuizScore: 0,
                completionRate: 0
            },
            streak: {
                current: 0,
                longest: 0,
                lastActive: null
            }
        };

        // Get user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            report.user = {
                displayName: userDoc.data().displayName,
                role: userDoc.data().role,
                joinedAt: userDoc.data().createdAt
            };
        }

        // Get quiz scores
        const scoresRef = collection(db, 'users', userId, 'quizScores');
        const scoresSnapshot = await getDocs(scoresRef);

        let totalScore = 0;
        let bestScore = 0;

        scoresSnapshot.forEach(doc => {
            const data = doc.data();
            report.activity.quizzesTaken++;
            totalScore += data.percentage || 0;
            bestScore = Math.max(bestScore, data.percentage || 0);
        });

        if (report.activity.quizzesTaken > 0) {
            report.performance.averageQuizScore = Math.round(totalScore / report.activity.quizzesTaken);
            report.performance.bestQuizScore = bestScore;
        }

        // Get activity streak
        const streakDoc = await getDoc(doc(db, 'userActivity', userId));
        if (streakDoc.exists()) {
            const streak = streakDoc.data();
            report.streak = {
                current: streak.currentStreak || 0,
                longest: streak.longestStreak || 0,
                lastActive: streak.lastActiveDate
            };
        }

        return { success: true, report };
    } catch (error) {
        console.error('Error getting user engagement report:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get classroom analytics
 */
export async function getClassroomAnalytics(classroomId, teacherId) {
    try {
        // Verify teacher access
        const classDoc = await getDoc(doc(db, 'classrooms', classroomId));
        if (!classDoc.exists()) {
            throw new Error('Classroom not found');
        }

        const classroom = classDoc.data();
        if (classroom.teacherId !== teacherId && !classroom.coTeacherIds?.includes(teacherId)) {
            throw new Error('Not authorized');
        }

        const analytics = {
            classroom: {
                name: classroom.name,
                studentCount: classroom.studentIds?.length || 0,
                createdAt: classroom.createdAt
            },
            engagement: {
                activeStudents7Days: 0,
                averageSessionsPerStudent: 0,
                totalLessonsCompleted: 0,
                totalQuizzesCompleted: 0
            },
            performance: {
                classAverageScore: 0,
                scoreDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
                topPerformers: [],
                needsAttention: []
            },
            progress: {
                lessonsCompleted: {},
                quizzesCompleted: {}
            }
        };

        // Get student performance data
        const studentPerformance = [];

        for (const studentId of (classroom.studentIds || [])) {
            const scoresRef = collection(db, 'users', studentId, 'quizScores');
            const scoresSnapshot = await getDocs(scoresRef);

            let studentTotal = 0;
            let studentCount = 0;

            scoresSnapshot.forEach(doc => {
                const data = doc.data();
                studentTotal += data.percentage || 0;
                studentCount++;
            });

            const avgScore = studentCount > 0 ? Math.round(studentTotal / studentCount) : 0;

            // Get student name
            const userDoc = await getDoc(doc(db, 'users', studentId));
            const studentName = userDoc.exists() ? userDoc.data().displayName : 'Unknown';

            studentPerformance.push({
                studentId,
                studentName,
                averageScore: avgScore,
                quizzesTaken: studentCount
            });

            // Update score distribution
            if (avgScore >= 90) analytics.performance.scoreDistribution.A++;
            else if (avgScore >= 80) analytics.performance.scoreDistribution.B++;
            else if (avgScore >= 70) analytics.performance.scoreDistribution.C++;
            else if (avgScore >= 60) analytics.performance.scoreDistribution.D++;
            else analytics.performance.scoreDistribution.F++;

            analytics.engagement.totalQuizzesCompleted += studentCount;
        }

        // Calculate class average
        if (studentPerformance.length > 0) {
            const totalAvg = studentPerformance.reduce((sum, s) => sum + s.averageScore, 0);
            analytics.performance.classAverageScore = Math.round(totalAvg / studentPerformance.length);
        }

        // Get top performers and students needing attention
        studentPerformance.sort((a, b) => b.averageScore - a.averageScore);
        analytics.performance.topPerformers = studentPerformance.slice(0, 5);
        analytics.performance.needsAttention = studentPerformance
            .filter(s => s.averageScore < 70)
            .slice(0, 5);

        return { success: true, analytics };
    } catch (error) {
        console.error('Error getting classroom analytics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get school-wide analytics
 */
export async function getSchoolAnalytics(schoolId, principalId) {
    try {
        const analytics = {
            overview: {
                totalTeachers: 0,
                totalStudents: 0,
                totalClassrooms: 0,
                activeUsers30Days: 0
            },
            engagement: {
                averageLoginFrequency: 0,
                contentCompletionRate: 0,
                averageTimeOnPlatform: 0
            },
            performance: {
                schoolAverageScore: 0,
                subjectBreakdown: {},
                gradeBreakdown: {}
            },
            subscriptions: {
                currentTier: 'free',
                seatsUsed: 0,
                seatsTotal: 0
            }
        };

        // Get organization data
        const orgDoc = await getDoc(doc(db, 'organizations', schoolId));
        if (orgDoc.exists()) {
            const org = orgDoc.data();
            analytics.overview = org.stats || analytics.overview;
            analytics.subscriptions.currentTier = org.subscriptionTier || 'free';
        }

        // Get classrooms
        const classroomsQuery = query(
            collection(db, 'classrooms'),
            where('schoolId', '==', schoolId),
            where('isActive', '==', true)
        );
        const classroomsSnapshot = await getDocs(classroomsQuery);
        analytics.overview.totalClassrooms = classroomsSnapshot.size;

        // Aggregate performance data
        let totalScore = 0;
        let totalStudents = 0;

        for (const classDoc of classroomsSnapshot.docs) {
            const classroom = classDoc.data();
            totalStudents += classroom.studentIds?.length || 0;

            // Get classroom average (simplified)
            for (const studentId of (classroom.studentIds || [])) {
                const scoresRef = collection(db, 'users', studentId, 'quizScores');
                const scoresSnapshot = await getDocs(scoresRef);

                scoresSnapshot.forEach(doc => {
                    totalScore += doc.data().percentage || 0;
                });
            }
        }

        analytics.overview.totalStudents = totalStudents;

        return { success: true, analytics };
    } catch (error) {
        console.error('Error getting school analytics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get district-wide analytics
 */
export async function getDistrictAnalytics(districtId) {
    try {
        const analytics = {
            overview: {
                totalSchools: 0,
                totalTeachers: 0,
                totalStudents: 0,
                totalClassrooms: 0
            },
            performance: {
                districtAverageScore: 0,
                schoolRankings: []
            },
            engagement: {
                platformAdoption: 0,
                contentUtilization: 0
            },
            subscription: {
                tier: 'free',
                seatsUsed: 0,
                seatsTotal: 0,
                renewalDate: null
            }
        };

        // Get child schools
        const schoolsQuery = query(
            collection(db, 'organizations'),
            where('parentId', '==', districtId),
            where('type', '==', 'school')
        );

        const schoolsSnapshot = await getDocs(schoolsQuery);
        analytics.overview.totalSchools = schoolsSnapshot.size;

        // Aggregate school data
        for (const schoolDoc of schoolsSnapshot.docs) {
            const school = schoolDoc.data();
            analytics.overview.totalTeachers += school.stats?.totalTeachers || 0;
            analytics.overview.totalStudents += school.stats?.totalStudents || 0;
            analytics.overview.totalClassrooms += school.stats?.totalClassrooms || 0;
        }

        // Get district subscription
        const subQuery = query(
            collection(db, 'subscriptions'),
            where('organizationId', '==', districtId),
            where('status', 'in', ['active', 'trial'])
        );

        const subSnapshot = await getDocs(subQuery);
        if (!subSnapshot.empty) {
            const sub = subSnapshot.docs[0].data();
            analytics.subscription = {
                tier: sub.tier,
                seatsUsed: sub.seats?.used || 0,
                seatsTotal: sub.seats?.total || 0,
                renewalDate: sub.endDate
            };
        }

        return { success: true, analytics };
    } catch (error) {
        console.error('Error getting district analytics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get conversion funnel analytics
 */
export async function getConversionFunnel(startDate, endDate) {
    try {
        const funnel = {
            visitors: 0,
            registered: 0,
            activated: 0,        // Completed first lesson
            engaged: 0,          // Completed 5+ activities
            trialStarted: 0,
            converted: 0,        // Paid subscription
            conversionRates: {}
        };

        // Get counters for date range
        const countersRef = collection(db, 'analytics', 'counters', 'daily');
        const snapshot = await getDocs(countersRef);

        snapshot.forEach(doc => {
            const data = doc.data();
            funnel.registered += data.new_users || 0;
            funnel.trialStarted += data[ANALYTICS_EVENTS.TRIAL_STARTED] || 0;
            funnel.converted += data.premium_conversions || 0;
        });

        // Calculate conversion rates
        if (funnel.visitors > 0) {
            funnel.conversionRates.visitorToRegistration = Math.round((funnel.registered / funnel.visitors) * 100);
        }
        if (funnel.registered > 0) {
            funnel.conversionRates.registrationToTrial = Math.round((funnel.trialStarted / funnel.registered) * 100);
        }
        if (funnel.trialStarted > 0) {
            funnel.conversionRates.trialToConversion = Math.round((funnel.converted / funnel.trialStarted) * 100);
        }

        return { success: true, funnel };
    } catch (error) {
        console.error('Error getting conversion funnel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Export analytics data to CSV
 */
export function exportAnalyticsToCSV(data, filename) {
    const headers = Object.keys(data[0] || {});
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
        const values = headers.map(header => {
            const val = row[header];
            if (typeof val === 'string' && val.includes(',')) {
                return `"${val}"`;
            }
            return val;
        });
        csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

async function getCurrentUserTier() {
    try {
        const user = auth.currentUser;
        if (!user) return 'anonymous';

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return 'guest';

        return userDoc.data().subscriptionTier || CONTENT_TIERS.FREE;
    } catch {
        return 'unknown';
    }
}

/**
 * Update user activity streak
 */
export async function updateUserStreak(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const streakRef = doc(db, 'userActivity', userId);
        const streakDoc = await getDoc(streakRef);

        let currentStreak = 1;
        let longestStreak = 1;

        if (streakDoc.exists()) {
            const data = streakDoc.data();
            const lastActive = data.lastActiveDate;

            if (lastActive === today) {
                // Already logged today
                return;
            }

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                // Continue streak
                currentStreak = (data.currentStreak || 0) + 1;
            }

            longestStreak = Math.max(data.longestStreak || 0, currentStreak);
        }

        await setDoc(streakRef, {
            lastActiveDate: today,
            currentStreak,
            longestStreak,
            updatedAt: Timestamp.now()
        }, { merge: true });

    } catch (error) {
        console.error('Error updating streak:', error);
    }
}

export default {
    ANALYTICS_EVENTS,
    METRIC_TYPES,
    trackEvent,
    trackPageView,
    trackLessonEngagement,
    trackQuizCompletion,
    trackGameInteraction,
    trackConversion,
    trackUpgradePrompt,
    getDashboardMetrics,
    getUserEngagementReport,
    getClassroomAnalytics,
    getSchoolAnalytics,
    getDistrictAnalytics,
    getConversionFunnel,
    exportAnalyticsToCSV,
    updateUserStreak
};
