
import { describe, it, expect } from 'vitest';
import {
    simulateEncoding, simulateReconstruction, calculateMSE,
    generateLatentPoints, updateStateWithSample, INITIAL_STATE, SAMPLES
} from './engine.js';

describe('Autoencoder Engine', () => {
    it('should simulate encoding', () => {
        const code = simulateEncoding(4);
        expect(code).toHaveLength(4);
    });

    it('should simulate reconstruction', () => {
        const sample = SAMPLES.digit[0];
        const reconstructed = simulateReconstruction(sample);
        expect(reconstructed.length).toBe(sample.length);
        expect(reconstructed[0].length).toBe(sample[0].length);
    });

    it('should calculate MSE', () => {
        // const sample = [[1, 1], [0, 0]]; // unused
        // Wait, function depends on GRID_SIZE constant which is 8. 
        // We should test with a proper 8x8 grid or mock the calculation if generic.
        // Let's use a real sample from constants
        const s1 = SAMPLES.digit[0];
        const s2 = SAMPLES.digit[0]; // same
        const mse = calculateMSE(s1, s2);
        expect(mse).toBe(0);
    });

    it('should update state with sample', () => {
        const state = { ...INITIAL_STATE };
        const newState = updateStateWithSample(state, 'digit', 0);
        expect(newState.currentCategory).toBe('digit');
        expect(newState.currentIndex).toBe(0);
        expect(newState.currentSample).toBeDefined();
        expect(newState.reconstructedSample).toBeDefined();
    });

    it('should generate latent points', () => {
        const points = generateLatentPoints(SAMPLES);
        expect(points.length).toBeGreaterThan(0);
        expect(points[0]).toHaveProperty('x');
        expect(points[0]).toHaveProperty('y');
    });
});
