
// Constants and Data
export const GRID_SIZE = 8;
export const INPUT_SIZE = 64;

export type SampleGrid = number[][];

export interface SamplesMap {
    [key: string]: SampleGrid[];
}

export const SAMPLES: SamplesMap = {
    digit: [
        // 0
        [[0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1], [1, 1, 0, 0, 0, 0, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0]],
        // 1
        [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1]],
        // 2
        [[0, 1, 1, 1, 1, 1, 0, 0], [1, 1, 0, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 1, 1, 0], [0, 0, 0, 0, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0, 0], [0, 1, 1, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1]],
        // 3
        [[1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 1, 1, 0], [0, 0, 0, 0, 1, 1, 0, 0], [0, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0, 1, 1], [1, 1, 0, 0, 0, 1, 1, 0], [0, 1, 1, 1, 1, 1, 0, 0]],
        // 4
        [[0, 0, 0, 0, 1, 1, 0, 0], [0, 0, 0, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 0, 1, 1, 0, 0], [1, 1, 0, 0, 1, 1, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 1, 1, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0]]
    ],
    shape: [
        // Square
        [[1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1]],
        // Circle
        [[0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 0, 0, 1, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 1, 0, 0, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0]],
        // Triangle
        [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 0, 0, 1, 1, 0], [0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1]],
        // Plus
        [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0]],
        // Diamond
        [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0]]
    ],
    pattern: [
        // Horizontal
        [[1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1]],
        // Vertical
        [[1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1]],
        // Diagonal /
        [[0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 1, 1, 0], [0, 0, 0, 0, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0, 0], [0, 1, 1, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0]],
        // Diagonal \
        [[1, 1, 0, 0, 0, 0, 0, 0], [0, 1, 1, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 0], [0, 0, 0, 0, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 0, 1]],
        // Checkerboard
        [[1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 0, 1], [1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 0, 1], [1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 0, 1], [1, 0, 1, 0, 1, 0, 1, 0], [0, 1, 0, 1, 0, 1, 0, 1]]
    ],
    complex: [
        // Smiley
        [[0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 0, 1, 1, 0, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0]],
        // Checkmark
        [[0, 0, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 1, 1, 0], [1, 0, 0, 0, 1, 1, 0, 0], [1, 1, 0, 1, 1, 0, 0, 0], [0, 1, 1, 1, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
        // X mark
        [[1, 1, 0, 0, 0, 0, 1, 1], [0, 1, 1, 0, 0, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 0, 0, 0, 0, 1, 1]],
        // Star
        [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 1]],
        // Heart
        [[0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]]
    ]
};

export interface LatentPoint {
    x: number;
    y: number;
    category: string;
    index: number;
    sample: SampleGrid;
}

export interface AutoencoderState {
    bottleneckSize: number;
    currentSample: SampleGrid | null;
    currentCategory: string | null;
    currentIndex: number | null;
    latentPoints: LatentPoint[];
    isTraining: boolean;
    lossValue: number;
    reconstructedSample: SampleGrid | null;
    currentLatentCode: number[];
}

export const INITIAL_STATE: AutoencoderState = {
    bottleneckSize: 4,
    currentSample: null,
    currentCategory: null,
    currentIndex: null,
    latentPoints: [],
    isTraining: false,
    lossValue: 0.00,
    reconstructedSample: null,
    currentLatentCode: []
};


// Pure Functions

export function simulateEncoding(bottleneckSize: number): number[] {
    const latentCode = [];
    for (let i = 0; i < bottleneckSize; i++) {
        latentCode.push(Math.random() * 2 - 1);
    }
    return latentCode;
}

export function simulateReconstruction(sample: SampleGrid): SampleGrid {
    return sample.map(row =>
        row.map(val => {
            const noise = (Math.random() - 0.5) * 0.3;
            return Math.max(0, Math.min(1, val + noise));
        })
    );
}

export function calculateMSE(original: SampleGrid, reconstructed: SampleGrid): number {
    let loss = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const diff = original[i][j] - reconstructed[i][j];
            loss += diff * diff;
        }
    }
    return loss / INPUT_SIZE;
}

export function generateLatentPoints(samples: SamplesMap): LatentPoint[] {
    const points: LatentPoint[] = [];

    // We want a deterministic generation based on index/category for visualization stability
    // unless randomness is desired. The original code used a hash function.
    for (const category in samples) {
        const categoryOffset = Object.keys(samples).indexOf(category) * 2;

        samples[category].forEach((sample, idx) => {
            const hash = (category.charCodeAt(0) * 100 + idx) / 1000;
            const x = Math.cos(hash * 10 + categoryOffset) * (1 + idx * 0.3);
            const y = Math.sin(hash * 15 + categoryOffset) * (1 + idx * 0.3);

            points.push({
                x, y, category, index: idx, sample
            });
        });
    }
    return points;
}

export function updateStateWithSample(state: AutoencoderState, category: string, index: number): AutoencoderState {
    const sample = SAMPLES[category][index];
    const latentCode = simulateEncoding(state.bottleneckSize);
    const reconstructed = simulateReconstruction(sample);
    const loss = calculateMSE(sample, reconstructed);

    return {
        ...state,
        currentCategory: category,
        currentIndex: index,
        currentSample: sample,
        currentLatentCode: latentCode,
        reconstructedSample: reconstructed,
        lossValue: loss
    };
}
