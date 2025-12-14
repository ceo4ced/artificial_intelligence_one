
import { describe, it, expect } from 'vitest';
import {
    generatePattern, addNoise, compressDecompress, calculateQuality,
    startNewImage, applyDenoising, INITIAL_STATE
} from './engine.js';

describe('Autoencoder Game Engine', () => {
    it('should generate pattern', () => {
        const p = generatePattern();
        expect(p.length).toBe(35);
        expect(p[0].length).toBe(35);
    });

    it('should add noise', () => {
        const p = generatePattern();
        const noisy = addNoise(p);
        expect(noisy.length).toBe(35);
        // It's random, but should process
    });

    it('should compress and decompress', () => {
        const p = generatePattern();
        const output = compressDecompress(p, 5);
        expect(output.length).toBe(35);
        expect(output[0].length).toBe(35);
    });

    it('should calculate quality', () => {
        const p1 = [[1, 1], [0, 0]];
        const p2 = [[1, 1], [0, 0]];
        const q = calculateQuality(p1, p2);
        expect(q).toBe(100);

        const p3 = [[0, 0], [1, 1]];
        const q2 = calculateQuality(p1, p3);
        expect(q2).toBeLessThan(100);
    });

    it('should start new image state', () => {
        let state = { ...INITIAL_STATE };
        state = startNewImage(state);
        expect(state.originalPattern.length).toBe(35);
        expect(state.noisyPattern.length).toBe(35);
    });

    it('should apply denoising', () => {
        let state = { ...INITIAL_STATE };
        state = startNewImage(state);
        state = applyDenoising(state);

        expect(state.denoisedPattern).not.toBeNull();
        expect(state.processedCount).toBe(1);
    });
});
