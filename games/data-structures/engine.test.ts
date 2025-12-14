
import { describe, it, expect } from 'vitest';
import { checkAnswer, INITIAL_STATE, SCENARIOS } from './engine.js';

describe('Data Structures Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.currentScenarioIndex).toBe(0);
        expect(INITIAL_STATE.perfectAnswers).toBe(0);
    });

    it('should handle correct (best) answer', () => {
        const scenario = SCENARIOS[0]; // Best: list
        const state = { ...INITIAL_STATE };

        const result = checkAnswer(state, scenario, 'list');

        expect(result.isBest).toBe(true);
        expect(result.points).toBe(100);
        expect(result.newState.score).toBe(100);
        expect(result.newState.perfectAnswers).toBe(1);
    });

    it('should handle acceptable answer', () => {
        // Find a scenario with acceptable alternatives.
        // Scenario 2 (User Profile): Best: dictionary, Acceptable: dictionary, table.
        const scenario = SCENARIOS[2];
        const state = { ...INITIAL_STATE };

        const result = checkAnswer(state, scenario, 'table');

        expect(result.isBest).toBe(false);
        expect(result.isAcceptable).toBe(true);
        expect(result.points).toBe(60);
        expect(result.newState.score).toBe(60);
        expect(result.newState.perfectAnswers).toBe(0); // Not perfect
    });

    it('should handle incorrect answer', () => {
        const scenario = SCENARIOS[0];
        const state = { ...INITIAL_STATE };

        const result = checkAnswer(state, scenario, 'graph');

        expect(result.isBest).toBe(false);
        expect(result.isAcceptable).toBe(false);
        expect(result.points).toBe(0);
        expect(result.newState.score).toBe(0);
    });
});
