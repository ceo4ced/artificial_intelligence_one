// Subscription and Payment Management System
// Handles subscription lifecycle, payment processing, and billing

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
    Timestamp,
    writeBatch,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { CONTENT_TIERS, CONTENT_TIER_FEATURES } from './tier-system.js';

// ============================================================================
// SUBSCRIPTION TYPES AND PRICING
// ============================================================================

export const SUBSCRIPTION_TYPES = {
    INDIVIDUAL: 'individual',
    CLASSROOM: 'classroom',
    SCHOOL: 'school',
    DISTRICT: 'district'
};

export const BILLING_CYCLES = {
    MONTHLY: 'monthly',
    ANNUAL: 'annual',
    LIFETIME: 'lifetime'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
};

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    TRIAL: 'trial',
    PAST_DUE: 'past_due',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    PAUSED: 'paused'
};

// Pricing configuration
export const PRICING = {
    [CONTENT_TIERS.FREE]: {
        [SUBSCRIPTION_TYPES.INDIVIDUAL]: {
            [BILLING_CYCLES.MONTHLY]: 0,
            [BILLING_CYCLES.ANNUAL]: 0
        }
    },
    [CONTENT_TIERS.PREMIUM]: {
        [SUBSCRIPTION_TYPES.INDIVIDUAL]: {
            [BILLING_CYCLES.MONTHLY]: 9.99,
            [BILLING_CYCLES.ANNUAL]: 99.99
        },
        [SUBSCRIPTION_TYPES.CLASSROOM]: {
            [BILLING_CYCLES.MONTHLY]: 29.99,
            [BILLING_CYCLES.ANNUAL]: 299.99,
            maxStudents: 35
        }
    },
    [CONTENT_TIERS.ENTERPRISE]: {
        [SUBSCRIPTION_TYPES.SCHOOL]: {
            [BILLING_CYCLES.ANNUAL]: 2999.99,
            maxStudents: 500,
            maxTeachers: 50
        },
        [SUBSCRIPTION_TYPES.DISTRICT]: {
            perStudentAnnual: 5.99,
            minimumStudents: 100,
            volumeDiscounts: [
                { minStudents: 500, discount: 0.10 },
                { minStudents: 1000, discount: 0.15 },
                { minStudents: 5000, discount: 0.20 },
                { minStudents: 10000, discount: 0.25 }
            ]
        }
    }
};

// ============================================================================
// SUBSCRIPTION SCHEMA
// ============================================================================

export const SUBSCRIPTION_SCHEMA = {
    id: '',
    userId: '',                     // Owner user ID
    organizationId: null,           // For school/district subscriptions

    // Subscription details
    tier: CONTENT_TIERS.FREE,
    type: SUBSCRIPTION_TYPES.INDIVIDUAL,
    status: SUBSCRIPTION_STATUS.ACTIVE,

    // Billing
    billingCycle: BILLING_CYCLES.MONTHLY,
    price: 0,
    currency: 'USD',

    // Dates
    startDate: null,
    endDate: null,
    trialEndDate: null,
    cancelledAt: null,
    pausedAt: null,

    // Payment
    paymentMethod: null,            // Stripe payment method ID
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    lastPaymentDate: null,
    nextPaymentDate: null,

    // Enterprise specific
    seats: {
        total: 1,
        used: 1,
        studentSeats: null,
        teacherSeats: null
    },

    // Features and limits
    features: [],
    customLimits: null,

    // Metadata
    couponCode: null,
    referralCode: null,
    notes: null,

    // Timestamps
    createdAt: null,
    updatedAt: null
};

// ============================================================================
// PAYMENT RECORD SCHEMA
// ============================================================================

export const PAYMENT_SCHEMA = {
    id: '',
    subscriptionId: '',
    userId: '',

    // Payment details
    amount: 0,
    currency: 'USD',
    status: PAYMENT_STATUS.PENDING,
    method: '',                     // 'card', 'bank', 'invoice'

    // Stripe
    stripePaymentIntentId: null,
    stripeInvoiceId: null,

    // Invoice details
    invoiceNumber: null,
    invoiceUrl: null,
    receiptUrl: null,

    // Billing info
    billingDetails: {
        name: '',
        email: '',
        address: null
    },

    // Description
    description: '',
    lineItems: [],

    // Dates
    createdAt: null,
    paidAt: null,
    refundedAt: null,

    // Refund
    refundAmount: null,
    refundReason: null
};

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

/**
 * Create a new subscription
 */
