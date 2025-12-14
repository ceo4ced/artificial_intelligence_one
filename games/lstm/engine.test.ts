
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, startRound, checkAnswer, generateSequence, COLORS
} from './engine.js';

describe('LSTM Game Engine', () => {
    it('should generate a sequence of colors', () => {
        const sequence = generateSequence(3);
        expect(sequence.length).toBe(3);
        expect(COLORS).toContainEqual(sequence[0]);
    });

    it('should start a round correctly', () => {
        let state = { ...INITIAL_STATE };
        state = startRound(state);
        expect(state.phase).toBe('showing');
        expect(state.currentSequence.length).toBe(state.sequenceLength);
    });

    it('should calculate points for correct answer', () => {
        let state = { ...INITIAL_STATE, phase: 'input' as const, currentSequence: generateSequence(3) };
        const correctColor = state.currentSequence[state.currentSequence.length - 1];

        const { newState, points, isCorrect } = checkAnswer(state, correctColor);

        expect(isCorrect).toBe(true);
        expect(points).toBeGreaterThan(0);
        expect(newState.score).toBeGreaterThan(0);
        expect(newState.streak).toBe(1);
    });

    it('should handle wrong answer', () => {
        let state = { ...INITIAL_STATE, phase: 'input' as const, currentSequence: generateSequence(3) };
        // Create a wrong color choice
        const correctColor = state.currentSequence[state.currentSequence.length - 1];
        const wrongColor = COLORS.find(c => c.name !== correctColor.name)!;

        const { newState, points, isCorrect } = checkAnswer(state, wrongColor);

        expect(isCorrect).toBe(false);
        expect(points).toBe(0);
        expect(newState.wrong).toBe(1);
        expect(newState.streak).toBe(0);
    });

    it('should level up after 3 correct answers', () => {
        let state = { ...INITIAL_STATE, phase: 'input' as const, currentSequence: generateSequence(3), correct: 2 };
        const correctColor = state.currentSequence[state.currentSequence.length - 1];

        const { newState } = checkAnswer(state, correctColor);

        expect(newState.level).toBe(2);
        expect(newState.sequenceLength).toBe(4);
    });
});
