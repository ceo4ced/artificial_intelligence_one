
export interface Challenge {
    title: string;
    dimensions: string[];
    targetDims: number;
    description: string;
    hint: string;
    importance: number[];
}

export interface GameState {
    currentChallengeIndex: number;
    score: number;
    totalVarianceAccumulated: number;
    challengesCompleted: number;
}

export const INITIAL_STATE: GameState = {
    currentChallengeIndex: 0,
    score: 0,
    totalVarianceAccumulated: 0,
    challengesCompleted: 0
};

export const CHALLENGES: Challenge[] = [
    {
        title: "Introduction: 3D to 2D",
        dimensions: ['Height', 'Weight', 'Age'],
        targetDims: 2,
        description: "Reduce 3 dimensions to 2. Which dimension is least important?",
        hint: "Look at which dimension has the least variation in the data.",
        importance: [85, 90, 45]
    },
    {
        title: "Customer Data: 4D to 2D",
        dimensions: ['Income', 'Spending Score', 'Age', 'Account Age (days)'],
        targetDims: 2,
        description: "Reduce customer data from 4 dimensions to 2 for clustering.",
        hint: "Income and Spending Score likely contain the most information for customer segmentation.",
        importance: [90, 95, 60, 40]
    },
    {
        title: "Image Compression: 5D to 3D",
        dimensions: ['Red', 'Green', 'Blue', 'Brightness', 'Saturation'],
        targetDims: 3,
        description: "Compress color data while preserving visual quality.",
        hint: "RGB channels are fundamental, but Brightness and Saturation are derived from them.",
        importance: [95, 95, 95, 50, 55]
    },
    {
        title: "Sensor Data: 6D to 3D",
        dimensions: ['Temp', 'Humidity', 'Pressure', 'Wind Speed', 'Wind Dir', 'Dewpoint'],
        targetDims: 3,
        description: "Reduce weather sensor data for efficient storage.",
        hint: "Some weather metrics are highly correlated (dewpoint relates to temp & humidity).",
        importance: [90, 85, 80, 75, 40, 35]
    },
    {
        title: "Text Features: 8D to 4D",
        dimensions: ['Word Count', 'Unique Words', 'Avg Word Len', 'Sentence Count', 'Char Count', 'Stop Words', 'Punctuation', 'Capital Letters'],
        targetDims: 4,
        description: "Compress text features for document classification.",
        hint: "Character count and word count are highly correlated. Same with stop words and word count.",
        importance: [85, 90, 75, 80, 40, 45, 50, 35]
    },
    {
        title: "Final Challenge: 10D to 5D",
        dimensions: ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9', 'X10'],
        targetDims: 5,
        description: "Reduce complex dataset while preserving 80%+ variance.",
        hint: "Try to identify which dimensions capture the most unique information.",
        importance: [92, 88, 85, 82, 78, 55, 52, 48, 40, 35]
    }
];

export interface ReductionResult {
    preservedVariance: number;
    maxPossibleVariance: number; // Sum of all importance scores
    optimalVariance: number;     // Sum of top N importance scores
    efficiency: number;          // preserved / optimal * 100
    percentagePreserved: number; // preserved / maxPossible * 100
    points: number;
    isOptimal: boolean;
    optimalPercentage: number;
    sortedImportance: { imp: number, i: number }[];
}

export function calculateReduction(challenge: Challenge, selectedIndices: Set<number>): ReductionResult {
    let preservedVariance = 0;
    let totalVariance = 0;

    challenge.importance.forEach((imp, i) => {
        totalVariance += imp;
        if (selectedIndices.has(i)) {
            preservedVariance += imp;
        }
    });

    const sortedImportance = challenge.importance
        .map((imp, i) => ({ imp, i }))
        .sort((a, b) => b.imp - a.imp);

    const topN = sortedImportance.slice(0, challenge.targetDims);
    const optimalVariance = topN.reduce((sum, d) => sum + d.imp, 0);

    const percentagePreserved = Math.round((preservedVariance / totalVariance) * 100);
    const optimalPercentage = Math.round((optimalVariance / totalVariance) * 100);
    const efficiency = (preservedVariance / optimalVariance) * 100;

    let points = 0;
    if (efficiency >= 95) points = 100;
    else if (efficiency >= 85) points = 80;
    else if (efficiency >= 75) points = 60;
    else if (efficiency >= 60) points = 40;
    else points = 20;

    return {
        preservedVariance,
        maxPossibleVariance: totalVariance,
        optimalVariance,
        efficiency,
        percentagePreserved,
        points,
        isOptimal: efficiency >= 99.9,
        optimalPercentage,
        sortedImportance: topN
    };
}
