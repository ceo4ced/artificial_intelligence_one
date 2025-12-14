
import { describe, it, expect } from 'vitest';
import {
    tokenize, calculateAttentionMatrix
} from './engine.js';

describe('Attention Mechanism Engine', () => {

    it('should tokenize sentences', () => {
        const text = 'The Cat   sat.';
        const tokens = tokenize(text);
        expect(tokens).toEqual(['the', 'cat', 'sat.']);
    });

    it('should calculate NxN normalized matrix', () => {
        const words = ['a', 'b', 'c'];
        const matrix = calculateAttentionMatrix(words);

        expect(matrix.length).toBe(3);
        expect(matrix[0].length).toBe(3);

        // Sum of row should be ~1
        const sum = matrix[0].reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1);
    });

    it('should apply heuristics (self-attention)', () => {
        const words = ['hello', 'world'];
        const matrix = calculateAttentionMatrix(words);

        // Diagonal should be non-zero (self attention)
        expect(matrix[0][0]).toBeGreaterThan(0);
        expect(matrix[1][1]).toBeGreaterThan(0);
    });
});
