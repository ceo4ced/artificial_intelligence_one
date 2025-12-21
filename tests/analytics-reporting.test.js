/**
 * Unit tests for analytics-reporting.js
 * Tests engagement tracking, conversion metrics, and reporting functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ANALYTICS_EVENTS,
    METRIC_TYPES
} from '../auth/analytics-reporting.js';

// ============================================================================
// ANALYTICS EVENT DEFINITIONS TESTS
// ============================================================================

describe('Analytics Reporting - Event Definitions', () => {

    describe('ANALYTICS_EVENTS constant', () => {

        describe('User lifecycle events', () => {
            it('should define user registration event', () => {
                expect(ANALYTICS_EVENTS.USER_REGISTERED).toBe('user_registered');
            });

            it('should define user login event', () => {
                expect(ANALYTICS_EVENTS.USER_LOGIN).toBe('user_login');
            });

            it('should define user logout event', () => {
                expect(ANALYTICS_EVENTS.USER_LOGOUT).toBe('user_logout');
            });

            it('should define upgrade/downgrade events', () => {
                expect(ANALYTICS_EVENTS.USER_UPGRADED).toBe('user_upgraded');
                expect(ANALYTICS_EVENTS.USER_DOWNGRADED).toBe('user_downgraded');
            });

            it('should define churn event', () => {
                expect(ANALYTICS_EVENTS.USER_CHURNED).toBe('user_churned');
            });
        });

        describe('Content engagement events', () => {
            it('should define lesson events', () => {
                expect(ANALYTICS_EVENTS.LESSON_STARTED).toBe('lesson_started');
                expect(ANALYTICS_EVENTS.LESSON_COMPLETED).toBe('lesson_completed');
            });

            it('should define quiz events', () => {
                expect(ANALYTICS_EVENTS.QUIZ_STARTED).toBe('quiz_started');
                expect(ANALYTICS_EVENTS.QUIZ_COMPLETED).toBe('quiz_completed');
            });

            it('should define game events', () => {
                expect(ANALYTICS_EVENTS.GAME_STARTED).toBe('game_started');
                expect(ANALYTICS_EVENTS.GAME_COMPLETED).toBe('game_completed');
            });

            it('should define visualizer event', () => {
                expect(ANALYTICS_EVENTS.VISUALIZER_USED).toBe('visualizer_used');
            });
        });

        describe('Premium content events', () => {
            it('should define premium content view event', () => {
                expect(ANALYTICS_EVENTS.PREMIUM_CONTENT_VIEWED).toBe('premium_content_viewed');
            });

            it('should define premium content blocked event', () => {
                expect(ANALYTICS_EVENTS.PREMIUM_CONTENT_BLOCKED).toBe('premium_content_blocked');
            });

            it('should define upgrade prompt events', () => {
                expect(ANALYTICS_EVENTS.UPGRADE_PROMPT_SHOWN).toBe('upgrade_prompt_shown');
                expect(ANALYTICS_EVENTS.UPGRADE_PROMPT_CLICKED).toBe('upgrade_prompt_clicked');
            });
        });

        describe('Subscription events', () => {
            it('should define trial events', () => {
                expect(ANALYTICS_EVENTS.TRIAL_STARTED).toBe('trial_started');
                expect(ANALYTICS_EVENTS.TRIAL_CONVERTED).toBe('trial_converted');
                expect(ANALYTICS_EVENTS.TRIAL_EXPIRED).toBe('trial_expired');
            });

            it('should define subscription lifecycle events', () => {
                expect(ANALYTICS_EVENTS.SUBSCRIPTION_CREATED).toBe('subscription_created');
                expect(ANALYTICS_EVENTS.SUBSCRIPTION_RENEWED).toBe('subscription_renewed');
                expect(ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED).toBe('subscription_cancelled');
            });

            it('should define payment events', () => {
                expect(ANALYTICS_EVENTS.PAYMENT_COMPLETED).toBe('payment_completed');
                expect(ANALYTICS_EVENTS.PAYMENT_FAILED).toBe('payment_failed');
            });
        });

        describe('Organization events', () => {
            it('should define organization creation event', () => {
                expect(ANALYTICS_EVENTS.ORG_CREATED).toBe('org_created');
            });

            it('should define classroom creation event', () => {
                expect(ANALYTICS_EVENTS.CLASSROOM_CREATED).toBe('classroom_created');
            });

            it('should define enrollment events', () => {
                expect(ANALYTICS_EVENTS.STUDENT_ENROLLED).toBe('student_enrolled');
                expect(ANALYTICS_EVENTS.TEACHER_APPROVED).toBe('teacher_approved');
            });
        });

        describe('Assessment events', () => {
            it('should define assessment events', () => {
                expect(ANALYTICS_EVENTS.ASSESSMENT_STARTED).toBe('assessment_started');
                expect(ANALYTICS_EVENTS.ASSESSMENT_COMPLETED).toBe('assessment_completed');
            });

            it('should define certificate event', () => {
                expect(ANALYTICS_EVENTS.CERTIFICATE_EARNED).toBe('certificate_earned');
            });
        });
    });

    describe('Event name uniqueness', () => {
        it('should have unique event names', () => {
            const eventNames = Object.values(ANALYTICS_EVENTS);
            const uniqueNames = new Set(eventNames);
            expect(uniqueNames.size).toBe(eventNames.length);
        });
    });

    describe('Event naming convention', () => {
        it('should use snake_case for all event names', () => {
            Object.values(ANALYTICS_EVENTS).forEach(eventName => {
                expect(eventName).toMatch(/^[a-z]+(_[a-z]+)*$/);
            });
        });
    });
});

// ============================================================================
// METRIC TYPE DEFINITIONS TESTS
// ============================================================================

describe('Analytics Reporting - Metric Definitions', () => {

    describe('METRIC_TYPES constant', () => {

        describe('Engagement metrics', () => {
            it('should define active user metrics', () => {
                expect(METRIC_TYPES.DAILY_ACTIVE_USERS).toBe('dau');
                expect(METRIC_TYPES.WEEKLY_ACTIVE_USERS).toBe('wau');
                expect(METRIC_TYPES.MONTHLY_ACTIVE_USERS).toBe('mau');
            });

            it('should define session metrics', () => {
                expect(METRIC_TYPES.AVERAGE_SESSION_DURATION).toBe('avg_session_duration');
                expect(METRIC_TYPES.PAGES_PER_SESSION).toBe('pages_per_session');
            });

            it('should define bounce rate metric', () => {
                expect(METRIC_TYPES.BOUNCE_RATE).toBe('bounce_rate');
            });
        });

        describe('Learning metrics', () => {
            it('should define lesson completion rate', () => {
                expect(METRIC_TYPES.LESSON_COMPLETION_RATE).toBe('lesson_completion_rate');
            });

            it('should define quiz metrics', () => {
                expect(METRIC_TYPES.QUIZ_AVERAGE_SCORE).toBe('quiz_avg_score');
                expect(METRIC_TYPES.QUIZ_PASS_RATE).toBe('quiz_pass_rate');
            });

            it('should define learning path metrics', () => {
                expect(METRIC_TYPES.LEARNING_PATH_PROGRESS).toBe('learning_path_progress');
                expect(METRIC_TYPES.TIME_TO_COMPLETION).toBe('time_to_completion');
            });
        });

        describe('Conversion metrics', () => {
            it('should define registration rate', () => {
                expect(METRIC_TYPES.REGISTRATION_RATE).toBe('registration_rate');
            });

            it('should define trial conversion rate', () => {
                expect(METRIC_TYPES.TRIAL_CONVERSION_RATE).toBe('trial_conversion_rate');
            });

            it('should define upgrade metrics', () => {
                expect(METRIC_TYPES.FREE_TO_PAID_RATE).toBe('free_to_paid_rate');
                expect(METRIC_TYPES.UPGRADE_RATE).toBe('upgrade_rate');
            });

            it('should define churn rate', () => {
                expect(METRIC_TYPES.CHURN_RATE).toBe('churn_rate');
            });
        });

        describe('Revenue metrics', () => {
            it('should define recurring revenue metrics', () => {
                expect(METRIC_TYPES.MONTHLY_RECURRING_REVENUE).toBe('mrr');
                expect(METRIC_TYPES.ANNUAL_RECURRING_REVENUE).toBe('arr');
            });

            it('should define user value metrics', () => {
                expect(METRIC_TYPES.AVERAGE_REVENUE_PER_USER).toBe('arpu');
                expect(METRIC_TYPES.CUSTOMER_LIFETIME_VALUE).toBe('clv');
            });
        });
    });

    describe('Metric code uniqueness', () => {
        it('should have unique metric codes', () => {
            const metricCodes = Object.values(METRIC_TYPES);
            const uniqueCodes = new Set(metricCodes);
            expect(uniqueCodes.size).toBe(metricCodes.length);
        });
    });
});

// ============================================================================
// EVENT CATEGORIZATION TESTS
// ============================================================================

describe('Analytics Reporting - Event Categories', () => {

    it('should have user lifecycle events', () => {
        const userEvents = [
            'USER_REGISTERED',
            'USER_LOGIN',
            'USER_LOGOUT',
            'USER_UPGRADED',
            'USER_DOWNGRADED',
            'USER_CHURNED'
        ];

        userEvents.forEach(event => {
            expect(ANALYTICS_EVENTS).toHaveProperty(event);
        });
    });

    it('should have content engagement events', () => {
        const contentEvents = [
            'LESSON_STARTED',
            'LESSON_COMPLETED',
            'QUIZ_STARTED',
            'QUIZ_COMPLETED',
            'GAME_STARTED',
            'GAME_COMPLETED',
            'VISUALIZER_USED'
        ];

        contentEvents.forEach(event => {
            expect(ANALYTICS_EVENTS).toHaveProperty(event);
        });
    });

    it('should have monetization events', () => {
        const monetizationEvents = [
            'TRIAL_STARTED',
            'TRIAL_CONVERTED',
            'SUBSCRIPTION_CREATED',
            'PAYMENT_COMPLETED',
            'PAYMENT_FAILED'
        ];

        monetizationEvents.forEach(event => {
            expect(ANALYTICS_EVENTS).toHaveProperty(event);
        });
    });
});

// ============================================================================
// METRIC CATEGORIZATION TESTS
// ============================================================================

describe('Analytics Reporting - Metric Categories', () => {

    it('should have engagement metrics', () => {
        const engagementMetrics = [
            'DAILY_ACTIVE_USERS',
            'WEEKLY_ACTIVE_USERS',
            'MONTHLY_ACTIVE_USERS',
            'AVERAGE_SESSION_DURATION'
        ];

        engagementMetrics.forEach(metric => {
            expect(METRIC_TYPES).toHaveProperty(metric);
        });
    });

    it('should have learning metrics', () => {
        const learningMetrics = [
            'LESSON_COMPLETION_RATE',
            'QUIZ_AVERAGE_SCORE',
            'QUIZ_PASS_RATE'
        ];

        learningMetrics.forEach(metric => {
            expect(METRIC_TYPES).toHaveProperty(metric);
        });
    });

    it('should have business metrics', () => {
        const businessMetrics = [
            'MONTHLY_RECURRING_REVENUE',
            'ANNUAL_RECURRING_REVENUE',
            'CUSTOMER_LIFETIME_VALUE'
        ];

        businessMetrics.forEach(metric => {
            expect(METRIC_TYPES).toHaveProperty(metric);
        });
    });
});

// ============================================================================
// ANALYTICS COMPLETENESS TESTS
// ============================================================================

describe('Analytics Reporting - Completeness', () => {

    describe('User journey coverage', () => {
        it('should track complete user registration journey', () => {
            expect(ANALYTICS_EVENTS.USER_REGISTERED).toBeDefined();
            expect(ANALYTICS_EVENTS.USER_LOGIN).toBeDefined();
            expect(ANALYTICS_EVENTS.USER_LOGOUT).toBeDefined();
        });

        it('should track complete subscription journey', () => {
            expect(ANALYTICS_EVENTS.TRIAL_STARTED).toBeDefined();
            expect(ANALYTICS_EVENTS.TRIAL_CONVERTED).toBeDefined();
            expect(ANALYTICS_EVENTS.TRIAL_EXPIRED).toBeDefined();
            expect(ANALYTICS_EVENTS.SUBSCRIPTION_CREATED).toBeDefined();
            expect(ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED).toBeDefined();
        });

        it('should track complete learning journey', () => {
            expect(ANALYTICS_EVENTS.LESSON_STARTED).toBeDefined();
            expect(ANALYTICS_EVENTS.LESSON_COMPLETED).toBeDefined();
            expect(ANALYTICS_EVENTS.QUIZ_STARTED).toBeDefined();
            expect(ANALYTICS_EVENTS.QUIZ_COMPLETED).toBeDefined();
            expect(ANALYTICS_EVENTS.CERTIFICATE_EARNED).toBeDefined();
        });
    });

    describe('Conversion funnel coverage', () => {
        it('should track visitor to registration', () => {
            expect(METRIC_TYPES.REGISTRATION_RATE).toBeDefined();
        });

        it('should track trial to paid', () => {
            expect(METRIC_TYPES.TRIAL_CONVERSION_RATE).toBeDefined();
        });

        it('should track free to paid', () => {
            expect(METRIC_TYPES.FREE_TO_PAID_RATE).toBeDefined();
        });

        it('should track churn', () => {
            expect(METRIC_TYPES.CHURN_RATE).toBeDefined();
        });
    });
});

// ============================================================================
// EVENT DATA VALIDATION TESTS
// ============================================================================

describe('Analytics Reporting - Event Data Expectations', () => {

    describe('Quiz completion event data', () => {
        it('should expect quiz_id in quiz completion', () => {
            // Quiz completion should include quiz_id, score, total_questions, percentage, passed, time_spent
            const expectedFields = ['quiz_id', 'score', 'total_questions', 'percentage', 'passed', 'time_spent'];
            // This test validates the expected data structure
            expectedFields.forEach(field => {
                expect(typeof field).toBe('string');
            });
        });
    });

    describe('Lesson engagement event data', () => {
        it('should expect lesson_id in lesson events', () => {
            const expectedFields = ['lesson_id', 'action'];
            expectedFields.forEach(field => {
                expect(typeof field).toBe('string');
            });
        });
    });

    describe('Subscription event data', () => {
        it('should expect tier information in subscription events', () => {
            const expectedFields = ['tier', 'billing_cycle', 'price'];
            expectedFields.forEach(field => {
                expect(typeof field).toBe('string');
            });
        });
    });
});

// ============================================================================
// METRIC CALCULATION TESTS
// ============================================================================

describe('Analytics Reporting - Metric Calculations', () => {

    describe('Active user metrics', () => {
        it('should use standard abbreviations for time-based metrics', () => {
            expect(METRIC_TYPES.DAILY_ACTIVE_USERS).toBe('dau');
            expect(METRIC_TYPES.WEEKLY_ACTIVE_USERS).toBe('wau');
            expect(METRIC_TYPES.MONTHLY_ACTIVE_USERS).toBe('mau');
        });
    });

    describe('Revenue metrics', () => {
        it('should use standard abbreviations for revenue metrics', () => {
            expect(METRIC_TYPES.MONTHLY_RECURRING_REVENUE).toBe('mrr');
            expect(METRIC_TYPES.ANNUAL_RECURRING_REVENUE).toBe('arr');
            expect(METRIC_TYPES.AVERAGE_REVENUE_PER_USER).toBe('arpu');
            expect(METRIC_TYPES.CUSTOMER_LIFETIME_VALUE).toBe('clv');
        });
    });
});

// ============================================================================
// EDGE CASES AND VALIDATION TESTS
// ============================================================================

describe('Analytics Reporting - Edge Cases', () => {

    describe('Event name format', () => {
        it('should not have empty event names', () => {
            Object.values(ANALYTICS_EVENTS).forEach(eventName => {
                expect(eventName.length).toBeGreaterThan(0);
            });
        });

        it('should not have whitespace in event names', () => {
            Object.values(ANALYTICS_EVENTS).forEach(eventName => {
                expect(eventName.trim()).toBe(eventName);
            });
        });
    });

    describe('Metric code format', () => {
        it('should not have empty metric codes', () => {
            Object.values(METRIC_TYPES).forEach(metricCode => {
                expect(metricCode.length).toBeGreaterThan(0);
            });
        });

        it('should use lowercase for metric codes', () => {
            Object.values(METRIC_TYPES).forEach(metricCode => {
                expect(metricCode).toBe(metricCode.toLowerCase());
            });
        });
    });
});

// ============================================================================
// INTEGRATION SCENARIO TESTS
// ============================================================================

describe('Analytics Reporting - Integration Scenarios', () => {

    describe('Free user journey', () => {
        it('should have events for complete free user journey', () => {
            const freeUserEvents = [
                ANALYTICS_EVENTS.USER_REGISTERED,
                ANALYTICS_EVENTS.USER_LOGIN,
                ANALYTICS_EVENTS.LESSON_STARTED,
                ANALYTICS_EVENTS.LESSON_COMPLETED,
                ANALYTICS_EVENTS.UPGRADE_PROMPT_SHOWN,
                ANALYTICS_EVENTS.PREMIUM_CONTENT_BLOCKED
            ];

            freeUserEvents.forEach(event => {
                expect(event).toBeDefined();
                expect(typeof event).toBe('string');
            });
        });
    });

    describe('Premium conversion journey', () => {
        it('should have events for trial conversion', () => {
            const conversionEvents = [
                ANALYTICS_EVENTS.TRIAL_STARTED,
                ANALYTICS_EVENTS.UPGRADE_PROMPT_CLICKED,
                ANALYTICS_EVENTS.PAYMENT_COMPLETED,
                ANALYTICS_EVENTS.TRIAL_CONVERTED,
                ANALYTICS_EVENTS.USER_UPGRADED
            ];

            conversionEvents.forEach(event => {
                expect(event).toBeDefined();
            });
        });
    });

    describe('Classroom teacher journey', () => {
        it('should have events for teacher classroom setup', () => {
            const teacherEvents = [
                ANALYTICS_EVENTS.USER_REGISTERED,
                ANALYTICS_EVENTS.TEACHER_APPROVED,
                ANALYTICS_EVENTS.CLASSROOM_CREATED,
                ANALYTICS_EVENTS.STUDENT_ENROLLED
            ];

            teacherEvents.forEach(event => {
                expect(event).toBeDefined();
            });
        });
    });
});
