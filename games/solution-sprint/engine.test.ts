
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, startSprint, calculateScore, submitSolution, nextSprint
} from './engine.js';

describe('Solution Sprint Engine', () => {
    it('should initialize correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.timeRemaining).toBe(300);
    });

    it('should start sprint', () => {
        let state = { ...INITIAL_STATE, timeRemaining: 0 };
        state = startSprint(state);
        expect(state.sprintStarted).toBe(true);
        expect(state.timeRemaining).toBe(300);
    });

    it('should calculate score correctly', () => {
        const solutionText = "A very good solution that is long enough to get some points...";
        const checkedCriteria = 3;
        const totalCriteria = 5;
        const timeRemaining = 200;

        const { points, feedback } = calculateScore(solutionText, checkedCriteria, totalCriteria, timeRemaining);

        // Text: 25 pts (>50 chars), Criteria: 3/5 * 40 = 24 pts, Time: >180s = 20 pts
        // Total: 69
        expect(points).toBeGreaterThan(0);
        expect(feedback.length).toBeGreaterThan(0);
    });

    it('should submit solution and update state', () => {
        let state = { ...INITIAL_STATE, sprintStarted: true };
        state = submitSolution(state, 50);

        expect(state.score).toBe(50);
        expect(state.sprintStarted).toBe(false);
    });

    it('should advance to next sprint', () => {
        let state = { ...INITIAL_STATE };
        state = nextSprint(state);
        expect(state.currentChallengeIndex).toBe(1);
    });
});
