
import { describe, it, expect } from 'vitest';
import {
    INITIAL_STATE, addLayerToState, removeLayerFromState, createLayer,
    calculateParameters, calculateTrainingStep
} from './engine.js';

describe('Deep Learning Engine', () => {
    it('should initialize state correctly', () => {
        expect(INITIAL_STATE.layers).toHaveLength(0);
        expect(INITIAL_STATE.score).toBe(0);
        expect(INITIAL_STATE.isTraining).toBe(false);
    });

    it('should add a layer', () => {
        const layer = createLayer('dense', 128);
        const newState = addLayerToState(INITIAL_STATE, layer);
        expect(newState.layers).toHaveLength(1);
        expect(newState.layers[0].type).toBe('dense');
    });

    it('should remove a layer', () => {
        const layer = createLayer('dense', 128);
        let state = addLayerToState(INITIAL_STATE, layer);
        state = removeLayerFromState(state, layer.id);
        expect(state.layers).toHaveLength(0);
    });

    it('should calculate parameters correctly', () => {
        // Base: 784 input, 3 output
        // If 0 hidden: Input(784) -> Output(3)? 
        // Our calc function assumes: prev=784. 
        // Loops layers. 
        // Then Output: prev*3 + 3.

        // Case 0 layers: 784*3 + 3 = 2355
        expect(calculateParameters([])).toBe(2355);

        // Case 1 Dense(128)
        // Layer 1: 784*128 + 128 = 100480
        // Output: 128*3 + 3 = 387
        // Total: 100867
        const l1 = createLayer('dense', 128);
        expect(calculateParameters([l1])).toBe(100867);
    });

    it('should calculate parameters with dropout (no params)', () => {
        // Dense(128) -> Dropout -> Output
        // Dropout shouldn't add params
        const l1 = createLayer('dense', 128);
        const l2 = createLayer('dropout', 0.5);
        expect(calculateParameters([l1, l2])).toBe(100867);
    });

    it('should advance training steps', () => {
        let state = { ...INITIAL_STATE, isTraining: true, totalEpochs: 5 };
        const l1 = createLayer('dense', 64);
        state = addLayerToState(state, l1);

        const nextState = calculateTrainingStep(state);
        expect(nextState.currentEpoch).toBe(1);
        expect(nextState.trainingHistory).toHaveLength(1);
        expect(nextState.trainingHistory[0]).toBeGreaterThan(0);
    });

    it('should finish training and calculate score', () => {
        let state = { ...INITIAL_STATE, isTraining: true, totalEpochs: 1 };
        const l1 = createLayer('dense', 64);
        state = addLayerToState(state, l1);

        // Step 1 of 1
        const nextState = calculateTrainingStep(state);
        expect(nextState.isTrained).toBe(true);
        expect(nextState.isTraining).toBe(false);
        expect(nextState.score).toBeGreaterThan(0);
    });
});
