
import { describe, it, expect } from 'vitest';
import {
    extractFeatures, predict, updateClassifier,
    INITIAL_STATE, Email
} from './engine.js';

describe('Logistic Regression Engine', () => {

    it('should extract features from email', () => {
        const email: Email = {
            from: 'test', subject: 'Win money',
            body: 'Click here to win big money', type: 'spam'
        };
        const features = extractFeatures(email);
        expect(features['win']).toBe(2);
        expect(features['money']).toBe(2);
        expect(features['click']).toBe(1);
    });

    it('should predict spam probability (untrained)', () => {
        const email: Email = { from: 'a', subject: 'b', body: 'c', type: 'ham' };
        const prob = predict(email, INITIAL_STATE);
        expect(prob).toBe(0.5); // Bias 0 => sigmoid(0) = 0.5
    });

    it('should update weights on training', () => {
        const email: Email = {
            from: 'x', subject: 'Free stuff', body: 'Win Free', type: 'spam'
        };

        // Train as SPAM
        const nextState = updateClassifier(INITIAL_STATE, email, 'spam');

        // "Win" and "Free" should have positive weights now
        expect(nextState.weights['win']).toBeGreaterThan(0);
        expect(nextState.weights['free']).toBeGreaterThan(0);

        // Prediction should now be > 0.5
        const prob = predict(email, nextState);
        expect(prob).toBeGreaterThan(0.5);
    });

    it('should track metrics', () => {
        const email: Email = { from: 'a', subject: 'b', body: 'c', type: 'spam' };
        // User classified correctly
        const s1 = updateClassifier(INITIAL_STATE, email, 'spam');
        expect(s1.metrics.correctCount).toBe(1);
        expect(s1.metrics.accuracy).toBe(100);

        // User classified incorrectly
        const s2 = updateClassifier(s1, email, 'ham');
        expect(s2.metrics.correctCount).toBe(1); // Still 1
        expect(s2.metrics.totalEmails).toBe(2);
        expect(s2.metrics.accuracy).toBe(50);
    });
});
