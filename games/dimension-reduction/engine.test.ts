
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, CHALLENGES, calculateReduction
} from './engine.js';

describe('Dimension Reduction Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.currentChallengeIndex).toBe(0);
    });

    it('should calculate reduction score correctly (optimal)', () => {
        const challenge = CHALLENGES[0]; // [85, 90, 45], target 2
        // Optimal: 90, 85 (indices 1, 0)
        const selected = new Set([0, 1]);

        const result = calculateReduction(challenge, selected);

        // Max possible: 85+90+45 = 220
        // Preserved: 85+90 = 175
        // Optimal: 175
        // Efficiency: 100%
        expect(result.efficiency).toBe(100);
        expect(result.points).toBe(100);
        expect(result.isOptimal).toBe(true);
    });

    it('should calculate reduction score correctly (suboptimal)', () => {
        const challenge = CHALLENGES[0]; // [85, 90, 45], target 2
        // Suboptimal: 90, 45 (indices 1, 2)
        const selected = new Set([1, 2]);

        const result = calculateReduction(challenge, selected);

        // Preserved: 90+45 = 135
        // Optimal: 175
        // Efficiency: 135/175 = 77.1%
        expect(result.efficiency).toBeCloseTo(77.1, 1);
        // Points for 77% (>=75) is 60
        expect(result.points).toBe(60);
        expect(result.isOptimal).toBe(false);
    });
});
