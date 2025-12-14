
import { describe, it, expect } from 'vitest';
import { checkAnswer, calculateAccuracy, INITIAL_STATE, SCENARIOS } from './engine.js';

describe('Misleading Graphs Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.currentGraphIndex).toBe(0);
        expect(INITIAL_STATE.totalAnalyzed).toBe(0);
    });

    it('should calculate perfect score correctly', () => {
        const scenario = SCENARIOS[0]; // Truncated Y-Axis, Exaggerated Visual Size
        const selected = new Set(['Truncated Y-Axis', 'Exaggerated Visual Size']);

        const result = checkAnswer(INITIAL_STATE, scenario, selected);

        expect(result.pointsEarned).toBe(100);
        expect(result.isPerfect).toBe(true);
        expect(result.newState.score).toBe(100);
        expect(result.newState.totalPerfect).toBe(1);
    });

    it('should calculate partial score correctly', () => {
        const scenario = SCENARIOS[0]; // Has 2 issues
        const selected = new Set(['Truncated Y-Axis']); // Found 1 of 2

        // 1 found. 1 missed. 1 >= 1. Should be 50.
        const result = checkAnswer(INITIAL_STATE, scenario, selected);

        expect(result.pointsEarned).toBe(50);
        expect(result.isPerfect).toBe(false);
        expect(result.newState.score).toBe(50);
        expect(result.newState.totalPerfect).toBe(0);
    });

    it('should calculate incorrect score correctly', () => {
        const scenario = SCENARIOS[0];
        const selected = new Set(['Wrong Chart Type']); // Incorrect

        const result = checkAnswer(INITIAL_STATE, scenario, selected);

        expect(result.pointsEarned).toBe(0);
        expect(result.isPerfect).toBe(false);
        expect(result.newState.score).toBe(0);
    });

    it('should calculate accuracy correctly', () => {
        expect(calculateAccuracy(4, 5)).toBe(80);
        expect(calculateAccuracy(0, 5)).toBe(0);
        expect(calculateAccuracy(5, 5)).toBe(100);
        expect(calculateAccuracy(0, 0)).toBe(0);
    });
});
