
import { describe, it, expect } from 'vitest';
import {
    calculateRatingResult, updateGameState, getRiskLabelColor, INITIAL_STATE
} from './engine.js';

describe('Ethical AI Engine', () => {
    it('should calculate rating result correctly (perfect match)', () => {
        const result = calculateRatingResult(50, 50);
        expect(result.difference).toBe(0);
        expect(result.accuracy).toBe(100);
        expect(result.points).toBe(1000);
    });

    it('should calculate rating result correctly (mismatch)', () => {
        const result = calculateRatingResult(0, 100);
        expect(result.difference).toBe(100);
        expect(result.accuracy).toBe(0);
        expect(result.points).toBe(0);
    });

    it('should calculate rating result correctly (partial)', () => {
        const result = calculateRatingResult(40, 50);
        expect(result.difference).toBe(10);
        expect(result.accuracy).toBe(90);
        expect(result.points).toBe(900);
    });

    it('should update game state correctly', () => {
        const result = {
            userRating: 50,
            expertRating: 50,
            difference: 0,
            accuracy: 100,
            points: 1000,
            riskLevel: 'MEDIUM' as const
        };

        const newState = updateGameState(INITIAL_STATE, result);
        expect(newState.totalScore).toBe(1000);
        expect(newState.accuracySum).toBe(100);
        expect(newState.bestRating).toBe(100);
    });

    it('should return correct risk label colors', () => {
        expect(getRiskLabelColor(10).text).toBe('LOW RISK');
        expect(getRiskLabelColor(50).text).toBe('MEDIUM RISK');
        expect(getRiskLabelColor(90).text).toBe('HIGH RISK');
    });
});
