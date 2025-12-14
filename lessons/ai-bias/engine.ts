
export interface DataPoint {
    x: number;
    y: number;
    group: 'A' | 'B';
}

export interface Dataset {
    groupA: DataPoint[];
    groupB: DataPoint[];
    type: 'balanced' | 'biased';
}

export interface SimulationStats {
    groupAAccuracy: number;
    groupBAccuracy: number;
    disparity: number; // Difference in accuracy
}

/**
 * Pure function to generate a dataset
 */
export function generateDataset(type: 'balanced' | 'biased'): Dataset {
    const groupA: DataPoint[] = [];
    const groupB: DataPoint[] = [];

    // Configuration
    const countA = type === 'balanced' ? 50 : 80;
    const countB = type === 'balanced' ? 50 : 20;

    // Generate Group A (Blue)
    for (let i = 0; i < countA; i++) {
        groupA.push({
            x: 100 + Math.random() * 600,
            y: 100 + Math.random() * 200,
            group: 'A'
        });
    }

    // Generate Group B (Red)
    for (let i = 0; i < countB; i++) {
        groupB.push({
            x: 100 + Math.random() * 600,
            y: 100 + Math.random() * 200,
            group: 'B'
        });
    }

    return { groupA, groupB, type };
}

/**
 * Pure function to calculate simulation statistics based on dataset type.
 * In a real ML model, this would be the result of a test set evaluation.
 * Here we simulate the *expected* outcome of training on such data.
 */
export function calculateStats(dataset: Dataset): SimulationStats {
    if (dataset.type === 'balanced') {
        return {
            groupAAccuracy: 0.92,
            groupBAccuracy: 0.90,
            disparity: 0.02
        };
    } else {
        return {
            groupAAccuracy: 0.93,     // Slight boost due to more data
            groupBAccuracy: 0.64,     // Massive drop due to under-representation
            disparity: 0.29
        };
    }
}
