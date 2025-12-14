
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, getRandomReview, processClassification, processChallengeRound
} from './engine.js';

describe('NLP Game Engine', () => {
    it('should get random review', () => {
        const review = getRandomReview();
        expect(review).toBeDefined();
        // Since we import values, we just check existence
        expect(['positive', 'negative', 'neutral']).toContain(review.sentiment);
        expect(review.text.length).toBeGreaterThan(0);
    });

    it('should process classification correctly', () => {
        const state = { ...INITIAL_STATE, currentReview: { text: 'test', sentiment: 'positive' as const } };

        // Correct guess
        const res1 = processClassification(state, 'positive');
        expect(res1.correct).toBe(true);
        expect(res1.newState.score).toBeGreaterThan(state.score);
        expect(res1.newState.streak).toBe(1);

        // Incorrect guess
        const res2 = processClassification(state, 'negative');
        expect(res2.correct).toBe(false);
        expect(res2.newState.streak).toBe(0);
    });

    it('should process challenge round logic', () => {
        const state = { ...INITIAL_STATE, currentReview: { text: 'test', sentiment: 'positive' as const } };

        // User win (user correct, ai wrong)
        const resWin = processChallengeRound(state, 'positive', false);
        expect(resWin.result).toBe('win');
        expect(resWin.newState.yourWins).toBe(1);
        expect(resWin.newState.aiWins).toBe(0);

        // AI win (user wrong, ai correct)
        const resLoss = processChallengeRound(state, 'negative', true);
        expect(resLoss.result).toBe('loss');
        expect(resLoss.newState.yourWins).toBe(0);
        expect(resLoss.newState.aiWins).toBe(1);

        // Tie
        const resTie = processChallengeRound(state, 'positive', true);
        expect(resTie.result).toBe('tie');
    });
});
