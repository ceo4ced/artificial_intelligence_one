
export interface Point {
    day: number;
    price: number;
}

export interface StockProfile {
    base: number;
    growth: number;
    volatility: number;
    name: string;
}

export interface Difficulty {
    noise: number;
    pointCount: number;
}

export interface RegressionResult {
    slope: number;
    intercept: number;
    day11Price: number;
}

export interface GameState {
    round: number;
    totalScore: number;
    errors: number[];
    bestAccuracy: number;
    currentStock: string;
    difficulty: string;
    stockData: Point[];
    lastRegression: RegressionResult;
}

export const STOCK_PROFILES: Record<string, StockProfile> = {
    TECH: { base: 100, growth: 3, volatility: 5, name: 'Tech Corp' },
    RETAIL: { base: 50, growth: 1, volatility: 3, name: 'Retail Inc' },
    ENERGY: { base: 150, growth: -2, volatility: 8, name: 'Energy Co' }
};

export const DIFFICULTY_SETTINGS: Record<string, Difficulty> = {
    easy: { noise: 2, pointCount: 10 },
    medium: { noise: 5, pointCount: 10 },
    hard: { noise: 10, pointCount: 10 }
};

export const INITIAL_STATE: GameState = {
    round: 1,
    totalScore: 0,
    errors: [],
    bestAccuracy: 0,
    currentStock: 'TECH',
    difficulty: 'easy',
    stockData: [],
    lastRegression: { slope: 0, intercept: 0, day11Price: 0 }
};

// Pure calculation
export function calculateRegression(data: Point[]): RegressionResult {
    const n = data.length;
    if (n === 0) return { slope: 0, intercept: 0, day11Price: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach(point => {
        sumX += point.day;
        sumY += point.price;
        sumXY += point.day * point.price;
        sumX2 += point.day * point.day;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const day11Price = slope * 11 + intercept;

    return { slope, intercept, day11Price };
}

// Data generation (impure source of randomness, returns pure data)
export function generateStockData(stockKey: string, diffKey: string): Point[] {
    const profile = STOCK_PROFILES[stockKey];
    const settings = DIFFICULTY_SETTINGS[diffKey];
    const data: Point[] = [];

    for (let day = 1; day <= settings.pointCount; day++) {
        const trend = profile.base + profile.growth * day;
        // Random noise
        const noise = (Math.random() - 0.5) * settings.noise * 2;
        const price = trend + noise;
        data.push({ day, price });
    }
    return data;
}

export function startNewRound(state: GameState, stockKey?: string, diffKey?: string): GameState {
    const stock = stockKey || state.currentStock;
    const diff = diffKey || state.difficulty;

    // Logic: if changing settings, reset round count? 
    // Original game logic: selectStock calls newRound(). 
    // newRound() increments round.

    const newData = generateStockData(stock, diff);
    const regression = calculateRegression(newData);

    return {
        ...state,
        currentStock: stock,
        difficulty: diff,
        round: state.round + 1, // Or reset if requested? 
        stockData: newData,
        lastRegression: regression
    };
}

export function checkPrediction(state: GameState, userPrediction: number): {
    newState: GameState,
    score: number,
    accuracy: number,
    error: number
} {
    const actual = state.lastRegression.day11Price;
    const error = Math.abs(userPrediction - actual);

    const errorPercent = (error / actual) * 100;
    const roundScore = Math.max(0, Math.round(1000 * (1 - errorPercent / 100)));
    const accuracy = Math.max(0, 100 - errorPercent);

    const newBestAccuracy = Math.max(state.bestAccuracy, accuracy);

    return {
        newState: {
            ...state,
            totalScore: state.totalScore + roundScore,
            errors: [...state.errors, error],
            bestAccuracy: newBestAccuracy
        },
        score: roundScore,
        accuracy,
        error
    };
}
