
export interface Interview {
    name: string;
    age: number;
    occupation: string;
    quotes: string[];
    painPoints: string[];
    goals: string[];
    behaviors: string[];
}

export interface QuoteMatch {
    text: string;
    correctPersona: number;
}

export interface Scenario {
    title: string;
    interviews: Interview[];
    matchingQuotes: QuoteMatch[];
}

export interface GameState {
    currentScenario: number;
    currentPhase: number;
    score: number;
    totalCorrect: number;
    totalAttempts: number;
}

export const SCENARIOS: Scenario[] = [
    {
        title: "Food Delivery App Research",
        interviews: [
            {
                name: "Sarah",
                age: 28,
                occupation: "Marketing Manager",
                quotes: [
                    "I order food at least 3 times a week because I work late hours.",
                    "I hate when apps have too many steps - I just want to order quickly.",
                    "Price isn't my main concern, I just want quality food delivered fast.",
                    "I usually order from the same 3-4 restaurants because I know they're reliable."
                ],
                painPoints: ["Complex checkout process", "Unreliable delivery times"],
                goals: ["Quick ordering", "Reliable service"],
                behaviors: ["Orders frequently", "Values speed over price"]
            },
            {
                name: "Mike",
                age: 22,
                occupation: "College Student",
                quotes: [
                    "I'm always looking for deals and coupons before ordering.",
                    "I split orders with my roommates to save on delivery fees.",
                    "Sometimes I wait an hour for food but that's okay if it's cheap.",
                    "I try different restaurants based on what's on sale each week."
                ],
                painPoints: ["High delivery fees", "Can't easily split bills"],
                goals: ["Save money", "Share costs with friends"],
                behaviors: ["Price-conscious", "Orders less frequently", "Waits for deals"]
            },
            {
                name: "Lisa",
                age: 45,
                occupation: "Teacher",
                quotes: [
                    "I order family dinners on weekends when I don't want to cook.",
                    "I need to feed 4 people so portion size and value matter a lot.",
                    "I'm not very tech-savvy, so simple apps are better for me.",
                    "I always read reviews carefully before trying a new restaurant."
                ],
                painPoints: ["Small portion sizes", "Complex interfaces", "Lack of family meal options"],
                goals: ["Feed whole family", "Easy-to-use app"],
                behaviors: ["Orders for multiple people", "Reads reviews", "Prefers simple interfaces"]
            }
        ],
        matchingQuotes: [
            { text: "I need a family meal deal for 4 people", correctPersona: 2 },
            { text: "Do you have any 20% off promo codes right now?", correctPersona: 1 },
            { text: "Can I reorder from my favorites list with one click?", correctPersona: 0 },
            { text: "This checkout has too many screens, I'm giving up", correctPersona: 0 },
            { text: "Is there a student discount available?", correctPersona: 1 },
            { text: "The interface is too complicated for me", correctPersona: 2 }
        ]
    }
];

export const INITIAL_STATE: GameState = {
    currentScenario: 0,
    currentPhase: 0,
    score: 0,
    totalCorrect: 0,
    totalAttempts: 0
};

export function submitAnalysis(state: GameState, painPoints: string, goals: string, behaviors: string): { newState: GameState, points: number, valid: boolean } {
    if (!painPoints || !goals || !behaviors) {
        return { newState: state, points: 0, valid: false };
    }

    const points = 20;
    const newState = {
        ...state,
        score: state.score + points,
        totalCorrect: state.totalCorrect + 1,
        totalAttempts: state.totalAttempts + 1
    };

    return { newState, points, valid: true };
}

export function submitQuoteMatches(state: GameState, matches: { quoteIndex: number, personaIndex: number }[]): { newState: GameState, points: number, correctCount: number, matchesResults: boolean[] } {
    const scenario = SCENARIOS[state.currentScenario];
    let correctCount = 0;
    const matchesResults: boolean[] = new Array(matches.length).fill(false);

    matches.forEach((match, index) => {
        const correctPersonaIndex = scenario.matchingQuotes[match.quoteIndex].correctPersona;
        if (match.personaIndex === correctPersonaIndex) {
            correctCount++;
            matchesResults[index] = true;
        }
    });

    const points = correctCount * 15;
    const newState = {
        ...state,
        score: state.score + points,
        totalCorrect: state.totalCorrect + correctCount,
        totalAttempts: state.totalAttempts + scenario.matchingQuotes.length
    };

    return { newState, points, correctCount, matchesResults };
}

export function submitFinalInsights(state: GameState, priority: string, hmw: string): { newState: GameState, points: number, valid: boolean } {
    if (!priority || !hmw) {
        return { newState: state, points: 0, valid: false };
    }

    const points = 30;
    const newState = {
        ...state,
        score: state.score + points
    };

    return { newState, points, valid: true };
}

export function nextPhase(state: GameState): GameState {
    return {
        ...state,
        currentPhase: state.currentPhase + 1
    };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE };
}
