
export interface Layer {
    type: 'dense' | 'dropout';
    param: number;
    id: number;
}

export interface GameState {
    layers: Layer[];
    isTraining: boolean;
    isTrained: boolean;
    trainingHistory: number[];
    score: number;
    currentEpoch: number;
    totalEpochs: number;
}

export const INITIAL_STATE: GameState = {
    layers: [],
    isTraining: false,
    isTrained: false,
    trainingHistory: [],
    score: 0,
    currentEpoch: 0,
    totalEpochs: 30
};

export function createLayer(type: 'dense' | 'dropout', param: number): Layer {
    return {
        type,
        param,
        id: Date.now() + Math.random()
    };
}

export function addLayerToState(state: GameState, layer: Layer): GameState {
    return {
        ...state,
        layers: [...state.layers, layer],
        isTrained: false,
        score: 0,
        trainingHistory: []
    };
}

export function removeLayerFromState(state: GameState, layerId: number): GameState {
    return {
        ...state,
        layers: state.layers.filter(l => l.id !== layerId),
        isTrained: false,
        score: 0,
        trainingHistory: []
    };
}

export function calculateParameters(layers: Layer[]): number {
    let prevNeurons = 784; // Input layer
    let totalParams = 0;

    layers.forEach(layer => {
        if (layer.type === 'dense') {
            totalParams += (prevNeurons * layer.param) + layer.param; // weights + biases
            prevNeurons = layer.param;
        }
        // Dropout has 0 params and doesn't change neuron count for subsequent layers structure-wise 
        // (usually it acts on the previous layer, so dense connection is still prev -> next)
    });

    // Output layer (3 classes)
    totalParams += (prevNeurons * 3) + 3;

    return totalParams;
}

export function calculateTrainingStep(state: GameState): GameState {
    const nextEpoch = state.currentEpoch + 1;
    const layerBonus = Math.min(state.layers.length * 5, 20);
    const baseAccuracy = 60 + layerBonus;
    const noise = Math.random() * 5;

    // Linear interpolation from base to 95 + noise
    let accuracy = baseAccuracy + (nextEpoch / state.totalEpochs) * (95 - baseAccuracy) + noise;
    accuracy = Math.min(98, accuracy);

    const newHistory = [...state.trainingHistory, accuracy];

    const isComplete = nextEpoch >= state.totalEpochs;

    let score = state.score;
    if (isComplete) {
        // Calculate final score
        score = Math.round(accuracy * (1 + state.layers.length * 0.1));
    }

    return {
        ...state,
        currentEpoch: nextEpoch,
        trainingHistory: newHistory,
        isTraining: !isComplete,
        isTrained: isComplete,
        score: score
    };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE };
}
