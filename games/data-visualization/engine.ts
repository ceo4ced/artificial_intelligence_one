
export interface DataPoint {
    x: number;
    y: number;
}

export interface Answer {
    text: string;
    correct: boolean;
}

export interface Question {
    question: string;
    answers: Answer[];
    hint: string;
}

export interface Scenario {
    title: string;
    description: string;
    xLabel: string;
    yLabel: string;
    type: string;
    strength: string;
    data: DataPoint[];
    questions: Question[];
}

export interface GameState {
    currentScenarioIndex: number;
    currentQuestionIndex: number;
    totalAnswered: number;
    totalCorrect: number;
    score: number;
    gameStarted: boolean;
}

export const INITIAL_STATE: GameState = {
    currentScenarioIndex: 0,
    currentQuestionIndex: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    score: 0,
    gameStarted: false
};

// Data Generation Functions
function generateCorrelatedData(count: number, correlation: number, xMin: number, xMax: number, yMin: number, yMax: number, noise: number): DataPoint[] {
    const data: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const y = yMin + correlation * ((x - xMin) / (xMax - xMin)) * (yMax - yMin) +
            (Math.random() - 0.5) * noise;
        data.push({
            x: Math.max(xMin, Math.min(xMax, x)),
            y: Math.max(yMin, Math.min(yMax, y))
        });
    }
    return data;
}

function generateClusteredData(): DataPoint[] {
    const data: DataPoint[] = [];
    // Cluster 1: Casual players
    for (let i = 0; i < 15; i++) {
        data.push({
            x: 8 + Math.random() * 8,
            y: 1000 + Math.random() * 2000
        });
    }
    // Cluster 2: Regular players
    for (let i = 0; i < 15; i++) {
        data.push({
            x: 10 + Math.random() * 10,
            y: 4000 + Math.random() * 3000
        });
    }
    // Cluster 3: Expert players
    for (let i = 0; i < 12; i++) {
        data.push({
            x: 12 + Math.random() * 8,
            y: 8000 + Math.random() * 2500
        });
    }
    return data;
}

function generateCurvedData(): DataPoint[] {
    const data: DataPoint[] = [];
    for (let i = 0; i < 40; i++) {
        const x = 4 + Math.random() * 8;
        const optimal = 7.5;
        const distance = Math.abs(x - optimal);
        const y = 100 - distance * distance * 5 + (Math.random() - 0.5) * 15;
        data.push({ x, y: Math.max(30, Math.min(100, y)) });
    }
    return data;
}

