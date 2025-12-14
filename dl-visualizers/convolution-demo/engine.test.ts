
import { describe, it, expect } from 'vitest';
import {
    createEmptyImage, generateImage, initializeState,
    applyConvolutionPatch, calculateNextStep,
    FILTERS, GRID_SIZE
} from './engine.js';

describe('Convolution Demo Engine', () => {

    it('should create an empty image of correct size', () => {
        const img = createEmptyImage(10);
        expect(img.length).toBe(10);
        expect(img[0].length).toBe(10);
        expect(img[0][0]).toBe(0);
    });

    it('should generate predefined images', () => {
        const shapes = generateImage('shapes');
        expect(shapes.length).toBe(GRID_SIZE);
        // Center should have content (255)
        expect(shapes[10][10]).toBe(255);
    });

    it('should initialize state correctly', () => {
        const state = initializeState('grid');
        expect(state.inputImage[5][5]).toBe(255);
        expect(state.currentFilter).toEqual(FILTERS.edge_vertical);
        expect(state.currentRow).toBe(0);
        expect(state.currentCol).toBe(0);
    });

    it('should calculate convolution patch correctly', () => {
        // Simple 3x3 image of 1s
        const img = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ];
        // Identity filter (center only)
        const filter = [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ];

        const val = applyConvolutionPatch(img, filter, 0, 0);
        expect(val).toBe(1); // 1*1 = 1

        // Edge case: sum exceeds 255
        const brightImg = [
            [100, 100, 100],
            [100, 100, 100],
            [100, 100, 100]
        ];
        const boostFilter = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ]; // Sum = 900

        const clamped = applyConvolutionPatch(brightImg, boostFilter, 0, 0);
        expect(clamped).toBe(255);
    });

    it('should advance steps correctly', () => {
        let state = initializeState();
        state.stride = 2;

        // Step 1: (0, 0)
        state = calculateNextStep(state);
        // Step 2: (0, 2) ? Wait, logic is "calculate THEN increment"
        // Let's check implementation behavior
        // calculateNextStep takes state, computes map[row][col], then increments row/col
        // So returned state has NEW row/col

        expect(state.currentCol).toBe(2);

        // Advance until row change
        // GRID_SIZE=15. max index for 3x3 filter is 12.
        // 0, 2, 4, 6, 8, 10, 12 -> next is 0, row+2

        // Let's jump ahead
        state.currentCol = 12;
        state = calculateNextStep(state);
        expect(state.currentCol).toBe(0);
        expect(state.currentRow).toBe(2);
    });
});
