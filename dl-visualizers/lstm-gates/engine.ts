
export interface LSTMState {
    cellStateSize: number;
    cellState: number[];
    hiddenState: number[];

    // History for visualization
    forgetGateHistory: number[][];
    inputGateHistory: number[][];
    outputGateHistory: number[][];
    cellStateHistory: number[][];
    hiddenStateHistory: number[][];

    currentStep: number;
    sequence: string[];
    isProcessing: boolean;
}

export const EXAMPLE_TASKS = [
    "Remember first: HELLO then lots of text",
    "ABC ABC DEF DEF",
    "101 202 303 404",
    "START main task END"
];

export const INITIAL_STATE: LSTMState = {
    cellStateSize: 8,
    cellState: [],
    hiddenState: [],
    forgetGateHistory: [],
    inputGateHistory: [],
    outputGateHistory: [],
    cellStateHistory: [],
    hiddenStateHistory: [],
    currentStep: 0,
    sequence: [],
    isProcessing: false
};

// Math helpers
export function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

export function tanh(x: number): number {
    return Math.tanh(x);
}

export function vectorNorm(vec: number[]): number {
    return Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
}

export function initializeLSTM(size: number): LSTMState {
    return {
        ...INITIAL_STATE,
        cellStateSize: size,
        cellState: new Array(size).fill(0),
        hiddenState: new Array(size).fill(0)
    };
}

export function tokenize(text: string): string[] {
    // Simple char-level tokenization, limited length
    // const tokens = text.split(''); // Too fine grained?
    // Original used simple char loop
    const tokens: string[] = [];
    for (let i = 0; i < text.length && i < 15; i++) {
        tokens.push(text[i]);
    }
    return tokens;
}

export function processStep(state: LSTMState, token: string): LSTMState {
    const { cellStateSize, hiddenState, cellState } = state;
    const tokenValue = token.charCodeAt(0) / 128.0; // Normalize

    // Simulation of LSTM logic (randomized weights for demo purposes)
    const forgetGate = new Array(cellStateSize).fill(0);
    const inputGate = new Array(cellStateSize).fill(0);
    const candidateCell = new Array(cellStateSize).fill(0);
    const outputGate = new Array(cellStateSize).fill(0);

    const newCellState = [...cellState];
    const newHiddenState = new Array(cellStateSize).fill(0);

    // Compute Gates
    for (let i = 0; i < cellStateSize; i++) {
        // Forget Gate
        // Bias towards forgetting if random inputs
        const fInput = tokenValue * 0.5 + hiddenState[i] * 0.3 + Math.random() * 0.2 - 0.1;
        forgetGate[i] = sigmoid(fInput);

        // Input Gate
        const iInput = tokenValue * 0.7 + hiddenState[i] * 0.2 + Math.random() * 0.1;
        inputGate[i] = sigmoid(iInput);

        // Candidate Cell State
        candidateCell[i] = tanh(tokenValue * 0.8 + hiddenState[i] * 0.4 + (Math.random() - 0.5) * 0.3);

        // Update Cell State: C_t = f_t * C_{t-1} + i_t * \tilde{C}_t
        newCellState[i] = newCellState[i] * forgetGate[i] + inputGate[i] * candidateCell[i];

        // Output Gate
        const oInput = tokenValue * 0.6 + hiddenState[i] * 0.3 + newCellState[i] * 0.1;
        outputGate[i] = sigmoid(oInput);

        // Update Hidden State: h_t = o_t * tanh(C_t)
        newHiddenState[i] = outputGate[i] * tanh(newCellState[i]);
    }

    return {
        ...state,
        cellState: newCellState,
        hiddenState: newHiddenState,
        forgetGateHistory: [...state.forgetGateHistory, forgetGate],
        inputGateHistory: [...state.inputGateHistory, inputGate],
        outputGateHistory: [...state.outputGateHistory, outputGate],
        cellStateHistory: [...state.cellStateHistory, newCellState],
        hiddenStateHistory: [...state.hiddenStateHistory, newHiddenState],
        currentStep: state.currentStep + 1
    };
}
