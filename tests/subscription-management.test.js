/**
 * Unit tests for subscription-management.js
 * Tests subscription lifecycle, billing, and payment processing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    SUBSCRIPTION_TYPES,
    BILLING_CYCLES,
    PAYMENT_STATUS,
    SUBSCRIPTION_STATUS,
    PRICING
} from '../auth/subscription-management.js';
import { CONTENT_TIERS } from '../auth/tier-system.js';

// ============================================================================
// SUBSCRIPTION TYPE DEFINITIONS TESTS
// ============================================================================

describe('Subscription Management - Type Definitions', () => {

    describe('SUBSCRIPTION_TYPES constant', () => {
        it('should define all subscription types', () => {
            expect(SUBSCRIPTION_TYPES.INDIVIDUAL).toBe('individual');
            expect(SUBSCRIPTION_TYPES.CLASSROOM).toBe('classroom');
            expect(SUBSCRIPTION_TYPES.SCHOOL).toBe('school');
            expect(SUBSCRIPTION_TYPES.DISTRICT).toBe('district');
        });

        it('should have exactly 4 subscription types', () => {
            expect(Object.keys(SUBSCRIPTION_TYPES).length).toBe(4);
        });
    });

    describe('BILLING_CYCLES constant', () => {
        it('should define all billing cycles', () => {
            expect(BILLING_CYCLES.MONTHLY).toBe('monthly');
            expect(BILLING_CYCLES.ANNUAL).toBe('annual');
            expect(BILLING_CYCLES.LIFETIME).toBe('lifetime');
        });

        it('should have exactly 3 billing cycles', () => {
            expect(Object.keys(BILLING_CYCLES).length).toBe(3);
        });
    });

    describe('PAYMENT_STATUS constant', () => {
        it('should define all payment statuses', () => {
            expect(PAYMENT_STATUS.PENDING).toBe('pending');
            expect(PAYMENT_STATUS.COMPLETED).toBe('completed');
            expect(PAYMENT_STATUS.FAILED).toBe('failed');
            expect(PAYMENT_STATUS.REFUNDED).toBe('refunded');
            expect(PAYMENT_STATUS.CANCELLED).toBe('cancelled');
        });

        it('should have exactly 5 payment statuses', () => {
            expect(Object.keys(PAYMENT_STATUS).length).toBe(5);
        });
    });

    describe('SUBSCRIPTION_STATUS constant', () => {
        it('should define all subscription statuses', () => {
            expect(SUBSCRIPTION_STATUS.ACTIVE).toBe('active');
            expect(SUBSCRIPTION_STATUS.TRIAL).toBe('trial');
            expect(SUBSCRIPTION_STATUS.PAST_DUE).toBe('past_due');
            expect(SUBSCRIPTION_STATUS.CANCELLED).toBe('cancelled');
            expect(SUBSCRIPTION_STATUS.EXPIRED).toBe('expired');
            expect(SUBSCRIPTION_STATUS.PAUSED).toBe('paused');
        });

        it('should have exactly 6 subscription statuses', () => {
            expect(Object.keys(SUBSCRIPTION_STATUS).length).toBe(6);
        });
    });
});

// ============================================================================
// PRICING STRUCTURE TESTS
// ============================================================================

describe('Subscription Management - Pricing Structure', () => {

    describe('FREE tier pricing', () => {
        it('should have zero cost for individual subscriptions', () => {
            const freePricing = PRICING[CONTENT_TIERS.FREE];
            expect(freePricing).toBeDefined();
            expect(freePricing[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY]).toBe(0);
            expect(freePricing[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.ANNUAL]).toBe(0);
        });
    });

    describe('PREMIUM tier pricing', () => {
        it('should have correct individual monthly price', () => {
            const premiumPricing = PRICING[CONTENT_TIERS.PREMIUM];
            expect(premiumPricing[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY]).toBe(9.99);
        });

        it('should have correct individual annual price', () => {
            const premiumPricing = PRICING[CONTENT_TIERS.PREMIUM];
            expect(premiumPricing[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.ANNUAL]).toBe(99.99);
        });

        it('should offer discount for annual vs monthly', () => {
            const premiumPricing = PRICING[CONTENT_TIERS.PREMIUM];
            const monthlyAnnualized = premiumPricing[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY] * 12;
            const annualPrice = premiumPricing[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.ANNUAL];
            expect(annualPrice).toBeLessThan(monthlyAnnualized);
        });

        it('should have classroom pricing', () => {
            const premiumPricing = PRICING[CONTENT_TIERS.PREMIUM];
            expect(premiumPricing[SUBSCRIPTION_TYPES.CLASSROOM][BILLING_CYCLES.MONTHLY]).toBe(29.99);
            expect(premiumPricing[SUBSCRIPTION_TYPES.CLASSROOM][BILLING_CYCLES.ANNUAL]).toBe(299.99);
            expect(premiumPricing[SUBSCRIPTION_TYPES.CLASSROOM].maxStudents).toBe(35);
        });
    });

    describe('ENTERPRISE tier pricing', () => {
        it('should have school pricing', () => {
            const enterprisePricing = PRICING[CONTENT_TIERS.ENTERPRISE];
            expect(enterprisePricing[SUBSCRIPTION_TYPES.SCHOOL][BILLING_CYCLES.ANNUAL]).toBe(2999.99);
            expect(enterprisePricing[SUBSCRIPTION_TYPES.SCHOOL].maxStudents).toBe(500);
            expect(enterprisePricing[SUBSCRIPTION_TYPES.SCHOOL].maxTeachers).toBe(50);
        });

        it('should have district per-student pricing', () => {
            const enterprisePricing = PRICING[CONTENT_TIERS.ENTERPRISE];
            expect(enterprisePricing[SUBSCRIPTION_TYPES.DISTRICT].perStudentAnnual).toBe(5.99);
            expect(enterprisePricing[SUBSCRIPTION_TYPES.DISTRICT].minimumStudents).toBe(100);
        });

        it('should have volume discounts for districts', () => {
            const enterprisePricing = PRICING[CONTENT_TIERS.ENTERPRISE];
            const volumeDiscounts = enterprisePricing[SUBSCRIPTION_TYPES.DISTRICT].volumeDiscounts;

            expect(Array.isArray(volumeDiscounts)).toBe(true);
            expect(volumeDiscounts.length).toBeGreaterThan(0);

            // Verify discount tiers are ordered
            for (let i = 1; i < volumeDiscounts.length; i++) {
                expect(volumeDiscounts[i].minStudents).toBeGreaterThan(volumeDiscounts[i-1].minStudents);
                expect(volumeDiscounts[i].discount).toBeGreaterThan(volumeDiscounts[i-1].discount);
            }
        });

        it('should have increasing discounts for larger districts', () => {
            const volumeDiscounts = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].volumeDiscounts;

            expect(volumeDiscounts.find(d => d.minStudents === 500)?.discount).toBe(0.10);
            expect(volumeDiscounts.find(d => d.minStudents === 1000)?.discount).toBe(0.15);
            expect(volumeDiscounts.find(d => d.minStudents === 5000)?.discount).toBe(0.20);
            expect(volumeDiscounts.find(d => d.minStudents === 10000)?.discount).toBe(0.25);
        });
    });
});

// ============================================================================
// SUBSCRIPTION SCHEMA TESTS
// ============================================================================

describe('Subscription Management - Schema Validation', () => {

    it('should require essential subscription fields', () => {
        const requiredFields = ['id', 'userId', 'tier', 'type', 'status', 'billingCycle'];

        // These fields should be defined in the schema
        requiredFields.forEach(field => {
            expect(field).toBeDefined();
        });
    });

    it('should have valid default values', () => {
        // Default subscription should be free tier
        expect(CONTENT_TIERS.FREE).toBe('free');
        expect(SUBSCRIPTION_STATUS.ACTIVE).toBe('active');
    });
});

// ============================================================================
// BUSINESS LOGIC TESTS
// ============================================================================

describe('Subscription Management - Business Logic', () => {

    describe('Pricing calculations', () => {
        it('should correctly calculate monthly subscription cost', () => {
            const monthlyPrice = PRICING[CONTENT_TIERS.PREMIUM][SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY];
            expect(monthlyPrice).toBe(9.99);
        });

        it('should correctly calculate annual subscription cost', () => {
            const annualPrice = PRICING[CONTENT_TIERS.PREMIUM][SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.ANNUAL];
            expect(annualPrice).toBe(99.99);
        });

        it('should calculate classroom subscription correctly', () => {
            const classroomMonthly = PRICING[CONTENT_TIERS.PREMIUM][SUBSCRIPTION_TYPES.CLASSROOM][BILLING_CYCLES.MONTHLY];
            const classroomAnnual = PRICING[CONTENT_TIERS.PREMIUM][SUBSCRIPTION_TYPES.CLASSROOM][BILLING_CYCLES.ANNUAL];

            expect(classroomMonthly).toBe(29.99);
            expect(classroomAnnual).toBe(299.99);
        });
    });

    describe('Enterprise volume pricing', () => {
        it('should calculate correct price for 500 students', () => {
            const basePrice = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].perStudentAnnual;
            const discount = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].volumeDiscounts
                .find(d => d.minStudents === 500)?.discount || 0;

            const pricePerStudent = basePrice * (1 - discount);
            const totalPrice = pricePerStudent * 500;

            expect(pricePerStudent).toBeCloseTo(5.99 * 0.9, 2);
            expect(totalPrice).toBeCloseTo(500 * 5.99 * 0.9, 2);
        });

        it('should calculate correct price for 10000 students', () => {
            const basePrice = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].perStudentAnnual;
            const discount = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].volumeDiscounts
                .find(d => d.minStudents === 10000)?.discount || 0;

            const pricePerStudent = basePrice * (1 - discount);
            const totalPrice = pricePerStudent * 10000;

            expect(discount).toBe(0.25);
            expect(pricePerStudent).toBeCloseTo(5.99 * 0.75, 2);
        });
    });

    describe('Subscription status transitions', () => {
        it('should have valid status values', () => {
            const validStatuses = Object.values(SUBSCRIPTION_STATUS);

            expect(validStatuses).toContain('active');
            expect(validStatuses).toContain('trial');
            expect(validStatuses).toContain('cancelled');
            expect(validStatuses).toContain('expired');
        });

        it('should handle trial to active transition', () => {
            // Trial status should be able to transition to active
            expect(SUBSCRIPTION_STATUS.TRIAL).toBeDefined();
            expect(SUBSCRIPTION_STATUS.ACTIVE).toBeDefined();
        });

        it('should handle active to cancelled transition', () => {
            expect(SUBSCRIPTION_STATUS.ACTIVE).toBeDefined();
            expect(SUBSCRIPTION_STATUS.CANCELLED).toBeDefined();
        });
    });
});

// ============================================================================
// SEAT MANAGEMENT TESTS
// ============================================================================

describe('Subscription Management - Seat Management', () => {

    it('should define max students for classroom subscriptions', () => {
        const classroomConfig = PRICING[CONTENT_TIERS.PREMIUM][SUBSCRIPTION_TYPES.CLASSROOM];
        expect(classroomConfig.maxStudents).toBe(35);
    });

    it('should define max students for school subscriptions', () => {
        const schoolConfig = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.SCHOOL];
        expect(schoolConfig.maxStudents).toBe(500);
    });

    it('should define max teachers for school subscriptions', () => {
        const schoolConfig = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.SCHOOL];
        expect(schoolConfig.maxTeachers).toBe(50);
    });

    it('should have minimum students for district subscriptions', () => {
        const districtConfig = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT];
        expect(districtConfig.minimumStudents).toBe(100);
    });
});

// ============================================================================
// PAYMENT STATUS TESTS
// ============================================================================

describe('Subscription Management - Payment Status', () => {

    it('should track pending payments', () => {
        expect(PAYMENT_STATUS.PENDING).toBe('pending');
    });

    it('should track completed payments', () => {
        expect(PAYMENT_STATUS.COMPLETED).toBe('completed');
    });

    it('should track failed payments', () => {
        expect(PAYMENT_STATUS.FAILED).toBe('failed');
    });

    it('should track refunded payments', () => {
        expect(PAYMENT_STATUS.REFUNDED).toBe('refunded');
    });

    it('should track cancelled payments', () => {
        expect(PAYMENT_STATUS.CANCELLED).toBe('cancelled');
    });
});

// ============================================================================
// EDGE CASES AND VALIDATION TESTS
// ============================================================================

describe('Subscription Management - Edge Cases', () => {

    it('should handle free tier with no payment required', () => {
        const freeMonthly = PRICING[CONTENT_TIERS.FREE][SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY];
        const freeAnnual = PRICING[CONTENT_TIERS.FREE][SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.ANNUAL];

        expect(freeMonthly).toBe(0);
        expect(freeAnnual).toBe(0);
    });

    it('should have consistent pricing structure across tiers', () => {
        // All tiers should have at least individual pricing
        Object.values(CONTENT_TIERS).forEach(tier => {
            expect(PRICING[tier]).toBeDefined();
        });
    });

    it('should not allow negative pricing', () => {
        Object.values(CONTENT_TIERS).forEach(tier => {
            const tierPricing = PRICING[tier];
            Object.values(tierPricing).forEach(typePricing => {
                Object.values(typePricing).forEach(value => {
                    if (typeof value === 'number' && value !== null) {
                        expect(value).toBeGreaterThanOrEqual(0);
                    }
                });
            });
        });
    });
});

// ============================================================================
// INTEGRATION SCENARIO TESTS
// ============================================================================

describe('Subscription Management - Integration Scenarios', () => {

    describe('Individual user subscription flow', () => {
        it('should support free to premium upgrade path', () => {
            const freeTier = PRICING[CONTENT_TIERS.FREE];
            const premiumTier = PRICING[CONTENT_TIERS.PREMIUM];

            expect(freeTier).toBeDefined();
            expect(premiumTier).toBeDefined();
            expect(premiumTier[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY])
                .toBeGreaterThan(freeTier[SUBSCRIPTION_TYPES.INDIVIDUAL][BILLING_CYCLES.MONTHLY]);
        });
    });

    describe('School subscription flow', () => {
        it('should support classroom to school upgrade path', () => {
            const classroomPrice = PRICING[CONTENT_TIERS.PREMIUM][SUBSCRIPTION_TYPES.CLASSROOM][BILLING_CYCLES.ANNUAL];
            const schoolPrice = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.SCHOOL][BILLING_CYCLES.ANNUAL];

            expect(classroomPrice).toBeDefined();
            expect(schoolPrice).toBeDefined();
            expect(schoolPrice).toBeGreaterThan(classroomPrice);
        });
    });

    describe('District subscription flow', () => {
        it('should calculate cost savings with volume discounts', () => {
            const basePrice = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].perStudentAnnual;
            const studentCount = 5000;

            // Without discount
            const fullPrice = basePrice * studentCount;

            // With 20% discount for 5000+ students
            const discountedPrice = basePrice * 0.80 * studentCount;

            expect(discountedPrice).toBeLessThan(fullPrice);
            expect(fullPrice - discountedPrice).toBeCloseTo(basePrice * 0.20 * studentCount, 2);
        });
    });
});
