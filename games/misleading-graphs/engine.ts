
export interface GraphScenario {
    id: string;
    title: string;
    issues: string[];
    explanation: string;
}

export interface GameState {
    currentGraphIndex: number;
    totalAnalyzed: number;
    totalPerfect: number;
    score: number;
    gameStarted: boolean;
    isGameComplete: boolean;
}

export const INITIAL_STATE: GameState = {
    currentGraphIndex: 0,
    totalAnalyzed: 0,
    totalPerfect: 0,
    score: 0,
    gameStarted: false,
    isGameComplete: false
};

export const ALL_ISSUES = [
    'Truncated Y-Axis',
    'Cherry-Picked Data Range',
    'Misleading Dual Axes',
    '3D Distortion',
    'Missing Labels/Context',
    'Wrong Chart Type',
    'Inconsistent Scale',
    'Exaggerated Visual Size'
];

export const SCENARIOS: GraphScenario[] = [
    {
        id: 'sales-skyrocket',
        title: "Monthly Sales 'Skyrocket'",
        issues: ['Truncated Y-Axis', 'Exaggerated Visual Size'],
        explanation: "The y-axis starts at 95 instead of 0, making a 3% increase look like a massive jump. Always check if the y-axis starts at zero to see the true scale of change."
    },
    {
        id: 'stock-rising',
        title: "Stock Performance - 'Rising Trend'",
        issues: ['Cherry-Picked Data Range', 'Missing Labels/Context'],
        explanation: "Only showing Q1 data hides the full-year decline. The graph cherry-picks a favorable time period while hiding the bigger picture. Always ask to see the complete dataset."
    },
    {
        id: 'ice-cream-drowning',
        title: "Ice Cream Sales Cause Drowning!",
        issues: ['Misleading Dual Axes', 'Wrong Chart Type'],
        explanation: "Different scales on the dual axes create a false correlation. When plotted on the same scale, there's no real relationship - this is a classic spurious correlation."
    },
    {
        id: 'market-share',
        title: "Market Share Comparison",
        issues: ['3D Distortion', 'Wrong Chart Type', 'Exaggerated Visual Size'],
        explanation: "3D perspective distorts the visual proportions. The front slice appears much larger than it actually is. A simple 2D chart shows the true proportions clearly."
    },
    {
        id: 'climate-data',
        title: "Temperature Increase - Climate Data",
        issues: ['Truncated Y-Axis', 'Cherry-Picked Data Range', 'Missing Labels/Context'],
        explanation: "Truncated axis starting at 58°F makes a 2° change look extreme. Also shows only recent years without historical context. The honest version shows the full scale and longer timeframe."
    },
    {
        id: 'revenue-growth',
        title: "Company Revenue Growth",
        issues: ['Inconsistent Scale', 'Exaggerated Visual Size'],
        explanation: "The bar widths and spacing are inconsistent, creating visual distortion. The bars should all be the same width with equal spacing to allow fair comparison."
    },
    {
        id: 'employment-stats',
        title: "Employment Statistics",
        issues: ['Truncated Y-Axis', 'Missing Labels/Context', 'Exaggerated Visual Size'],
        explanation: "Y-axis starts at 90% instead of 0%, making a small 2% change look massive. Missing proper labels and context about what the percentages represent."
    },
    {
        id: 'product-comparison',
        title: "Product Comparison - Size vs Performance",
        issues: ['Exaggerated Visual Size', 'Wrong Chart Type', '3D Distortion'],
        explanation: "Using circles/bubbles to show doubling values actually quadruples the visual area (πr²), exaggerating differences. A bar chart shows the true 2x difference clearly."
    },
    {
        id: 'medication-study',
        title: "Medication Effectiveness Study",
        issues: ['Cherry-Picked Data Range', 'Truncated Y-Axis', 'Missing Labels/Context'],
        explanation: "Shows only successful age groups and uses truncated axis. The complete data reveals the medication works for only a small subset of patients."
    },
    {
        id: 'crime-rate',
        title: "Crime Rate - 'Dangerous Spike'",
        issues: ['Truncated Y-Axis', 'Cherry-Picked Data Range', 'Exaggerated Visual Size'],
        explanation: "Truncated y-axis starting at 95 crimes and showing only 3 months makes normal variation look like a crime wave. The full year with proper scale shows stable rates."
    }
];

export interface AnswerResult {
    pointsEarned: number;
    isPerfect: boolean;
    correctIssues: Set<string>;
    missedIssues: number;
    selectedCorrectCount: number;
    selectedIncorrectCount: number;
    newState: GameState;
}

export function checkAnswer(
    state: GameState,
    scenario: GraphScenario,
    selectedIssues: Set<string>
): AnswerResult {
    const correctIssues = new Set(scenario.issues);

    // Calculate score
    const selectedCorrectCount = [...selectedIssues].filter(issue => correctIssues.has(issue)).length;
    const selectedIncorrectCount = selectedIssues.size - selectedCorrectCount;
    const missedIssues = scenario.issues.length - selectedCorrectCount;

    const isPerfect = selectedIssues.size === correctIssues.size &&
        [...selectedIssues].every(issue => correctIssues.has(issue));

    // Scoring: 100 for perfect, 50 for partial (if mostly correct), 0 for completely wrong
    // Original logic: if (selectedCorrect > 0 && selectedCorrect >= missedIssues) -> 50
    // This implies finding at least more than half of them? 
    // Example: 3 issues. Find 2. Missed 1. 2 >= 1. 50 points.
    // Example: 3 issues. Find 1. Missed 2. 1 < 2. 0 points.

    let pointsEarned = 0;
    if (isPerfect) {
        pointsEarned = 100;
    } else if (selectedCorrectCount > 0 && selectedCorrectCount >= missedIssues) {
        pointsEarned = 50;
    }

    const newState = {
        ...state,
        totalAnalyzed: state.totalAnalyzed + 1,
        totalPerfect: isPerfect ? state.totalPerfect + 1 : state.totalPerfect,
        score: state.score + pointsEarned
    };

    return {
        pointsEarned,
        isPerfect,
        correctIssues,
        missedIssues,
        selectedCorrectCount,
        selectedIncorrectCount,
        newState
    };
}

export function calculateAccuracy(perfect: number, total: number): number {
    return total > 0 ? Math.round((perfect / total) * 100) : 0;
}
