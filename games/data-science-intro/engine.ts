
export interface DataPoint {
    x: number;
    y: number;
}

export interface Dataset {
    type: string;
    labels?: string[];
    values?: number[];
    points?: DataPoint[];
}

export interface Scenario {
    title: string;
    description: string;
    correct: string;
    explanation: string;
    wrongExplanation: string;
    data: Dataset;
}

export interface GameState {
    currentScenarioIndex: number;
    score: number;
    correctCount: number;
    answeredScenarios: number;
    isGameComplete: boolean;
}

export const INITIAL_STATE: GameState = {
    currentScenarioIndex: 0,
    score: 0,
    correctCount: 0,
    answeredScenarios: 0,
    isGameComplete: false
};

// Pure Helper to generate random correlated points (deterministic if seeded, but here we just use math)
export function generateCorrelatedPoints(count: number, correlation: number): DataPoint[] {
    const points: DataPoint[] = [];
    // Using a simple pseudo-random generator for reproducibility in tests could be better, 
    // but strictly speaking this function is 'pure' enough if we consider 'random' as just input generation. 
    // However, to make it testable, we might just return the logic or accept a seed. 
    // For now, I'll keep the logic simple, but move Math.random calls out if I wanted strict purity. 
    // In this context, generating data on demand is fine.

    for (let i = 0; i < count; i++) {
        // We will mock Math.random in tests if needed, or just test structure.
        const x = Math.random() * 80 + 10;
        const y = x * correlation + (Math.random() * 40) + 10;
        points.push({ x, y });
    }
    return points;
}

