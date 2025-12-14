
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, submitAnalysis, submitQuoteMatches, submitFinalInsights, nextPhase
} from './engine.js';

describe('Persona Builder Engine', () => {
    it('should submit analysis correctly', () => {
        let state = { ...INITIAL_STATE };
        const { newState, points, valid } = submitAnalysis(state, 'Point', 'Goal', 'Behavior');

        expect(valid).toBe(true);
        expect(points).toBe(20);
        expect(newState.score).toBe(20);
        expect(newState.totalCorrect).toBe(1);
    });

    it('should reject empty analysis', () => {
        let state = { ...INITIAL_STATE };
        const { valid } = submitAnalysis(state, '', '', '');
        expect(valid).toBe(false);
    });

    it('should calculate quote matches score', () => {
        let state = { ...INITIAL_STATE, currentScenario: 0 };
        // Assuming scenario 0 has matches. Let's mock a correct match.
        // Quote 0 correct persona is 2
        const matches = [{ quoteIndex: 0, personaIndex: 2 }];
        const { newState, points, correctCount } = submitQuoteMatches(state, matches);

        expect(correctCount).toBe(1);
        expect(points).toBe(15);
        expect(newState.score).toBe(15);
    });

    it('should submit final insights', () => {
        let state = { ...INITIAL_STATE };
        const { newState, points, valid } = submitFinalInsights(state, 'Priority', 'HMW');

        expect(valid).toBe(true);
        expect(points).toBe(30);
        expect(newState.score).toBe(30);
    });

    it('should progress phase', () => {
        let state = { ...INITIAL_STATE };
        state = nextPhase(state);
        expect(state.currentPhase).toBe(1);
    });
});
