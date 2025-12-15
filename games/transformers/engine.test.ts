
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, startGame, checkAnswer, nextQuestion, SENTENCES
} from './engine.js';

describe('Transformers Game Engine', () => {
    it('should initialize correctly', () => {
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.sentences.length).toBeGreaterThan(0);
    });

    it('should start game', () => {
        let state = { ...INITIAL_STATE };
        state = startGame();
        expect(state.gameActive).toBe(true);
    });

    it('should handle correct answer', () => {
        let state = startGame();
        const sentenceIdx = Math.floor(state.currentQuestionIndex / 2);
        const questionIdx = state.currentQuestionIndex % 2;
        const correctIdx = SENTENCES[sentenceIdx].questions[questionIdx].answer;

        const { newState, isCorrect, points } = checkAnswer(state, correctIdx);

        expect(isCorrect).toBe(true);
        expect(points).toBeGreaterThan(0);
        expect(newState.score).toBeGreaterThan(0);
        expect(newState.answered).toBe(true);
    });

    it('should handle incorrect answer', () => {
        let state = startGame();
        const sentenceIdx = Math.floor(state.currentQuestionIndex / 2);
        const questionIdx = state.currentQuestionIndex % 2;
        const correctIdx = SENTENCES[sentenceIdx].questions[questionIdx].answer;
        const wrongIdx = correctIdx === 0 ? 1 : 0; // Pick a different index

        const { newState, isCorrect, points } = checkAnswer(state, wrongIdx);

        expect(isCorrect).toBe(false);
        expect(points).toBe(0);
        expect(newState.score).toBe(0);
        expect(newState.streak).toBe(0);
    });

    it('should advance question', () => {
        let state = startGame();
        // Simulate answering
        state = checkAnswer(state, 0).newState;

        const nextState = nextQuestion(state);
        expect(nextState.currentQuestionIndex).toBe(state.currentQuestionIndex + 1);
        expect(nextState.answered).toBe(false);
    });
});
