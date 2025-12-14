
import { describe, it, expect } from 'vitest';
import { checkAnswer, calculateAccuracy, PATTERNS, INITIAL_STATE, GameState } from './engine.js';

describe('CNN Game Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.isActive).toBe(false);
    });

    it('should calculate score correctly for correct answer', () => {
        const pattern = PATTERNS[0]; // Vertical Lines, filter: vertical
        const state: GameState = { ...INITIAL_STATE, currentPattern: pattern };

        const result = checkAnswer(state, 'vertical');

        expect(result.isCorrect).toBe(true);
        expect(result.points).toBe(10);
        expect(result.newState.score).toBe(10);
        expect(result.newState.streak).toBe(1);
    });

    it('should calculate score correctly for incorrect answer', () => {
        const pattern = PATTERNS[0];
        const state: GameState = { ...INITIAL_STATE, currentPattern: pattern, score: 50, streak: 5 };

        const result = checkAnswer(state, 'horizontal'); // Wrong

        expect(result.isCorrect).toBe(false);
        expect(result.points).toBe(0);
        expect(result.newState.score).toBe(50); // No points added
        expect(result.newState.streak).toBe(0); // Streak reset
    });

    it('should add bonus points for streak >= 3', () => {
        const pattern = PATTERNS[0];
        const state: GameState = { ...INITIAL_STATE, currentPattern: pattern, streak: 3 }; // Already 3

        // This will be the 4th correct
        const result = checkAnswer(state, 'vertical');

        expect(result.points).toBe(15); // 10 base + 5 bonus
        expect(result.newState.streak).toBe(4);
    });

    it('should calculate accuracy correctly', () => {
        expect(calculateAccuracy(10, 0)).toBe(100);
        expect(calculateAccuracy(5, 5)).toBe(50);
        expect(calculateAccuracy(0, 10)).toBe(0);
        expect(calculateAccuracy(0, 0)).toBe(0);
    });
});
