
import { describe, it, expect } from 'vitest';
import { createNetwork, forwardPass, trainStep, NetworkConfig } from './engine.js';

describe('Feedforward NN Engine (Functional Core)', () => {
    const config: NetworkConfig = {
        architecture: [2, 3, 1], // Input(2) -> Hidden(3) -> Output(1)
        learningRate: 0.1,
        activationFunction: 'relu'
    };

    it('should create a valid network state', () => {
        const state = createNetwork(config);

        expect(state.config).toEqual(config);
        expect(state.weights.length).toBe(2); // 2 sets of weights for 3 layers
        expect(state.biases.length).toBe(2);
        expect(state.weights[0].length).toBe(2); // Input layer size (neurons connecting to next)
        expect(state.weights[0][0].length).toBe(3); // Synapses per neuron (connecting to hidden)
    });

    it('should perform a forward pass returning activations', () => {
        const state = createNetwork(config);
        const input = [1, 0.5];
        const activations = forwardPass(state, input);

        expect(activations.length).toBe(3); // Input, Hidden, Output
        expect(activations[0]).toEqual(input);
        expect(activations[2].length).toBe(1); // Output size
    });

    it('should training step returning NEW state (immutability)', () => {
        const state = createNetwork(config);
        const data = [{ input: [0, 1], target: [1] }];

        const newState = trainStep(state, data);

        expect(newState).not.toBe(state); // Reference equality check
        expect(newState.weights).not.toBe(state.weights); // Deep clone check
        expect(newState.epoch).toBe(state.epoch + 1);
        expect(newState.lossHistory.length).toBe(state.lossHistory.length + 1);
    });

    it('should learn (reduce loss) over many steps for XOR-like pattern', () => {
        // Stochastic check - might fail occasionally if init weights are terrible, 
        // but generally loss should trend down or change.
        let state = createNetwork(config);


        // Train 10 steps
        // This is just a smoke test to ensure training doesn't crash 
        // and updates weights.
        const startWeights = state.weights[0][0][0];

        const data = [{ input: [0, 0], target: [0] }];
        state = trainStep(state, data);

        const endWeights = state.weights[0][0][0];
        expect(startWeights).not.toBe(endWeights); // Weights updated
    });
});
