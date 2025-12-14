```
import { describe, it, expect } from 'vitest';
import {
    initGame, getNextSentence, checkPrediction
} from './engine.js';

describe('RNN Game Engine', () => {
    it('should initialize game state', () => {
        const state = initGame();
        expect(state.sentences.length).toBeGreaterThan(0);
        expect(state.score).toBe(0);
    });

    it('should get next sentence', () => {
        let state = initGame();
        state = getNextSentence(state);
        expect(state.currentIndex).toBe(1);
        expect(state.currentSentence).toBeDefined();
    });

    it('should calculate score correctly', () => {
        let state = initGame();
        const { newState, points, isCorrect } = checkPrediction(state, 'correct', 'correct');

        expect(isCorrect).toBe(true);
        expect(points).toBe(10);
        expect(newState.score).toBe(10);
        expect(newState.streak).toBe(1);
    });

    it('should calculate streak bonus', () => {
        let state = initGame();
        state.streak = 3;
        const { newState, points } = checkPrediction(state, 'correct', 'correct');

        expect(points).toBe(15); // 10 + 5 bonus
        expect(newState.score).toBe(15); // initial score 0 + 15
    });

    it('should reset streak on wrong answer', () => {
        let state = initGame();
        state.streak = 5;
        const { newState } = checkPrediction(state, 'wrong', 'correct');

        expect(newState.streak).toBe(0);
    });
});
