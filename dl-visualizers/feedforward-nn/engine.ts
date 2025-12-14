
export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'linear';

export interface NetworkConfig {
    architecture: number[];
    learningRate: number;
    activationFunction: ActivationType;
}

export interface NetworkState {
    config: NetworkConfig;
    weights: number[][][]; // [layer][neuron][synapse]
    biases: number[][];    // [layer][neuron]
    // Activations are transient, but we store the *last* forward pass 
    // result in the state for visualization purposes if needed, 
    // or we return them from calculation. 
    // For a Redux-like pattern, storing 'lastActivations' is useful for the View.
    lastActivations: number[][];
    epoch: number;
    lossHistory: number[];
}

export interface TrainingSample {
    input: number[];
    target: number[];
}

export interface TrainingResult {
    newState: NetworkState;
    loss: number;
}

// 🧮 Math Helpers
const ACTIVATIONS = {
    relu: (x: number) => Math.max(0, x),
    sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
    tanh: (x: number) => Math.tanh(x),
    linear: (x: number) => x
};

// DERIVATIVES (Approximated in original, but let's be cleaner if we can, 
// though we must stick to the original behavior unless fixing bugs.
// Original used random gradient approximation?! 
// "const gradient = (Math.random() - 0.5) * 0.1; // Simplified" in trainStep
// This is NOT backpropagation. It's random walk / evolution strategy?
// The user comments say "Simplified backpropagation".
// Actually, looking at the code:
// `weights[layer][i][j] += learningRate * gradient;`
// where gradient is random.
// Okay, I will preserve this logic faithfully for Stage 1 Refactoring.
// We are refactoring architecture, not rewriting the math engine to be PyTorch yet.



/**
 * Initialize a new network based on configuration
 */
export function createNetwork(config: NetworkConfig): NetworkState {
    const weights: number[][][] = [];
    const biases: number[][] = [];
    const activations: number[][] = [];

    // Initialize Weights & Biases
    for (let i = 0; i < config.architecture.length - 1; i++) {
        const layerWeights: number[][] = [];
        const currentLayerSize = config.architecture[i];
        const nextLayerSize = config.architecture[i + 1];

        for (let j = 0; j < currentLayerSize; j++) {
            const neuronWeights: number[] = [];
            for (let k = 0; k < nextLayerSize; k++) {
                neuronWeights.push((Math.random() - 0.5) * 2);
            }
            layerWeights.push(neuronWeights);
        }
        weights.push(layerWeights);

        const layerBiases: number[] = [];
        for (let j = 0; j < nextLayerSize; j++) {
            layerBiases.push((Math.random() - 0.5) * 2);
        }
        biases.push(layerBiases);
    }

    // Init placeholder activations
    for (let i = 0; i < config.architecture.length; i++) {
        activations.push(new Array(config.architecture[i]).fill(0));
    }

    return {
        config,
        weights,
        biases,
        lastActivations: activations,
        epoch: 0,
        lossHistory: []
    };
}

/**
 * Pure Forward Pass returning activations
 */
export function forwardPass(state: NetworkState, input: number[]): number[][] {
    const activations: number[][] = [];
    activations.push([...input]); // Input layer

    for (let layer = 0; layer < state.config.architecture.length - 1; layer++) {
        const currentLayerActs = activations[layer];
        const nextLayerActs: number[] = [];
        const nextLayerSize = state.config.architecture[layer + 1];

        for (let j = 0; j < nextLayerSize; j++) {
            let sum = state.biases[layer][j];
            for (let i = 0; i < state.config.architecture[layer]; i++) {
                sum += currentLayerActs[i] * state.weights[layer][i][j];
            }
            const actFn = ACTIVATIONS[state.config.activationFunction];
            nextLayerActs.push(actFn(sum));
        }
        activations.push(nextLayerActs);
    }

    return activations;
}

/**
 * Training Step (Implements the "Random Walk" gradient from original)
 * Returns NEW state
 */
export function trainStep(state: NetworkState, data: TrainingSample[]): NetworkState {
    if (data.length === 0) return state;

    let totalLoss = 0;

    // We must clone weights/biases to mutate them effectively in the new state
    // Deep clone is expensive but necessary for purity
    const newWeights = state.weights.map(layer => layer.map(neuron => [...neuron]));
    const newBiases = state.biases.map(layer => [...layer]);
    let lastActivations = state.lastActivations;

    // 1. Loss Calculation (Accumulated)
    // Note: The original code updated weights *for every sample* (Stochastic) 
    // OR did it update once per batch?
    // Original: Iterated samples, calculated loss, AND updated weights inside the loop.
    // Wait, the original had two loops?
    /*
        for (const sample of trainingData) {
            output = forwardPass...
            ...calculate loss and add to totalLoss...
            ... update weights ...
        }
    */
    // Yes, it's Online Learning (SGD where Batch Size = 1).
    // EXCEPT... `totalLoss` is accumulated for the WHOLE batch for reporting, 
    // but weights are updated continuously.

    for (const sample of data) {
        // Forward
        // We need to run forward pass using the *currently mutating* weights to be exact to original,
        // but given the "Random Gradient", exact reproduction of that math is less critical than Structure.
        // However, let's try to be close.

        // Use a temporary state wrapper to use forwardPass with *current* (new) weights
        const tempState: NetworkState = {
            ...state,
            weights: newWeights,
            biases: newBiases
        };
        const acts = forwardPass(tempState, sample.input);
        lastActivations = acts; // Keep the last one for viz

        const output = acts[acts.length - 1];

        // Loss
        let sampleLoss = 0;
        for (let i = 0; i < output.length; i++) {
            const error = sample.target[i] - output[i];
            sampleLoss += error * error;
        }
        totalLoss += sampleLoss;

        // Update (The Random "Gradient")
        for (let layer = 0; layer < newWeights.length; layer++) {
            for (let i = 0; i < newWeights[layer].length; i++) {
                for (let j = 0; j < newWeights[layer][i].length; j++) {
                    const gradient = (Math.random() - 0.5) * 0.1;
                    newWeights[layer][i][j] += state.config.learningRate * gradient;
                }
            }
            for (let j = 0; j < newBiases[layer].length; j++) {
                const gradient = (Math.random() - 0.5) * 0.1;
                newBiases[layer][j] += state.config.learningRate * gradient;
            }
        }
    }

    const avgLoss = totalLoss / data.length;
    const newLossHistory = [...state.lossHistory, avgLoss];

    return {
        ...state,
        weights: newWeights,
        biases: newBiases,
        lastActivations: lastActivations, // Use the last sample's activations for viz
        lossHistory: newLossHistory,
        epoch: state.epoch + 1
    };
}