export async function createSubscription(userId, subscriptionData) {
    try {
        const subscriptionId = `sub_${userId}_${Date.now().toString(36)}`;

        // Calculate end date based on billing cycle
        const startDate = Timestamp.now();
        const endDate = calculateEndDate(startDate, subscriptionData.billingCycle);

        // Calculate price
        const price = calculatePrice(
            subscriptionData.tier,
            subscriptionData.type,
            subscriptionData.billingCycle,
            subscriptionData.seats?.total
        );

        const subscription = {
            ...SUBSCRIPTION_SCHEMA,
            ...subscriptionData,
            id: subscriptionId,
            userId,
            price,
            startDate,
            endDate,
            status: price === 0 ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.PENDING,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await setDoc(doc(db, 'subscriptions', subscriptionId), subscription);

        // Update user's subscription reference
        await updateDoc(doc(db, 'users', userId), {
            subscriptionId,
            subscriptionTier: subscriptionData.tier,
            updatedAt: Timestamp.now()
        });

        return { success: true, subscriptionId, subscription };
    } catch (error) {
        console.error('Error creating subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId) {
    try {
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

        if (!subDoc.exists()) {
            return { success: false, error: 'Subscription not found' };
        }

        return { success: true, subscription: subDoc.data() };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return getDefaultSubscription();
        }

        const user = userDoc.data();

        // Check organization subscription first (for enterprise)
        if (user.organizationId) {
            const orgSub = await getOrganizationActiveSubscription(user.organizationId);
            if (orgSub.success && orgSub.subscription) {
                return { success: true, subscription: orgSub.subscription, type: 'organization' };
            }
        }

        // Check individual subscription
        if (user.subscriptionId) {
            const result = await getSubscription(user.subscriptionId);
            if (result.success) {
                // Verify subscription is still valid
                const isValid = isSubscriptionValid(result.subscription);
                if (isValid) {
                    return { success: true, subscription: result.subscription, type: 'individual' };
                }
            }
        }

        return getDefaultSubscription();
    } catch (error) {
        console.error('Error getting user subscription:', error);
        return getDefaultSubscription();
    }
}

/**
 * Get organization's active subscription
 */
export async function getOrganizationActiveSubscription(organizationId) {
    try {
        const subQuery = query(
            collection(db, 'subscriptions'),
            where('organizationId', '==', organizationId),
            where('status', 'in', [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL])
        );

        const snapshot = await getDocs(subQuery);

        if (snapshot.empty) {
            return { success: true, subscription: null };
        }

        // Return the most recent active subscription
        const subscriptions = snapshot.docs.map(doc => doc.data());
        subscriptions.sort((a, b) => b.createdAt - a.createdAt);

        return { success: true, subscription: subscriptions[0] };
    } catch (error) {
        console.error('Error fetching organization subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update subscription
 */
export async function updateSubscription(subscriptionId, updates, userId) {
    try {
        // Verify ownership
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (!subDoc.exists()) {
            throw new Error('Subscription not found');
        }

        const subscription = subDoc.data();
        if (subscription.userId !== userId) {
            throw new Error('Not authorized to update this subscription');
        }

        // Remove protected fields
        delete updates.id;
        delete updates.userId;
        delete updates.createdAt;
        delete updates.stripeCustomerId;
        delete updates.stripeSubscriptionId;

        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
            ...updates,
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, userId, reason = '') {
    try {
        // Verify ownership
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (!subDoc.exists()) {
            throw new Error('Subscription not found');
        }

        const subscription = subDoc.data();
        if (subscription.userId !== userId) {
            throw new Error('Not authorized to cancel this subscription');
        }

        // If Stripe subscription exists, cancel it there too
        if (subscription.stripeSubscriptionId) {
            // In production, call Stripe API here
            // await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }

        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
            status: SUBSCRIPTION_STATUS.CANCELLED,
            cancelledAt: Timestamp.now(),
            cancellationReason: reason,
            updatedAt: Timestamp.now()
        });

        // Update user
        await updateDoc(doc(db, 'users', userId), {
            subscriptionTier: CONTENT_TIERS.FREE,
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upgrade subscription
 */
export async function upgradeSubscription(subscriptionId, newTier, newBillingCycle, userId) {
    try {
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (!subDoc.exists()) {
            throw new Error('Subscription not found');
        }

        const subscription = subDoc.data();
        if (subscription.userId !== userId) {
            throw new Error('Not authorized');
        }

        // Calculate new price
        const newPrice = calculatePrice(
            newTier,
            subscription.type,
            newBillingCycle,
            subscription.seats?.total
        );

        // Calculate prorated amount if upgrading mid-cycle
        const proratedAmount = calculateProration(subscription, newTier, newBillingCycle);

        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
            tier: newTier,
            billingCycle: newBillingCycle,
            price: newPrice,
            previousTier: subscription.tier,
            upgradedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        // Update user tier
        await updateDoc(doc(db, 'users', userId), {
            subscriptionTier: newTier,
            updatedAt: Timestamp.now()
        });

        return {
            success: true,
            proratedAmount,
            newPrice
        };
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

/**
 * Create a payment record
 */
export async function createPaymentRecord(paymentData) {
    try {
        const paymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

        const payment = {
            ...PAYMENT_SCHEMA,
            ...paymentData,
            id: paymentId,
            createdAt: Timestamp.now()
        };

        await setDoc(doc(db, 'payments', paymentId), payment);

        return { success: true, paymentId, payment };
    } catch (error) {
        console.error('Error creating payment record:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get payment history for user
 */
export async function getPaymentHistory(userId) {
    try {
        const paymentsQuery = query(
            collection(db, 'payments'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(paymentsQuery);
        const payments = snapshot.docs.map(doc => doc.data());

        return { success: true, payments };
    } catch (error) {
        console.error('Error fetching payment history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
        const updates = {
            status,
            updatedAt: Timestamp.now(),
            ...additionalData
        };

        if (status === PAYMENT_STATUS.COMPLETED) {
            updates.paidAt = Timestamp.now();
        } else if (status === PAYMENT_STATUS.REFUNDED) {
            updates.refundedAt = Timestamp.now();
        }

        await updateDoc(doc(db, 'payments', paymentId), updates);

        return { success: true };
    } catch (error) {
        console.error('Error updating payment status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Process subscription payment
 */
export async function processSubscriptionPayment(subscriptionId, paymentIntentId) {
    try {
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (!subDoc.exists()) {
            throw new Error('Subscription not found');
        }

        const subscription = subDoc.data();
        const batch = writeBatch(db);

        // Create payment record
        const paymentId = `pay_${Date.now().toString(36)}`;
        const paymentDoc = {
            ...PAYMENT_SCHEMA,
            id: paymentId,
            subscriptionId,
            userId: subscription.userId,
            amount: subscription.price,
            status: PAYMENT_STATUS.COMPLETED,
            stripePaymentIntentId: paymentIntentId,
            description: `${subscription.tier} subscription - ${subscription.billingCycle}`,
            createdAt: Timestamp.now(),
            paidAt: Timestamp.now()
        };

        batch.set(doc(db, 'payments', paymentId), paymentDoc);

        // Update subscription status
        const nextPaymentDate = calculateEndDate(Timestamp.now(), subscription.billingCycle);

        batch.update(doc(db, 'subscriptions', subscriptionId), {
            status: SUBSCRIPTION_STATUS.ACTIVE,
            lastPaymentDate: Timestamp.now(),
            nextPaymentDate,
            endDate: nextPaymentDate,
            updatedAt: Timestamp.now()
        });

        await batch.commit();

        return { success: true, paymentId };
    } catch (error) {
        console.error('Error processing subscription payment:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TRIAL AND PROMOTIONAL FEATURES
// ============================================================================

/**
 * Start free trial
 */
export async function startFreeTrial(userId, tier = CONTENT_TIERS.PREMIUM, trialDays = 14) {
    try {
        // Check if user has had a trial before
        const existingTrials = query(
            collection(db, 'subscriptions'),
            where('userId', '==', userId),
            where('status', '==', SUBSCRIPTION_STATUS.TRIAL)
        );

        const snapshot = await getDocs(existingTrials);
        if (!snapshot.empty) {
            return { success: false, error: 'Trial already used' };
        }

        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        const result = await createSubscription(userId, {
            tier,
            type: SUBSCRIPTION_TYPES.INDIVIDUAL,
            billingCycle: BILLING_CYCLES.MONTHLY,
            status: SUBSCRIPTION_STATUS.TRIAL,
            trialEndDate: Timestamp.fromDate(trialEndDate)
        });

        if (result.success) {
            // Update subscription status to trial
            await updateDoc(doc(db, 'subscriptions', result.subscriptionId), {
                status: SUBSCRIPTION_STATUS.TRIAL,
                price: 0 // Trial is free
            });
        }

        return result;
    } catch (error) {
        console.error('Error starting trial:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Apply coupon code
 */
export async function applyCouponCode(subscriptionId, couponCode, userId) {
    try {
        // Get coupon
        const couponDoc = await getDoc(doc(db, 'coupons', couponCode.toUpperCase()));

        if (!couponDoc.exists()) {
            return { success: false, error: 'Invalid coupon code' };
        }

        const coupon = couponDoc.data();

        // Validate coupon
        const now = Timestamp.now();
        if (coupon.expiresAt && coupon.expiresAt < now) {
            return { success: false, error: 'Coupon has expired' };
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return { success: false, error: 'Coupon has reached maximum uses' };
        }

        // Get subscription
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (!subDoc.exists() || subDoc.data().userId !== userId) {
            return { success: false, error: 'Subscription not found' };
        }

        const subscription = subDoc.data();

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = subscription.price * (coupon.value / 100);
        } else if (coupon.type === 'fixed') {
            discount = coupon.value;
        }

        const newPrice = Math.max(0, subscription.price - discount);

        // Update subscription
        const batch = writeBatch(db);

        batch.update(doc(db, 'subscriptions', subscriptionId), {
            couponCode: couponCode.toUpperCase(),
            originalPrice: subscription.price,
            price: newPrice,
            discount,
            updatedAt: Timestamp.now()
        });

        // Increment coupon usage
        batch.update(doc(db, 'coupons', couponCode.toUpperCase()), {
            usedCount: (coupon.usedCount || 0) + 1,
            lastUsedAt: Timestamp.now()
        });

        await batch.commit();

        return {
            success: true,
            discount,
            newPrice,
            couponType: coupon.type,
            couponValue: coupon.value
        };
    } catch (error) {
        console.error('Error applying coupon:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// ENTERPRISE/BULK LICENSING
// ============================================================================

/**
 * Create enterprise subscription for organization
 */
export async function createEnterpriseSubscription(organizationId, adminUserId, options) {
    try {
        const {
            studentCount,
            teacherCount,
            billingCycle = BILLING_CYCLES.ANNUAL
        } = options;

        // Calculate enterprise pricing
        const basePrice = PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].perStudentAnnual;
        let discount = 0;

        // Apply volume discount
        for (const tier of PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].volumeDiscounts) {
            if (studentCount >= tier.minStudents) {
                discount = tier.discount;
            }
        }

        const pricePerStudent = basePrice * (1 - discount);
        const totalPrice = pricePerStudent * studentCount;

        const subscriptionId = `sub_org_${organizationId}_${Date.now().toString(36)}`;

        const subscription = {
            ...SUBSCRIPTION_SCHEMA,
            id: subscriptionId,
            userId: adminUserId,
            organizationId,
            tier: CONTENT_TIERS.ENTERPRISE,
            type: SUBSCRIPTION_TYPES.DISTRICT,
            billingCycle,
            price: totalPrice,
            seats: {
                total: studentCount + teacherCount,
                used: 0,
                studentSeats: studentCount,
                teacherSeats: teacherCount
            },
            volumeDiscount: discount,
            pricePerStudent,
            status: SUBSCRIPTION_STATUS.PENDING, // Pending until payment
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await setDoc(doc(db, 'subscriptions', subscriptionId), subscription);

        // Update organization
        await updateDoc(doc(db, 'organizations', organizationId), {
            subscriptionId,
            subscriptionTier: CONTENT_TIERS.ENTERPRISE,
            updatedAt: Timestamp.now()
        });

        return {
            success: true,
            subscriptionId,
            totalPrice,
            pricePerStudent,
            discount,
            seats: subscription.seats
        };
    } catch (error) {
        console.error('Error creating enterprise subscription:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add seats to enterprise subscription
 */
export async function addSeatsToSubscription(subscriptionId, additionalSeats, seatType, userId) {
    try {
        const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
        if (!subDoc.exists()) {
            throw new Error('Subscription not found');
        }

        const subscription = subDoc.data();

        if (subscription.type !== SUBSCRIPTION_TYPES.DISTRICT &&
            subscription.type !== SUBSCRIPTION_TYPES.SCHOOL) {
            throw new Error('Seat management only available for enterprise subscriptions');
        }

        const currentSeats = subscription.seats || { total: 0, studentSeats: 0, teacherSeats: 0 };
        const newSeats = { ...currentSeats };

        if (seatType === 'student') {
            newSeats.studentSeats += additionalSeats;
        } else if (seatType === 'teacher') {
            newSeats.teacherSeats += additionalSeats;
        }
        newSeats.total = newSeats.studentSeats + newSeats.teacherSeats;

        // Calculate additional cost
        const pricePerSeat = subscription.pricePerStudent || PRICING[CONTENT_TIERS.ENTERPRISE][SUBSCRIPTION_TYPES.DISTRICT].perStudentAnnual;
        const additionalCost = additionalSeats * pricePerSeat;

        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
            seats: newSeats,
            updatedAt: Timestamp.now()
        });

        return {
            success: true,
            newSeats,
            additionalCost
        };
    } catch (error) {
        console.error('Error adding seats:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateEndDate(startDate, billingCycle) {
    const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
    const end = new Date(start);

    switch (billingCycle) {
        case BILLING_CYCLES.MONTHLY:
            end.setMonth(end.getMonth() + 1);
            break;
        case BILLING_CYCLES.ANNUAL:
            end.setFullYear(end.getFullYear() + 1);
            break;
        case BILLING_CYCLES.LIFETIME:
            end.setFullYear(end.getFullYear() + 100); // Effectively forever
            break;
        default:
            end.setMonth(end.getMonth() + 1);
    }

    return Timestamp.fromDate(end);
}

function calculatePrice(tier, type, billingCycle, seats = 1) {
    const tierPricing = PRICING[tier];
    if (!tierPricing) return 0;

    const typePricing = tierPricing[type];
    if (!typePricing) return 0;

    const price = typePricing[billingCycle];
    if (price === undefined || price === null) {
        // For enterprise, calculate based on seats
        if (typePricing.perStudentAnnual) {
            return typePricing.perStudentAnnual * seats;
        }
        return 0;
    }

    return price;
}

function calculateProration(currentSubscription, newTier, newBillingCycle) {
    if (!currentSubscription.endDate) return 0;

    const now = new Date();
    const endDate = currentSubscription.endDate.toDate ? currentSubscription.endDate.toDate() : new Date(currentSubscription.endDate);
    const startDate = currentSubscription.startDate.toDate ? currentSubscription.startDate.toDate() : new Date(currentSubscription.startDate);

    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const remainingDays = Math.max(0, (endDate - now) / (1000 * 60 * 60 * 24));

    const dailyRate = currentSubscription.price / totalDays;
    const unusedValue = dailyRate * remainingDays;

    const newPrice = calculatePrice(newTier, currentSubscription.type, newBillingCycle);

    return Math.max(0, newPrice - unusedValue);
}

function isSubscriptionValid(subscription) {
    if (!subscription) return false;

    const validStatuses = [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL];
    if (!validStatuses.includes(subscription.status)) return false;

    if (subscription.endDate) {
        const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
        if (endDate < new Date()) return false;
    }

    if (subscription.status === SUBSCRIPTION_STATUS.TRIAL && subscription.trialEndDate) {
        const trialEnd = subscription.trialEndDate.toDate ? subscription.trialEndDate.toDate() : new Date(subscription.trialEndDate);
        if (trialEnd < new Date()) return false;
    }

    return true;
}

function getDefaultSubscription() {
    return {
        success: true,
        subscription: {
            tier: CONTENT_TIERS.FREE,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            type: SUBSCRIPTION_TYPES.INDIVIDUAL,
            features: CONTENT_TIER_FEATURES[CONTENT_TIERS.FREE].features,
            limits: CONTENT_TIER_FEATURES[CONTENT_TIERS.FREE].limits
        },
        type: 'default'
    };
}

// ============================================================================
// STRIPE WEBHOOK HANDLERS (Placeholder)
// ============================================================================

/**
 * Handle Stripe webhook events
 * In production, this would be called from a Firebase Cloud Function
 */
export async function handleStripeWebhook(event) {
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            default:
                console.log(`Unhandled webhook event type: ${event.type}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Webhook handler error:', error);
        return { success: false, error: error.message };
    }
}

async function handleCheckoutCompleted(session) {
    // Implementation for checkout completion
    console.log('Checkout completed:', session.id);
}

async function handleInvoicePaid(invoice) {
    // Implementation for successful invoice payment
    console.log('Invoice paid:', invoice.id);
}

async function handlePaymentFailed(invoice) {
    // Implementation for failed payment
    console.log('Payment failed:', invoice.id);
}

async function handleSubscriptionUpdated(subscription) {
    // Implementation for subscription updates
    console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
    // Implementation for subscription deletion
    console.log('Subscription deleted:', subscription.id);
}

export default {
    SUBSCRIPTION_TYPES,
    BILLING_CYCLES,
    PAYMENT_STATUS,
    SUBSCRIPTION_STATUS,
    PRICING,
    createSubscription,
    getSubscription,
    getUserSubscription,
    getOrganizationActiveSubscription,
    updateSubscription,
    cancelSubscription,
    upgradeSubscription,
    createPaymentRecord,
    getPaymentHistory,
    updatePaymentStatus,
    processSubscriptionPayment,
    startFreeTrial,
    applyCouponCode,
    createEnterpriseSubscription,
    addSeatsToSubscription,
    handleStripeWebhook
};
