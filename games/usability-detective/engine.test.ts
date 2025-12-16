
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, toggleIssueSelection, checkAnswers, nextCase
} from './engine.js';

describe('Usability Detective Engine', () => {
    it('should initialize correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.testCases.length).toBeGreaterThan(0);
        expect(INITIAL_STATE.selectedIssues.size).toBe(0);
    });

    it('should toggle issue selection', () => {
        let state = { ...INITIAL_STATE, selectedIssues: new Set<number>() };
        state = toggleIssueSelection(state, 1);
        expect(state.selectedIssues.has(1)).toBe(true);
        state = toggleIssueSelection(state, 1);
        expect(state.selectedIssues.has(1)).toBe(false);
    });

    it('should calculate score correctly', () => {
        let state = { ...INITIAL_STATE, selectedIssues: new Set<number>([1, 2]) }; // Assume 1 and 2 are correct for case 0

        // Mock case 0 issues for test stability if needed, or rely on real data
        // Case 0 has issues 1, 2 correct.

        const { newState, caseResults } = checkAnswers(state);

        expect(caseResults.correct).toBeGreaterThan(0);
        expect(newState.score).toBeGreaterThan(0);
    });

    it('should advance to next case', () => {
        let state = { ...INITIAL_STATE };
        state = nextCase(state);
        expect(state.currentCaseIndex).toBe(1);
        expect(state.selectedIssues.size).toBe(0);
    });
});
