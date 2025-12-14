
import { describe, it, expect } from 'vitest';
import {
    sigmoid, tanh, processStep, initializeLSTM
} from './engine.js';

describe('LSTM Engine', () => {

    it('should compute activation functions', () => {
        expect(sigmoid(0)).toBe(0.5);
        expect(tanh(0)).toBe(0);
    });

    it('should initialize state', () => {
        const state = initializeLSTM(8);
        expect(state.cellState.length).toBe(8);
        expect(state.hiddenState.length).toBe(8);
        expect(state.currentStep).toBe(0);
    });

    it('should step through processing', () => {
        let state = initializeLSTM(4);
        state = processStep(state, 'A');

        expect(state.currentStep).toBe(1);
        expect(state.cellStateHistory.length).toBe(1);
        expect(state.forgetGateHistory[0].length).toBe(4);

        // Value checks
        // Sigmoid outputs should be 0-1
        state.forgetGateHistory[0].forEach(v => {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        });

        // Tanh outputs -1 to 1 (but cell state can grow unbounded in theory, usually damped)
        // Hidden state uses tanh(cell) * sigmoid, so it should be -1 to 1
        state.hiddenState.forEach(v => {
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });
    });
});
