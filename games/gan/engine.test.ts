
import { describe, it, expect } from 'vitest';
import {
    startGameState, nextRoundState, processChoice, tickTimer, INITIAL_STATE
} from './engine.js';

describe('GAN Game Engine', () => {
    it('should initialize start state', () => {
        const state = startGameState('hard');
        expect(state.gameActive).toBe(true);
        expect(state.difficulty).toBe('hard');
        expect(state.timeLeft).toBe(60);
    });

    it('should proceed to next round', () => {
        const state = startGameState();
        const next = nextRoundState(state);

        expect(next.round).toBe(1);
        expect(next.currentPatternParams).not.toBeNull();
        expect(next.answered).toBe(false);
    });

    it('should process correct choice', () => {
        let state = startGameState();
        state = nextRoundState(state);
        // Force answer
        state.currentAnswer = 'real';

        const afterChoice = processChoice(state, 'real');
        expect(afterChoice.score).toBe(10);
        expect(afterChoice.correct).toBe(1);
        expect(afterChoice.wrong).toBe(0);
        expect(afterChoice.answered).toBe(true);
    });

    it('should process wrong choice', () => {
        let state = startGameState();
        state = nextRoundState(state);
        state.currentAnswer = 'real';

        const afterChoice = processChoice(state, 'fake');
        expect(afterChoice.score).toBe(0);
        expect(afterChoice.correct).toBe(0);
        expect(afterChoice.wrong).toBe(1);
    });

    it('should tick timer', () => {
        let state = startGameState();
        state = tickTimer(state);
        expect(state.timeLeft).toBe(59);

        // Timeout
        state.timeLeft = 1;
        state = tickTimer(state);
        expect(state.timeLeft).toBe(0);
        expect(state.gameActive).toBe(false);
    });
});
