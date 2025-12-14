
import { describe, it, expect } from 'vitest';
import {
    processAnswer, generateCorrelatedPoints, formatValue, INITIAL_STATE, SCENARIOS
} from './engine.js';

describe('Data Science Intro Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.correctCount).toBe(0);
        expect(INITIAL_STATE.currentScenarioIndex).toBe(0);
    });

    it('should process correct answer correctly', () => {
        const scenario = SCENARIOS[0];
        const correctType = scenario.correct;

        const result = processAnswer(INITIAL_STATE, correctType, scenario);

        expect(result.isCorrect).toBe(true);
        expect(result.newState.score).toBe(100);
        expect(result.newState.correctCount).toBe(1);
    });

    it('should process incorrect answer correctly', () => {
        const scenario = SCENARIOS[0];
        const incorrectType = "wrong_type";

        const result = processAnswer(INITIAL_STATE, incorrectType, scenario);

        expect(result.isCorrect).toBe(false);
        expect(result.newState.score).toBe(0);
        expect(result.newState.correctCount).toBe(0);
    });

    it('should format values correctly', () => {
        expect(formatValue(1500000)).toBe('1.5M');
        expect(formatValue(2500)).toBe('3K'); // The implementation was toFixed(0) which rounds
        expect(formatValue(500)).toBe('500');
    });

    it('should generate correlated data points', () => {
        const points = generateCorrelatedPoints(10, 0.5);
        expect(points.length).toBe(10);
        expect(points[0]).toHaveProperty('x');
        expect(points[0]).toHaveProperty('y');
    });
});
