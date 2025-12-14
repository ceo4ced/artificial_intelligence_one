
import { describe, it, expect } from 'vitest';
import {
    gaussianRandom, generateData, sigmoid, trainStep, initializeGame, TRAIN_CONFIG
} from './engine';

describe('GAN Engine', () => {
    it('should generate gaussian random numbers', () => {
        const mean = 10;
        const std = 2;
        const val = gaussianRandom(mean, std);
        expect(val).toBeTypeOf('number');
        // Simple range check (statistically mostly true)
        expect(val).toBeGreaterThan(mean - 4 * std);
        expect(val).toBeLessThan(mean + 4 * std);
    });

    it('should generate data array', () => {
        const data = generateData(10, 5, 1);
        expect(data).toHaveLength(10);
        expect(data[0]).toBeTypeOf('number');
    });

    it('should calculate sigmoid correctly', () => {
        expect(sigmoid(0)).toBeCloseTo(0.5);
        expect(sigmoid(100)).toBeCloseTo(1);
        expect(sigmoid(-100)).toBeCloseTo(0);
    });

    it('should initialize game state', () => {
        const state = initializeGame();
        expect(state.epoch).toBe(0);
        expect(state.realData).toHaveLength(TRAIN_CONFIG.DATA_COUNT);
        expect(state.generatedData).toHaveLength(TRAIN_CONFIG.DATA_COUNT);
    });

    it('should process a training step', () => {
        const state = initializeGame();
        const nextState = trainStep(state);

        expect(nextState.epoch).toBe(1);
        expect(nextState.genLossHistory).toHaveLength(1);
        expect(nextState.discLossHistory).toHaveLength(1);
        // Parameters should update
        expect(nextState.genMean).not.toBe(state.genMean);
    });
});
