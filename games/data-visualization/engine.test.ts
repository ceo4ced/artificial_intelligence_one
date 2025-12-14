
import { describe, it, expect } from 'vitest';
import { checkAnswer, INITIAL_STATE, SCENARIOS } from './engine.js';

describe('Data Visualization Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.totalAnswered).toBe(0);
        expect(INITIAL_STATE.totalCorrect).toBe(0);
    });

    it('should handle correct answer', () => {
        const state = { ...INITIAL_STATE };
        const scenarioIndex = 0;
        const questionIndex = 0;
        const answerIndex = 0; // In the first scenario (Study Time), first answer is correct

        const result = checkAnswer(state, scenarioIndex, questionIndex, answerIndex);

        expect(result.isCorrect).toBe(true);
        expect(result.newState.score).toBe(100);
        expect(result.newState.totalCorrect).toBe(1);
        expect(result.newState.totalAnswered).toBe(1);
    });

    it('should handle incorrect answer', () => {
        const state = { ...INITIAL_STATE };
        const scenarioIndex = 0;
        const questionIndex = 0;
        const answerIndex = 1; // Incorrect

        const result = checkAnswer(state, scenarioIndex, questionIndex, answerIndex);

        expect(result.isCorrect).toBe(false);
        expect(result.newState.score).toBe(0);
        expect(result.newState.totalCorrect).toBe(0);
        expect(result.newState.totalAnswered).toBe(1);
    });

    it('should generate data points for scenarios', () => {
        expect(SCENARIOS.length).toBeGreaterThan(0);
        expect(SCENARIOS[0].data.length).toBeGreaterThan(0);
        expect(SCENARIOS[0].data[0]).toHaveProperty('x');
        expect(SCENARIOS[0].data[0]).toHaveProperty('y');
    });
});
