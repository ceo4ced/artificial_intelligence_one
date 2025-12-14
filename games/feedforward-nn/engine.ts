
export type DatasetType = 'xor' | 'circle' | 'spiral' | 'blobs';

export interface Point {
    x: number;
    y: number;
    label: number;
}

export interface GameState {
    currentDataset: DatasetType;
    architecture: number[]; // [input, hidden1, hidden2, output]
    trainingData: Point[];
    testData: Point[];
    trained: boolean;
    epochs: number;
    score: number;
    trainAccuracy: number;
    testAccuracy: number;
}

export const DATASET_CONFIG = {
    xor: { target: 95, description: 'Achieve 95% accuracy on XOR (non-linear problem)' },
    circle: { target: 90, description: 'Achieve 90% accuracy on Circle dataset' },
    spiral: { target: 85, description: 'Achieve 85% accuracy on Spiral (hardest!)' },
    blobs: { target: 95, description: 'Achieve 95% accuracy on Blobs (easiest)' }
};

export const INITIAL_STATE: GameState = {
    currentDataset: 'xor',
    architecture: [2, 4, 4, 2],
    trainingData: [],
    testData: [],
    trained: false,
    epochs: 0,
    score: 0,
    trainAccuracy: 0,
    testAccuracy: 0
};

export function generatePoint(dataset: DatasetType): Point {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    let label = 0;

    switch (dataset) {
        case 'xor':
            label = (x > 0) !== (y > 0) ? 1 : 0;
            break;
        case 'circle':
            const dist = Math.sqrt(x * x + y * y);
            label = dist < 0.6 ? 0 : 1;
            break;
        case 'spiral':
            const angle = Math.atan2(y, x) + Math.PI;
            const radius = Math.sqrt(x * x + y * y);
            label = (angle + radius * 3) % (Math.PI * 2) < Math.PI ? 0 : 1;
            break;
        case 'blobs':
            label = (x > 0 && y > 0) || (x < 0 && y < 0) ? 1 : 0;
            break;
    }

    return { x, y, label };
}

export function generateData(dataset: DatasetType, count: number = 200): { training: Point[], test: Point[] } {
    const training: Point[] = [];
    const test: Point[] = [];
    const trainingCount = Math.floor(count * 0.75);

    for (let i = 0; i < count; i++) {
        const point = generatePoint(dataset);
        if (i < trainingCount) training.push(point);
        else test.push(point);
    }
    return { training, test };
}

export function predictClass(dataset: DatasetType, x: number, y: number): number {
    // Ground truth prediction
    // Note: generatePoint generates random x,y. We check label for specific input x,y here.

    switch (dataset) {
        case 'xor':
            return (x > 0) !== (y > 0) ? 1 : 0;
        case 'circle':
            return Math.sqrt(x * x + y * y) < 0.6 ? 0 : 1;
        case 'spiral':
            const angle = Math.atan2(y, x) + Math.PI;
            const radius = Math.sqrt(x * x + y * y);
            return (angle + radius * 3) % (Math.PI * 2) < Math.PI ? 0 : 1;
        case 'blobs':
            return (x > 0 && y > 0) || (x < 0 && y < 0) ? 1 : 0;
    }
    return 0;
}

export function calculateSimulationResult(dataset: DatasetType, architecture: number[]): { accuracy: number, epochs: number } {
    const epochs = Math.floor(Math.random() * 50) + 50;
    const totalHidden = architecture.slice(1, -1).reduce((a, b) => a + b, 0);
    let baseAccuracy = 50;

    switch (dataset) {
        case 'xor':
            baseAccuracy = totalHidden >= 2 ? 90 + Math.random() * 10 : 50 + Math.random() * 30;
            break;
        case 'circle':
            baseAccuracy = totalHidden >= 3 ? 85 + Math.random() * 10 : 60 + Math.random() * 25;
            break;
        case 'spiral':
            baseAccuracy = totalHidden >= 8 ? 80 + Math.random() * 10 : 50 + Math.random() * 30;
            break;
        case 'blobs':
            baseAccuracy = 90 + Math.random() * 10;
            break;
    }

    const accuracy = Math.min(99, baseAccuracy);
    return { accuracy, epochs };
}

export function calculateTestScore(
    dataset: DatasetType,
    architecture: number[],
    trainAccuracy: number
): { testAccuracy: number, scoreIncrement: number, success: boolean } {
    const testAccuracy = trainAccuracy - Math.random() * 5;
    const target = DATASET_CONFIG[dataset].target;
    let scoreIncrement = 0;
    let success = false;

    if (testAccuracy >= target) {
        success = true;
        const bonus = Math.floor((testAccuracy - target) * 10);
        const neuronPenalty = architecture.reduce((a, b) => a + b, 0);
        scoreIncrement = Math.max(100 - neuronPenalty + bonus, 0);
    }

    return { testAccuracy, scoreIncrement, success };
}
