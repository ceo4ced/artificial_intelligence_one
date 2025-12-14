
import { describe, it, expect } from 'vitest';
import { initializeHiddenState, calculateHiddenStateStep, startSequence, advanceStep } from './engine.js';

describe('RNN Demo Engine (Functional Core)', () => {

    it('should initialize hidden state correctly', () => {
        const size = 8;
        const state = initializeHiddenState(size);
        expect(state.length).toBe(size);
        state.forEach(v => {
            expect(v).toBeGreaterThanOrEqual(-0.1);
            expect(v).toBeLessThanOrEqual(0.1);
        });
    });

    it('should calculate next hidden state in correct range (tanh)', () => {
        const size = 4;
        const prev = initializeHiddenState(size);
        const next = calculateHiddenStateStep('A', prev, size);

        expect(next.length).toBe(size);
        next.forEach(v => {
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });
    });

    it('should start sequence state', () => {
        const state = startSequence('HELLO', 8);
        expect(state.sequence).toEqual(['H', 'E', 'L', 'L', 'O']);
        expect(state.hiddenStates.length).toBe(1); // just init
        expect(state.currentStep).toBe(0);
        expect(state.isProcessing).toBe(true);
    });

    it('should advance step cumulatively', () => {
        let state = startSequence('HI', 4);

        // Step 1: Process 'H'
        state = advanceStep(state, 4);
        expect(state.hiddenStates.length).toBe(2);
        expect(state.currentStep).toBe(1);

        // Step 2: Process 'I'
        state = advanceStep(state, 4);
        expect(state.hiddenStates.length).toBe(3);
        expect(state.currentStep).toBe(2);

        // Step 3: Done
        state = advanceStep(state, 4);
        expect(state.hiddenStates.length).toBe(3); // No new state
        expect(state.isProcessing).toBe(false);
    });
});
