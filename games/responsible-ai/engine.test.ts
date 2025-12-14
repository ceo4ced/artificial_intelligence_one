
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, checkJudgment, nextScenario, SCENARIOS
} from './engine.js';

describe('Responsible AI Engine', () => {
    it('should initialize correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.scenarios.length).toBeGreaterThan(0);
    });

    it('should handle correct judgment', () => {
        let state = { ...INITIAL_STATE };
        const scenario = state.scenarios[state.currentScenarioIndex];
        const { newState, isCorrect, pointsEarned } = checkJudgment(state, scenario.correctAnswer);

        expect(isCorrect).toBe(true);
        expect(pointsEarned).toBeGreaterThan(0);
        expect(newState.score).toBeGreaterThan(0);
        expect(newState.streak).toBe(1);
    });

    it('should handle incorrect judgment', () => {
        let state = { ...INITIAL_STATE };
        const scenario = state.scenarios[state.currentScenarioIndex];
        const wrongAnswer = scenario.correctAnswer === "Responsible Use" ? "Unsafe/Cheating" : "Responsible Use";

        const { newState, isCorrect, pointsEarned } = checkJudgment(state, wrongAnswer);

        expect(isCorrect).toBe(false);
        expect(pointsEarned).toBe(0);
        expect(newState.score).toBe(0);
        expect(newState.streak).toBe(0);
    });

    it('should reset streak on wrong answer', () => {
        let state = { ...INITIAL_STATE, streak: 5, score: 500 };
        const scenario = state.scenarios[state.currentScenarioIndex];
        const wrongAnswer = scenario.correctAnswer === "Responsible Use" ? "Unsafe/Cheating" : "Responsible Use";

        const { newState } = checkJudgment(state, wrongAnswer);
        expect(newState.streak).toBe(0);
    });

    it('should calculate bonus points for streak', () => {
        let state = { ...INITIAL_STATE, streak: 2 };
        const scenario = state.scenarios[state.currentScenarioIndex];

        const { pointsEarned } = checkJudgment(state, scenario.correctAnswer);
        // Base 100 + (3 * 10) = 130
        expect(pointsEarned).toBe(130);
    });

    it('should advance to next scenario', () => {
        let state = { ...INITIAL_STATE, answered: true };
        state = nextScenario(state);
        expect(state.currentScenarioIndex).toBe(1);
        expect(state.answered).toBe(false);
    });
});