export const SCENARIOS: Scenario[] = [
    {
        title: "Study Time vs. Test Scores",
        description: "Students tracked their study hours and test scores",
        xLabel: "Study Hours",
        yLabel: "Test Score (%)",
        type: "positive",
        strength: "strong",
        data: generateCorrelatedData(30, 0.85, 10, 100, 0, 100, 20),
        questions: [
            {
                question: "What type of correlation does this scatterplot show?",
                answers: [
                    { text: "Strong positive correlation - more study time leads to higher scores", correct: true },
                    { text: "Negative correlation - more study time leads to lower scores", correct: false },
                    { text: "No correlation - study time doesn't affect scores", correct: false },
                    { text: "Weak positive correlation - study time barely affects scores", correct: false }
                ],
                hint: "Look at the overall trend - as study hours increase (moving right), what happens to test scores (moving up or down)?"
            },
            {
                question: "What can we conclude from this data?",
                answers: [
                    { text: "Students who study more tend to score higher on tests", correct: true },
                    { text: "Studying has no impact on test performance", correct: false },
                    { text: "Students should study less to score higher", correct: false },
                    { text: "All students score the same regardless of study time", correct: false }
                ],
                hint: "The pattern shows a clear upward trend from left to right."
            }
        ]
    },
    {
        title: "Car Age vs. Resale Value",
        description: "Used car prices based on vehicle age",
        xLabel: "Car Age (years)",
        yLabel: "Resale Value ($1000s)",
        type: "negative",
        strength: "strong",
        data: generateCorrelatedData(35, -0.8, 0, 10, 5, 40, 25),
        questions: [
            {
                question: "What relationship exists between car age and resale value?",
                answers: [
                    { text: "Strong negative correlation - older cars have lower resale values", correct: true },
                    { text: "Positive correlation - older cars are worth more", correct: false },
                    { text: "No correlation - age doesn't affect car value", correct: false },
                    { text: "Cars lose value initially then gain value", correct: false }
                ],
                hint: "As cars get older (moving right on the x-axis), observe what happens to their value (y-axis)."
            },
            {
                question: "Based on this pattern, what happens to a car's value over time?",
                answers: [
                    { text: "Cars depreciate (lose value) as they age", correct: true },
                    { text: "Cars appreciate (gain value) over time", correct: false },
                    { text: "Car value remains constant regardless of age", correct: false },
                    { text: "Value increases sharply after 5 years", correct: false }
                ],
                hint: "The downward trend shows the relationship between time and value."
            }
        ]
    },
    {
        title: "Temperature vs. Ice Cream Sales",
        description: "Daily ice cream sales at different temperatures",
        xLabel: "Temperature (°F)",
        yLabel: "Ice Cream Sales ($)",
        type: "positive",
        strength: "moderate",
        data: generateCorrelatedData(40, 0.7, 50, 100, 100, 800, 80),
        questions: [
            {
                question: "What pattern do you observe in this data?",
                answers: [
                    { text: "Moderate positive correlation - warmer days have higher ice cream sales", correct: true },
                    { text: "Negative correlation - people buy less ice cream when it's hot", correct: false },
                    { text: "Perfect correlation - temperature completely determines sales", correct: false },
                    { text: "No pattern - temperature doesn't affect ice cream sales", correct: false }
                ],
                hint: "Notice the general upward trend, though there's some scatter in the points."
            },
            {
                question: "Are there any outliers in this data?",
                answers: [
                    { text: "Yes, there are a few points that don't fit the general pattern", correct: true },
                    { text: "No, all points follow the exact same trend line", correct: false },
                    { text: "Every point is an outlier", correct: false },
                    { text: "Outliers don't exist in scatterplots", correct: false }
                ],
                hint: "Look for points that are far away from where most points cluster along the trend."
            }
        ]
    },
    {
        title: "Employee Experience vs. Salary",
        description: "Annual salary based on years of experience",
        xLabel: "Years of Experience",
        yLabel: "Annual Salary ($1000s)",
        type: "positive",
        strength: "strong",
        data: generateCorrelatedData(30, 0.82, 0, 20, 40, 120, 15),
        questions: [
            {
                question: "What story does this scatterplot tell?",
                answers: [
                    { text: "More experienced employees generally earn higher salaries", correct: true },
                    { text: "Experience has no impact on salary", correct: false },
                    { text: "Experienced employees earn less than newcomers", correct: false },
                    { text: "Everyone earns the same regardless of experience", correct: false }
                ],
                hint: "Follow the pattern from left (0 years) to right (20 years) and observe salary changes."
            },
            {
                question: "How would you describe the strength of this relationship?",
                answers: [
                    { text: "Strong relationship - experience is a good predictor of salary", correct: true },
                    { text: "Weak relationship - experience barely affects salary", correct: false },
                    { text: "No relationship - the points are randomly scattered", correct: false },
                    { text: "Perfect relationship - all points fall on one line", correct: false }
                ],
                hint: "Strong correlations have points tightly clustered around a trend line."
            }
        ]
    },
    {
        title: "Random Numbers",
        description: "Two sets of randomly generated numbers",
        xLabel: "Random Variable A",
        yLabel: "Random Variable B",
        type: "none",
        strength: "none",
        data: generateCorrelatedData(50, 0.05, 0, 100, 0, 100, 30),
        questions: [
            {
                question: "What correlation exists in this scatterplot?",
                answers: [
                    { text: "No correlation - the points show no clear pattern", correct: true },
                    { text: "Strong positive correlation", correct: false },
                    { text: "Strong negative correlation", correct: false },
                    { text: "Multiple distinct clusters", correct: false }
                ],
                hint: "Look for any upward or downward trend - is there one?"
            },
            {
                question: "What does this tell us about the relationship between these variables?",
                answers: [
                    { text: "These variables are independent - knowing one doesn't help predict the other", correct: true },
                    { text: "They are perfectly related", correct: false },
                    { text: "One causes the other to change", correct: false },
                    { text: "There's a hidden pattern we can't see", correct: false }
                ],
                hint: "When points are scattered randomly with no pattern, the variables are independent."
            }
        ]
    },
    {
        title: "Product Price vs. Quality Rating",
        description: "Customer quality ratings for products at different prices",
        xLabel: "Price ($)",
        yLabel: "Quality Rating (1-10)",
        type: "positive",
        strength: "weak",
        data: generateCorrelatedData(45, 0.35, 10, 200, 3, 10, 2),
        questions: [
            {
                question: "What can we say about the price-quality relationship?",
                answers: [
                    { text: "Weak positive correlation - higher prices somewhat relate to better quality", correct: true },
                    { text: "Strong correlation - expensive products are always better quality", correct: false },
                    { text: "Negative correlation - expensive products have worse quality", correct: false },
                    { text: "No correlation whatsoever", correct: false }
                ],
                hint: "There's a slight upward trend, but points are quite scattered."
            },
            {
                question: "Based on this data, is price a reliable predictor of quality?",
                answers: [
                    { text: "Not very reliable - there's high variability in quality at all price points", correct: true },
                    { text: "Very reliable - price perfectly predicts quality", correct: false },
                    { text: "Perfectly reliable - all expensive items have high ratings", correct: false },
                    { text: "Price and quality are completely unrelated", correct: false }
                ],
                hint: "Weak correlations mean one variable is not a strong predictor of the other."
            }
        ]
    },
    {
        title: "Advertising Spend vs. Sales Revenue",
        description: "Monthly sales revenue based on advertising expenditure",
        xLabel: "Ad Spend ($1000s)",
        yLabel: "Sales Revenue ($1000s)",
        type: "positive",
        strength: "strong",
        data: generateCorrelatedData(35, 0.88, 5, 50, 50, 500, 40),
        questions: [
            {
                question: "What does this scatterplot reveal about advertising?",
                answers: [
                    { text: "Strong positive correlation - more advertising leads to higher sales", correct: true },
                    { text: "Advertising has no effect on sales", correct: false },
                    { text: "Advertising decreases sales revenue", correct: false },
                    { text: "The relationship is completely random", correct: false }
                ],
                hint: "Observe how sales change as advertising spending increases."
            },
            {
                question: "If a company wanted to increase sales, what does this data suggest?",
                answers: [
                    { text: "Increasing advertising spend would likely increase sales revenue", correct: true },
                    { text: "They should decrease advertising spending", correct: false },
                    { text: "Advertising spending makes no difference", correct: false },
                    { text: "They should eliminate all advertising", correct: false }
                ],
                hint: "The strong positive correlation suggests a predictable relationship."
            }
        ]
    },
    {
        title: "Distance from City Center vs. Rent Price",
        description: "Monthly apartment rent based on distance from downtown",
        xLabel: "Distance from Center (miles)",
        yLabel: "Monthly Rent ($)",
        type: "negative",
        strength: "moderate",
        data: generateCorrelatedData(40, -0.65, 0, 15, 800, 2500, 180),
        questions: [
            {
                question: "What pattern exists in this housing data?",
                answers: [
                    { text: "Moderate negative correlation - rent decreases with distance from downtown", correct: true },
                    { text: "Positive correlation - rent increases with distance", correct: false },
                    { text: "No correlation - location doesn't affect rent", correct: false },
                    { text: "Perfect negative correlation - every mile costs the same", correct: false }
                ],
                hint: "As apartments get farther from the city center, what happens to rental prices?"
            },
            {
                question: "Why might this pattern exist?",
                answers: [
                    { text: "Downtown locations are more desirable, commanding higher rents", correct: true },
                    { text: "Distant apartments are more valuable", correct: false },
                    { text: "Location has no impact on housing costs", correct: false },
                    { text: "All apartments cost the same", correct: false }
                ],
                hint: "Consider why people might pay more to live closer to the city center."
            }
        ]
    },
    {
        title: "Student Age vs. Video Game Score",
        description: "High scores in a video game by player age",
        xLabel: "Player Age",
        yLabel: "High Score",
        type: "clusters",
        strength: "moderate",
        data: generateClusteredData(),
        questions: [
            {
                question: "What unique feature do you notice in this scatterplot?",
                answers: [
                    { text: "There are distinct clusters - possibly different skill groups", correct: true },
                    { text: "Perfect linear correlation", correct: false },
                    { text: "All points are outliers", correct: false },
                    { text: "No pattern exists", correct: false }
                ],
                hint: "Look for groups of points that cluster together rather than one continuous pattern."
            },
            {
                question: "What might these clusters represent?",
                answers: [
                    { text: "Different groups: casual players, regular players, and expert players", correct: true },
                    { text: "Measurement errors in the data", correct: false },
                    { text: "All players have identical skills", correct: false },
                    { text: "Random noise with no meaning", correct: false }
                ],
                hint: "Clusters often represent distinct subgroups within the population."
            }
        ]
    },
    {
        title: "Hours of Sleep vs. Productivity Score",
        description: "Daily productivity scores based on hours of sleep",
        xLabel: "Hours of Sleep",
        yLabel: "Productivity Score",
        type: "curved",
        strength: "moderate",
        data: generateCurvedData(),
        questions: [
            {
                question: "What unusual pattern do you observe?",
                answers: [
                    { text: "Non-linear relationship - productivity is highest at moderate sleep hours", correct: true },
                    { text: "Simple positive correlation - more sleep always means more productivity", correct: false },
                    { text: "Negative correlation - sleep reduces productivity", correct: false },
                    { text: "No relationship between sleep and productivity", correct: false }
                ],
                hint: "Look at the shape of the pattern - is it a straight line or curved?"
            },
            {
                question: "What does this data suggest about optimal sleep?",
                answers: [
                    { text: "There's an optimal range (around 7-8 hours) - too little or too much reduces productivity", correct: true },
                    { text: "More sleep is always better for productivity", correct: false },
                    { text: "Less sleep improves productivity", correct: false },
                    { text: "Sleep has no effect on productivity", correct: false }
                ],
                hint: "Notice how productivity peaks in the middle range of sleep hours."
            }
        ]
    }
];

export function checkAnswer(
    state: GameState,
    scenarioIndex: number,
    questionIndex: number,
    answerIndex: number
): { isCorrect: boolean; newState: GameState } {
    const scenario = SCENARIOS[scenarioIndex];
    if (!scenario) throw new Error("Invalid scenario index");

    const question = scenario.questions[questionIndex];
    const answer = question.answers[answerIndex];
    const isCorrect = answer.correct;

    const newState = { ...state };
    newState.totalAnswered++;
    if (isCorrect) {
        newState.totalCorrect++;
        newState.score += 100;
    }

    return { isCorrect, newState };
}
