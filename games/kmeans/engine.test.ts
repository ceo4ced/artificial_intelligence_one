
import { describe, it, expect } from 'vitest';
import {
    generateSyntheticImage, countUniqueColors, initializeGame, runKMeans,
    INITIAL_STATE
} from './engine.js';

describe('K-Means Engine', () => {

    it('should generate synthetic image data', () => {
        const width = 10;
        const height = 10;
        const pixels = generateSyntheticImage('sunset', width, height);
        expect(pixels.length).toBe(100);
        expect(pixels[0].length).toBe(3);
    });

    it('should count unique colors', () => {
        const pixels: any[] = [[0, 0, 0], [255, 255, 255], [0, 0, 0]];
        expect(countUniqueColors(pixels)).toBe(2);
    });

    it('should initialize game state', () => {
        const state = initializeGame({ ...INITIAL_STATE, width: 20, height: 20 }, 'forest');
        expect(state.originalPixels.length).toBe(400);
        expect(state.currentImage).toBe('forest');
        expect(state.stats.originalColorCount).toBeGreaterThan(0);
    });

    it('should run K-Means and compress image', () => {
        // Small image for speed
        const state = initializeGame({ ...INITIAL_STATE, width: 10, height: 10 }, 'ocean');
        const nextState = runKMeans(state);

        expect(nextState.centroids.length).toBe(state.k);
        expect(nextState.compressedPixels).not.toBeNull();
        expect(nextState.compressedPixels!.length).toBe(100);
        expect(nextState.stats.compressedColorCount).toBe(state.k);
    });
});
