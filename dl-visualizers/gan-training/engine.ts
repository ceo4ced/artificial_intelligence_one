
// Constants
export const TRAIN_CONFIG = {
    DEFAULT_SPEED: 100,
    SPEEDS: { 1: 200, 2: 100, 3: 50 },
    REAL_DATA_MEAN: 15,
    REAL_DATA_STD: 2,
    DATA_COUNT: 200,
    BATCH_SIZE: 32,
    HISTORY_SIZE: 50
};

export interface GANState {
    epoch: number;
    isTraining: boolean;
    genMean: number;
    genStd: number;
    discAccuracy: number;
    realData: number[];
    generatedData: number[];
    genLossHistory: number[];
    discLossHistory: number[];
    genLearningRate: number;
    discLearningRate: number;
}

export const INITIAL_STATE: GANState = {
    epoch: 0,
    isTraining: false,
    genMean: 5,
    genStd: 3,
    discAccuracy: 0.5,
    realData: [],
    generatedData: [],
    genLossHistory: [],
    discLossHistory: [],
    genLearningRate: 0.001,
    discLearningRate: 0.001
};

// Pure Functions

export function gaussianRandom(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z;
}

export function generateData(count: number, mean: number, std: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
        data.push(gaussianRandom(mean, std));
    }
    return data;
}

export function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

export function trainStep(state: GANState): GANState {
    const newState = { ...state };

    // Simulate training step
    // 1. Get Samples
    const realSamples = newState.realData.slice(0, TRAIN_CONFIG.BATCH_SIZE);
    // In a real GAN, we'd generate fresh samples, but here our 'generatedData' pool is refreshed each step anyway
    const fakeSamples = generateData(TRAIN_CONFIG.BATCH_SIZE, newState.genMean, newState.genStd);

    // 2. Discriminator Step
    let correctReal = 0;
    let correctFake = 0;

    realSamples.forEach(sample => {
        // Prob discriminator thinks it's real. Simple model: distance from genMean? 
        // No, in the original code: const prob = 1 / (1 + Math.exp(-(sample - genMean)));
        // This logic is quirky (it implies discriminator knows the generator's mean?), 
        // but we'll stick to the original logic to preserve behavior.
        const prob = sigmoid(sample - newState.genMean);
        if (prob > 0.5) correctReal++;
    });

    fakeSamples.forEach(sample => {
        const prob = sigmoid(sample - newState.genMean);
        if (prob <= 0.5) correctFake++;
    });

    // Update Accuracy
    const newAccuracy = (correctReal + correctFake) / (realSamples.length + fakeSamples.length);
    newState.discAccuracy = newAccuracy;

    // Calculate Losses
    const discLoss = -Math.log(newAccuracy + 0.01);
    const genLoss = -Math.log(1 - newAccuracy + 0.01);

    // 3. Generator Step (Update Parameters)
    // Move mean towards target (15)
    // Original: const error = 15 - genMean;
    // genMean += error * genLearningRate * 100;
    const meanError = TRAIN_CONFIG.REAL_DATA_MEAN - newState.genMean;
    let newGenMean = newState.genMean + meanError * newState.genLearningRate * 100;

    // Move std towards target (2)
    const stdError = TRAIN_CONFIG.REAL_DATA_STD - newState.genStd;
    let newGenStd = newState.genStd + stdError * newState.genLearningRate * 50;

    // Constrain values
    if (newGenStd < 0.5) newGenStd = 0.5;
    if (newGenStd > 5) newGenStd = 5;
    if (newGenMean < 0) newGenMean = 0;
    if (newGenMean > 20) newGenMean = 20;

    newState.genMean = newGenMean;
    newState.genStd = newGenStd;

    // 4. Update History
    // We need to clone arrays before pushing to maintain immutability 'ideally', 
    // though for performance in animation we might just push. 
    // Let's use spread for correctness.
    const newGenHistory = [...newState.genLossHistory, genLoss];
    const newDiscHistory = [...newState.discLossHistory, discLoss];

    if (newGenHistory.length > TRAIN_CONFIG.HISTORY_SIZE) {
        newGenHistory.shift();
        newDiscHistory.shift();
    }

    newState.genLossHistory = newGenHistory;
    newState.discLossHistory = newDiscHistory;

    // Refresh generated data visualization
    newState.generatedData = generateData(TRAIN_CONFIG.DATA_COUNT, newState.genMean, newState.genStd);

    newState.epoch++;

    return newState;
}

export function initializeGame(): GANState {
    const realData = generateData(TRAIN_CONFIG.DATA_COUNT, TRAIN_CONFIG.REAL_DATA_MEAN, TRAIN_CONFIG.REAL_DATA_STD);
    const initialState = { ...INITIAL_STATE };
    initialState.realData = realData;
    initialState.generatedData = generateData(TRAIN_CONFIG.DATA_COUNT, initialState.genMean, initialState.genStd);
    return initialState;
}
