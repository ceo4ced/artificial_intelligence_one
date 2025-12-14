
import { describe, it, expect } from 'vitest';
import {
    processAnswer, calculateAccuracy, SCENARIOS, INITIAL_STATE
} from './engine.js';

describe('AI Bias Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.streak).toBe(0);
        expect(INITIAL_STATE.currentScenarioIndex).toBe(0);
    });

    it('should process correct answer correctly', () => {
        const scenario = SCENARIOS[0];
        const correctType = scenario.correctAnswer;

        const result = processAnswer(INITIAL_STATE, correctType, scenario);

        expect(result.isCorrect).toBe(true);
        expect(result.newState.score).toBeGreaterThan(0);
        expect(result.newState.streak).toBe(1);
    });

    it('should process incorrect answer correctly', () => {
        const scenario = SCENARIOS[0];
        const incorrectType = "Wrong Type";

        const result = processAnswer({ ...INITIAL_STATE, streak: 5 }, incorrectType, scenario);

        expect(result.isCorrect).toBe(false);
        expect(result.newState.streak).toBe(0);
        // Score should not increase
        expect(result.newState.score).toBe(0);
    });

    it('should calculate accuracy correctly', () => {
        expect(calculateAccuracy(5, 10)).toBe(50);
        expect(calculateAccuracy(3, 3)).toBe(100);
        expect(calculateAccuracy(0, 5)).toBe(0);
        expect(calculateAccuracy(0, 0)).toBe(0);
    });
});