export const SCENARIOS: Scenario[] = [
    {
        title: 'Monthly Website Traffic',
        description: 'Data showing the number of visitors to a website each month from January to December.',
        correct: 'line',
        explanation: 'Line charts are perfect for time series data! They show trends over time and make it easy to spot patterns like seasonal changes or growth.',
        wrongExplanation: 'This is time series data showing change over months. A line chart would better show the trend and continuous nature of the data.',
        data: {
            type: 'time',
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            values: [2400, 2800, 3200, 3500, 4100, 4500, 4800, 4600, 4200, 3800, 3400, 5200]
        }
    },
    {
        title: 'Company Budget Breakdown',
        description: 'How a company allocates its $1M annual budget: Salaries (50%), Marketing (20%), R&D (15%), Operations (10%), Other (5%).',
        correct: 'pie',
        explanation: 'Pie charts excel at showing parts of a whole! When you need to see proportions and percentages that add up to 100%, pie charts are the way to go.',
        wrongExplanation: 'This data shows how parts make up a whole (100% of budget). A pie chart would instantly show these proportions visually.',
        data: {
            type: 'proportion',
            labels: ['Salaries', 'Marketing', 'R&D', 'Operations', 'Other'],
            values: [50, 20, 15, 10, 5]
        }
    },
    {
        title: 'Sales by Product Category',
        description: 'Comparing total sales across 5 different product categories: Electronics, Clothing, Food, Toys, and Books.',
        correct: 'bar',
        explanation: 'Bar charts are ideal for comparing discrete categories! They make it easy to see which category has the highest or lowest values at a glance.',
        wrongExplanation: 'This data compares different categories. A bar chart would make the comparison clearer and easier to read than other chart types.',
        data: {
            type: 'category',
            labels: ['Electronics', 'Clothing', 'Food', 'Toys', 'Books'],
            values: [85000, 62000, 43000, 51000, 38000]
        }
    },
    {
        title: 'Height vs Weight Correlation',
        description: 'Data from 40 people showing their height (inches) and weight (pounds) to see if there\'s a relationship.',
        correct: 'scatter',
        explanation: 'Scatter plots are perfect for finding relationships between two variables! Each point represents one person, and you can see if taller people tend to weigh more.',
        wrongExplanation: 'This data explores the relationship between two continuous variables. A scatter plot would reveal any correlation or pattern between height and weight.',
        data: {
            type: 'correlation',
            points: generateCorrelatedPoints(40, 0.7)
        }
    },
    {
        title: 'Quarterly Revenue Growth',
        description: 'Company revenue tracked over 12 quarters (3 years) showing business performance over time.',
        correct: 'line',
        explanation: 'Line charts show trends over time beautifully! They help you see growth patterns, seasonal variations, and overall trajectory.',
        wrongExplanation: 'Sequential time data like quarterly revenue is best shown with a line chart to visualize the growth trend clearly.',
        data: {
            type: 'time',
            labels: ['Q1 22', 'Q2 22', 'Q3 22', 'Q4 22', 'Q1 23', 'Q2 23', 'Q3 23', 'Q4 23', 'Q1 24', 'Q2 24', 'Q3 24', 'Q4 24'],
            values: [120, 135, 148, 165, 158, 172, 185, 195, 188, 205, 220, 240]
        }
    },
    {
        title: 'Market Share by Company',
        description: 'The smartphone market is divided among Apple (35%), Samsung (28%), Xiaomi (15%), Others (22%).',
        correct: 'pie',
        explanation: 'Pie charts are perfect for market share! They instantly show who has the biggest slice of the market and how it\'s divided.',
        wrongExplanation: 'Market share shows parts of a whole market. A pie chart is the standard way to visualize market distribution.',
        data: {
            type: 'proportion',
            labels: ['Apple', 'Samsung', 'Xiaomi', 'Others'],
            values: [35, 28, 15, 22]
        }
    },
    {
        title: 'Employee Count by Department',
        description: 'A comparison of how many employees work in each department: Sales, Engineering, Marketing, HR, and Finance.',
        correct: 'bar',
        explanation: 'Bar charts make category comparisons crystal clear! You can instantly see which departments are largest and smallest.',
        wrongExplanation: 'Comparing quantities across different departments is a classic use case for bar charts, not other types.',
        data: {
            type: 'category',
            labels: ['Sales', 'Engineering', 'Marketing', 'HR', 'Finance'],
            values: [45, 72, 28, 15, 22]
        }
    },
    {
        title: 'Study Time vs Test Scores',
        description: 'Data from 35 students showing hours studied and their test score to find if studying more helps.',
        correct: 'scatter',
        explanation: 'Scatter plots reveal relationships! You can see if there\'s a positive correlation (more studying = higher scores) or not.',
        wrongExplanation: 'To explore if two variables are related, scatter plots are the right tool. They show patterns and correlations clearly.',
        data: {
            type: 'correlation',
            points: generateCorrelatedPoints(35, 0.8)
        }
    },
    {
        title: 'Daily Temperature Over 2 Weeks',
        description: 'Temperature readings (in °F) recorded each day for 14 consecutive days.',
        correct: 'line',
        explanation: 'Line charts are excellent for continuous time-based measurements! They show the flow and variation of temperature over time.',
        wrongExplanation: 'Daily temperature is continuous time series data. Line charts connect the points to show the temperature trend.',
        data: {
            type: 'time',
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            values: [72, 75, 78, 76, 74, 71, 69, 70, 73, 76, 79, 82, 80, 77]
        }
    },
    {
        title: 'Survey: Favorite Ice Cream Flavor',
        description: 'Survey results showing what percentage of people chose each flavor: Chocolate (30%), Vanilla (25%), Strawberry (20%), Mint (15%), Other (10%).',
        correct: 'pie',
        explanation: 'Pie charts are ideal for survey results showing preferences! Each slice represents what portion of respondents chose each option.',
        wrongExplanation: 'Survey percentages that sum to 100% are perfectly suited for pie charts, which show parts of the whole survey.',
        data: {
            type: 'proportion',
            labels: ['Chocolate', 'Vanilla', 'Strawberry', 'Mint', 'Other'],
            values: [30, 25, 20, 15, 10]
        }
    }
];

export function getChartName(type: string): string {
    const names: { [key: string]: string } = {
        bar: '📊 Bar Chart View',
        line: '📈 Line Chart View',
        pie: '🥧 Pie Chart View',
        scatter: '⚫ Scatter Plot View'
    };
    return names[type] || 'Unknown';
}

export function processAnswer(
    state: GameState,
    selectedChart: string,
    scenario: Scenario
): { newState: GameState; isCorrect: boolean } {
    const isCorrect = selectedChart === scenario.correct;

    let newScore = state.score;
    let newCorrectCount = state.correctCount;
    let newAnsweredScenarios = state.answeredScenarios + 1;

    if (isCorrect) {
        newScore += 100;
        newCorrectCount++;
    }

    return {
        newState: {
            ...state,
            score: newScore,
            correctCount: newCorrectCount,
            answeredScenarios: newAnsweredScenarios
        },
        isCorrect
    };
}

export function advanceScenario(state: GameState, totalScenarios: number): GameState {
    const nextIndex = state.currentScenarioIndex + 1;
    const isComplete = nextIndex >= totalScenarios;

    return {
        ...state,
        currentScenarioIndex: nextIndex,
        isGameComplete: isComplete
    };
}

export function formatValue(value: number): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
}
