
export interface RNNConfig {
    hiddenSize: number;
}

export interface RNNState {
    sequence: string[];
    hiddenStates: number[][]; // Array of hidden state vectors [step][unit]
    weights: {
        w_x: number[];
        w_h: number[];
    } | null; // Simulating "weights" being implicit or explicit. 
    // In original code, weights were calculated on the fly in the loop based on index.
    // To make it "functional", we can either keep that or pre-calc.
    // Keeping on-fly is fine for this visualizer as it's "simulated".
    currentStep: number;
    isProcessing: boolean;
}

export const INITIAL_STATE: RNNState = {
    sequence: [],
    hiddenStates: [],
    weights: null,
    currentStep: 0,
    isProcessing: false
};

// Pure function to create initial zero/random state
export function initializeHiddenState(size: number): number[] {
    // Original: Math.random() * 0.2 - 0.1
    // We need this to encourage strictness. If we want pure functions, we should pass a seed or accept randomness is side-effect.
    // For a visualizer, Math.random() in the engine is acceptable if we consider "initialization" as the boundary.
    // Better: Helper function.
    return Array.from({ length: size }, () => Math.random() * 0.2 - 0.1);
}

// The core RNN cell logic
export function calculateHiddenStateStep(
    inputChar: string,
    prevHidden: number[],
    hiddenSize: number
): number[] {
    const nextHidden: number[] = [];

    // Convert input to embedding
    const inputValue = inputChar.charCodeAt(0) / 255.0;

    for (let i = 0; i < hiddenSize; i++) {
        // Original logic:
        // const w_x = (Math.sin(i + inputValue) + 1) / 2;
        // const w_h = 0.5 + Math.cos(i) * 0.3;
        // const raw = w_x * inputValue + w_h * prevHidden[i] + (Math.random() * 0.1 - 0.05);

        const w_x = (Math.sin(i + inputValue) + 1) / 2;
        const w_h = 0.5 + Math.cos(i) * 0.3;

        // Random noise in calculation? "Math.random() * 0.1 - 0.05"
        // This makes the engine non-deterministic.
        // We will preserve it for the visual effect but note it.
        const noise = Math.random() * 0.1 - 0.05;

        const raw = w_x * inputValue + w_h * prevHidden[i] + noise;
        nextHidden.push(Math.tanh(raw));
    }

    return nextHidden;
}

export function startSequence(input: string, hiddenSize: number): RNNState {
    const sequence = input.split('');
    const initialHidden = initializeHiddenState(hiddenSize);

    return {
        sequence,
        hiddenStates: [initialHidden],
        weights: null,
        currentStep: 0,
        isProcessing: true
    };
}

export function advanceStep(state: RNNState, hiddenSize: number): RNNState {
    if (state.currentStep >= state.sequence.length) {
        return { ...state, isProcessing: false };
    }

    const inputChar = state.sequence[state.currentStep];
    const prevHidden = state.hiddenStates[state.currentStep];

    // Bug fix potential: hiddenStates has index 0 (init).
    // If currentStep is 0 (processing first char), we use hiddenStates[0].
    // Result is pushed to hiddenStates[1].

    const nextHidden = calculateHiddenStateStep(inputChar, prevHidden, hiddenSize);

    return {
        ...state,
        hiddenStates: [...state.hiddenStates, nextHidden],
        currentStep: state.currentStep + 1
    };
}

// Utility to get heatmap color (extracted from original for potential engine usage, or keep in UI)
// Usually color calc is UI. Engine returns -1 to 1.
